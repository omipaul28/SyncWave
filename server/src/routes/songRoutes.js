const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  listSongs,
  getSong,
  getTrending,
  playSong,
} = require('../controllers/songController');

// GET /api/songs?search=&genre=&artist=&album=&limit=&startAfter=
router.get('/', authMiddleware, listSongs);

// GET /api/songs/trending
router.get('/trending', authMiddleware, getTrending);

// GET /api/songs/:id
router.get('/:id', authMiddleware, getSong);

// POST /api/songs/:id/play  – increments play count + adds to recently played
router.post('/:id/play', authMiddleware, playSong);

module.exports = router;
