const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { fetchLyrics } = require('../controllers/lyricsController');

router.get('/:songId', authMiddleware, fetchLyrics);

module.exports = router;
