const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  modifyPlaylistSongs,
} = require('../controllers/playlistController');

router.get('/:id', authMiddleware, getPlaylist);
router.post('/', authMiddleware, createPlaylist);
router.put('/:id', authMiddleware, updatePlaylist);
router.delete('/:id', authMiddleware, deletePlaylist);

// PATCH /api/playlists/:id/songs  body: { action: 'add'|'remove', songId }
router.patch('/:id/songs', authMiddleware, modifyPlaylistSongs);

module.exports = router;
