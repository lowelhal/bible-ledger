import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export const SUPPORTED_TRANSLATIONS = [
  { id: 'KJV', name: 'King James Version', helloAoId: 'eng_kjv', available: true, local: true },
  { id: 'BSB', name: 'Berean Standard Bible', helloAoId: 'BSB', available: true, local: false },
  
  // Unavailable Copyrighted Versions
  { id: 'NKJV', name: 'New King James Version', helloAoId: null, available: false, local: false },
  { id: 'NIV', name: 'New International Version', helloAoId: null, available: false, local: false },
  { id: 'ESV', name: 'English Standard Version', helloAoId: null, available: false, local: false },
];

@Injectable()
export class BibleService {
  private readonly baseUrl = process.env.BIBLE_API_URL || 'https://bible.helloao.org/api';
  private localKjvData: any = null;

  constructor() {
    this.loadLocalKjvData();
  }

  private loadLocalKjvData() {
    try {
      const kjvPath = path.join(__dirname, '..', '..', 'src', 'bible', 'eng_kjv.json');
      if (fs.existsSync(kjvPath)) {
        const rawData = fs.readFileSync(kjvPath, 'utf8');
        this.localKjvData = JSON.parse(rawData);
        console.log('Local KJV Bible data loaded successfully.');
      } else {
        console.warn('Local KJV JSON file not found at:', kjvPath);
      }
    } catch (error) {
      console.error('Error loading local KJV Bible data:', error);
    }
  }

  async getTranslations() {
    return SUPPORTED_TRANSLATIONS.map(t => ({
      id: t.id,
      name: t.name,
      available: t.available
    }));
  }

