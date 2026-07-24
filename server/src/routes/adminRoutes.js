const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  uploadSong,
  editSong,
  removeSong,
  listUsers,
  createArtist,
  updateArtist,
  createAlbum,
  getStats,
  importFromYoutube,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/mp3', 'image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Songs
router.post('/songs', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), uploadSong);
router.put('/songs/:id', editSong);
router.delete('/songs/:id', removeSong);

// Users
router.get('/users', listUsers);

// Artists
router.post('/artists', createArtist);
router.put('/artists/:id', updateArtist);

// Albums
router.post('/albums', createAlbum);

// Analytics
router.get('/stats', getStats);

// YouTube batch import (SSE streaming response)
router.post('/youtube/import', importFromYoutube);

module.exports = router;
