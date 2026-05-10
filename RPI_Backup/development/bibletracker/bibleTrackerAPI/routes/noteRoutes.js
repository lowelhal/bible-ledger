const express = require('express');
const { addNote, getNotes } = require('../controllers/noteController');
const router = express.Router();

router.post('/', addNote);
router.get('/:user_id', getNotes);

module.exports = router;