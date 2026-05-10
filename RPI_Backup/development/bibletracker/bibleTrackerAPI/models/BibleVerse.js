const mongoose = require('mongoose');

const bibleVerseSchema = new mongoose.Schema({
  translation: { type: String, required: true }, // type: mongoose.Schema.Types.ObjectId, ref: 'Translation', required: true },
  book: { type: String, required: true },
  chapter: { type: Number, required: true },
  verse: { type: Number, required: true },
  text: { type: String, required: true }
});

bibleVerseSchema.index({ translation: 1, book: 1, chapter: 1, verse: 1 }, { unique: true });
bibleVerseSchema.index({ text: 'text' });

const BibleVerse = mongoose.model('BibleVerse', bibleVerseSchema);

/*
const TranslationSchema = new mongoose.Schema({
  translation_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  method: { type: String, required: true} // e.g.['internal', 'scripture_api']
});
*/


module.exports = BibleVerse;