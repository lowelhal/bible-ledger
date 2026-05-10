export const USFM_TO_BOOK_NAME: Record<string, string> = {
  "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
  "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
  "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
  "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
  "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah",
  "JER": "Jeremiah", "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
  "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
  "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggai",
  "ZEC": "Zechariah", "MAL": "Malachi",
  "MAT": "Matthew", "MRK": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts",
  "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", "GAL": "Galatians",
  "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians", "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy", "TIT": "Titus",
  "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James", "1PE": "1 Peter", "2PE": "2 Peter",
  "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude", "REV": "Revelation"
};

export const BOOK_NAME_TO_USFM: Record<string, string> = Object.entries(USFM_TO_BOOK_NAME).reduce(
  (acc, [usfm, name]) => {
    acc[name] = usfm;
    return acc;
  },
  {} as Record<string, string>
);

export const BOOKS = Object.keys(USFM_TO_BOOK_NAME);

export const BOOK_CHAPTER_COUNTS: Record<string, number> = {
  "GEN": 50, "EXO": 40, "LEV": 27, "NUM": 36, "DEU": 34,
  "JOS": 24, "JDG": 21, "RUT": 4, "1SA": 31, "2SA": 24,
  "1KI": 22, "2KI": 25, "1CH": 29, "2CH": 36,
  "EZR": 10, "NEH": 13, "EST": 10, "JOB": 42, "PSA": 150,
  "PRO": 31, "ECC": 12, "SNG": 8, "ISA": 66,
  "JER": 52, "LAM": 5, "EZK": 48, "DAN": 12, "HOS": 14,
  "JOL": 3, "AMO": 9, "OBA": 1, "JON": 4, "MIC": 7, "NAM": 3,
  "HAB": 3, "ZEP": 3, "HAG": 2, "ZEC": 14, "MAL": 4,
  "MAT": 28, "MRK": 16, "LUK": 24, "JHN": 21, "ACT": 28, "ROM": 16,
  "1CO": 16, "2CO": 13, "GAL": 6, "EPH": 6,
  "PHP": 4, "COL": 4, "1TH": 5, "2TH": 3,
  "1TI": 6, "2TI": 4, "TIT": 3, "PHM": 1, "HEB": 13,
  "JAS": 5, "1PE": 5, "2PE": 3, "1JN": 5, "2JN": 1, "3JN": 1,
  "JUD": 1, "REV": 22
};

/** Translations that support full-text search (local/offline data only) */
export const SEARCH_SUPPORTED_TRANSLATIONS = new Set(["KJV"]);
