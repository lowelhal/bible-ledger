const mongoose = require('mongoose');

const PassageSchema = new mongoose.Schema({
  book: { type: String, required: true },
  chapter: { type: Number, required: true },
  verses: [{ type: Number, required: true }]
});

const ProgressSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  date: { type: Date, required: true },
  passages: { type: [PassageSchema], required: true },
  category: { type: [String] }
});

module.exports = mongoose.model('Progress', ProgressSchema);