const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  book: { type: String, required: true },
  chapter: { type: Number, required: true },
  verse: { type: Number, required: true },
  note: { type: String, required: true }
});

module.exports = mongoose.model('Note', NoteSchema);