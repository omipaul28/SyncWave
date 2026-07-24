const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createRoom, getRoomState, closeRoom, checkRoom } = require('../controllers/roomController');

router.post('/', authMiddleware, createRoom);
router.get('/check/:roomId', authMiddleware, checkRoom);
router.get('/:roomId', authMiddleware, getRoomState);
router.delete('/:roomId', authMiddleware, closeRoom);

module.exports = router;
