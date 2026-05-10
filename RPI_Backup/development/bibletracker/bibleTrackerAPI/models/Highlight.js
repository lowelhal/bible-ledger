const mongoose = require('mongoose');

const HighlightSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  book: { type: String, required: true },
  chapter: { type: Number, required: true },
  verse: { type: Number, required: true },
  text: { type: String, required: true },
  color: { type: String, default: 'yellow' }
});

module.exports = mongoose.model('Highlight', HighlightSchema);