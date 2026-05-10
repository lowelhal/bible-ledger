const Note = require('../models/Note');

exports.addNote = async (req, res) => {
  try {
    const note = new Note(req.body);
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Error adding note', details: error.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user_id: req.params.user_id });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notes', details: error.message });
  }
};