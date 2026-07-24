const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { verifyUser, getMe } = require('../controllers/authController');

// POST /api/auth/verify  – verify Firebase token, create user doc if new
router.post('/verify', authMiddleware, verifyUser);

// GET /api/auth/me  – get authenticated user's profile
router.get('/me', authMiddleware, getMe);

module.exports = router;
