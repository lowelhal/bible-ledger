const express = require('express');
const { addHighlight, getHighlights } = require('../controllers/highlightController');
const router = express.Router();

router.post('/', addHighlight);
router.get('/:user_id', getHighlights);

module.exports = router;