const BibleVerse = require('../models/BibleVerse');
//const Translation = require('../models/Translation');

const getVerse = async (req, res) => {
  try {
    const { book, chapter, verse, translation } = req.params;
    const bibleVerse = await BibleVerse.findOne({ translation, book, chapter: parseInt(chapter), verse: parseInt(verse) });
    if (!bibleVerse) {
      return res.status(404).json({ message: 'Verse not found' });
    }
    res.json(bibleVerse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChapter = async (req, res) => {
  try {
    const { book, chapter, translation } = req.params;
    const verses = await BibleVerse.find({ translation, book, chapter: parseInt(chapter) }).sort({ verse: 1 });
    if (!verses || verses.length === 0) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json(verses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchTexts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const results = await BibleVerse.find({ $text: { $search: query } });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchTranslationTexts = async (req, res) => {
  try {
    const { translation } = req.params;
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const results = await BibleVerse.find({ translation, $text: { $search: query } });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVerseComparisons = async (req, res) => {
  try {
    const { book, chapter, verse } = req.params;
    const verses = await BibleVerse.find({ book, chapter: parseInt(chapter), verse: parseInt(verse) }).populate('translation', 'name abbreviation');
    if (!verses || verses.length === 0) {
      return res.status(404).json({ message: 'Verse not found' });
    }
    res.json(verses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getVerse, getChapter, searchTexts, searchTranslationTexts, getVerseComparisons };