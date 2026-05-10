const Progress = require('../models/Progress');

exports.addProgress = async (req, res) => {
  try {
    const progress = new Progress(req.body);
    await progress.save();
    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Error adding progress', details: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ user_id: req.params.user_id });
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching progress', details: error.message });
  }
};