  async getPassage(translationId: string, book: string, chapter: number, startVerse?: number, endVerse?: number) {
    const normalizedTranslation = translationId.toUpperCase();
    const translationInfo = SUPPORTED_TRANSLATIONS.find(t => t.id === normalizedTranslation);

    if (!translationInfo) {
      throw new HttpException(`Translation ${translationId} is not supported.`, HttpStatus.BAD_REQUEST);
    }

    if (!translationInfo.available) {
      throw new HttpException(`Translation ${translationId} is currently not available due to copyright restrictions.`, HttpStatus.NOT_FOUND);
    }

    // Use local data if configured
    if (translationInfo.local && translationInfo.id === 'KJV' && this.localKjvData) {
      return this.getLocalPassage(book, chapter, startVerse, endVerse);
    }

    // Otherwise, attempt to fetch from HelloAO Free Use API
    try {
      const bookId = this.getBookId(book);
      const url = `${this.baseUrl}/${translationInfo.helloAoId}/${bookId}/${chapter}.json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(`Failed to fetch passage from external Bible API (Status: ${response.status})`, HttpStatus.BAD_GATEWAY);
      }

      const data = await response.json();
      
      // Parse HelloAO chapter response structure
      let verses = [];
      if (data.chapter && Array.isArray(data.chapter.content)) {
        verses = data.chapter.content
          .filter((item: any) => item.type === 'verse')
          .map((item: any) => {
             // Extract text recursively if content is nested
             const extractText = (contentArr: any[]): string => {
                return contentArr.map(c => typeof c === 'string' ? c : (c.text || '')).join('');
             };
             return {
                id: `${book}-${chapter}-${item.number}`,
                verse_num: item.number,
                text: extractText(item.content)
             };
          });
      }

      // Filter verses if start/end verses are provided
      if (startVerse) verses = verses.filter((v: any) => v.verse_num >= startVerse);
      if (endVerse) verses = verses.filter((v: any) => v.verse_num <= endVerse);

      if (verses.length === 0) {
        throw new HttpException(`No verses found for ${book} ${chapter}`, HttpStatus.NOT_FOUND);
      }

      return {
        translation: translationId.toUpperCase(),
        book,
        chapter,
        verses,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error fetching from Bible API:', error);
      throw new HttpException('Internal Server Error while fetching bible passage', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async search(query: string, translationId: string = 'KJV') {
    const normalizedTranslation = translationId.toUpperCase();
    const translationInfo = SUPPORTED_TRANSLATIONS.find(t => t.id === normalizedTranslation);

    if (!translationInfo) {
      throw new HttpException(`Translation ${translationId} is not supported.`, HttpStatus.BAD_REQUEST);
    }

    if (!translationInfo.available) {
      throw new HttpException(`Translation ${translationId} is currently not available due to copyright restrictions.`, HttpStatus.NOT_FOUND);
    }

    // Perform quick local search if local data is supported and available
    if (translationInfo.local && translationInfo.id === 'KJV' && this.localKjvData) {
      return this.searchLocalKjv(query);
    }

    // Since HelloAO Free Use API does not have a search endpoint,
    // and we don't have local data for this translation, we cannot search.
    throw new HttpException(`Search is currently only supported for local translations (e.g. KJV). The external API for ${translationId} does not support searching.`, HttpStatus.BAD_REQUEST);
  }

  private getLocalPassage(bookName: string, chapterNum: number, startVerse?: number, endVerse?: number) {
    const book = this.localKjvData.books.find((b: any) => 
      b.name.toLowerCase() === bookName.toLowerCase() || b.id.toLowerCase() === bookName.toLowerCase()
    );

    if (!book) throw new HttpException(`Book ${bookName} not found`, HttpStatus.NOT_FOUND);

    const chapterData = book.chapters.find((c: any) => c.chapter.number === chapterNum);
    
    if (!chapterData) throw new HttpException(`Chapter ${chapterNum} not found in ${bookName}`, HttpStatus.NOT_FOUND);

    let verses = chapterData.chapter.content
      .filter((item: any) => item.type === 'verse')
      .map((item: any) => {
         const extractText = (contentArr: any[]): string => {
            return contentArr.map(c => typeof c === 'string' ? c : (c.text || '')).join('');
         };
         return {
            id: `${book.id}-${chapterNum}-${item.number}`,
            verse_num: item.number,
            text: extractText(item.content)
         };
      });

    if (startVerse) verses = verses.filter((v: any) => v.verse_num >= startVerse);
    if (endVerse) verses = verses.filter((v: any) => v.verse_num <= endVerse);

    return {
      translation: 'KJV',
      book: book.name,
      chapter: chapterNum,
      verses,
    };
  }

  private searchLocalKjv(query: string) {
    const results: any[] = [];
    const searchRegex = new RegExp(query, 'i');
    const MAX_RESULTS = 50;

    for (const book of this.localKjvData.books) {
      for (const chapterData of book.chapters) {
        const verses = chapterData.chapter.content.filter((item: any) => item.type === 'verse');
        for (const verse of verses) {
          const extractText = (contentArr: any[]): string => {
            return contentArr.map(c => typeof c === 'string' ? c : (c.text || '')).join('');
          };
          
          const text = extractText(verse.content);
          if (searchRegex.test(text)) {
            results.push({
              id: `${book.id}-${chapterData.chapter.number}-${verse.number}`,
              verse_num: verse.number,
              text: text,
              reference: `${book.name} ${chapterData.chapter.number}:${verse.number}`
            });
            if (results.length >= MAX_RESULTS) {
              return results;
            }
          }
        }
      }
    }
    return results;
  }

  private getBookId(bookName: string): string {
    // Quick heuristic mapping to common USFM IDs used by HelloAO
    const normalized = bookName.toLowerCase().replace(/\s/g, '');
    const map: Record<string, string> = {
      genesis: 'GEN', exodus: 'EXO', leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU',
      joshua: 'JOS', judges: 'JDG', ruth: 'RUT', '1samuel': '1SA', '2samuel': '2SA',
      '1kings': '1KI', '2kings': '2KI', '1chronicles': '1CH', '2chronicles': '2CH',
      ezra: 'EZR', nehemiah: 'NEH', esther: 'EST', job: 'JOB', psalms: 'PSA', psalm: 'PSA',
      proverbs: 'PRO', ecclesiastes: 'ECC', songofsolomon: 'SNG', isaiah: 'ISA',
      jeremiah: 'JER', lamentations: 'LAM', ezekiel: 'EZE', daniel: 'DAN',
      hosea: 'HOS', joel: 'JOL', amos: 'AMO', obadiah: 'OBA', jonah: 'JON',
      micah: 'MIC', nahum: 'NAM', habakkuk: 'HAB', zephaniah: 'ZEP', haggai: 'HAG',
      zechariah: 'ZEC', malachi: 'MAL', matthew: 'MAT', mark: 'MRK', luke: 'LUK',
      john: 'JHN', acts: 'ACT', romans: 'ROM', '1corinthians': '1CO', '2corinthians': '2CO',
      galatians: 'GAL', ephesians: 'EPH', philippians: 'PHP', colossians: 'COL',
      '1thessalonians': '1TH', '2thessalonians': '2TH', '1timothy': '1TI', '2timothy': '2TI',
      titus: 'TIT', philemon: 'PHM', hebrews: 'HEB', james: 'JAS', '1peter': '1PE',
      '2peter': '2PE', '1john': '1JN', '2john': '2JN', '3john': '3JN', jude: 'JUD',
      revelation: 'REV'
    };
    return map[normalized] || normalized.substring(0, 3).toUpperCase();
  }

}
