const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile, updateProfile, toggleLike, getPlaylists } = require('../controllers/userController');

router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.patch('/me/likes', authMiddleware, toggleLike);
router.get('/me/playlists', authMiddleware, getPlaylists);

module.exports = router;
