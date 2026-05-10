const Highlight = require('../models/Highlight');

exports.addHighlight = async (req, res) => {
  try {
    const highlight = new Highlight(req.body);
    await highlight.save();
    res.status(201).json(highlight);
  } catch (error) {
    res.status(500).json({ error: 'Error adding highlight', details: error.message });
  }
};

exports.getHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ user_id: req.params.user_id });
    res.status(200).json(highlights);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching highlights', details: error.message });
  }
};