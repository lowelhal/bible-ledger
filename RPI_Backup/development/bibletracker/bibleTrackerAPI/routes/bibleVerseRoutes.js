const express = require('express');
const router = express.Router();
const { getVerse, getChapter, searchTexts, searchTranslationTexts, getVerseComparisons } = require('../controllers/bibleVerseController');

// Get a specific verse
router.get('/:translation/:book/:chapter/:verse', getVerse);

// Get all verses for a particular chapter in a particular translation
router.get('/:translation/:book/:chapter', getChapter);

// Search all verses of a particular translation for a particular text
router.get('/search/:translation', searchTranslationTexts);

// Get all translations of a specific verse
router.get('/compare/:book/:chapter/:verse', getVerseComparisons);

// Search all verses across all translations for a particular text
router.get('/search', searchTexts);

module.exports = router;