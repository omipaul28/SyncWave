const fs = require('../services/firestoreService');

const getProfile = async (req, res) => {
  try {
    const user = await fs.getUserById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updated = await fs.updateUser(req.user.uid, { username, avatar });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { songId } = req.body;
    if (!songId) return res.status(400).json({ error: 'songId required' });
    const result = await fs.toggleLikedSong(req.user.uid, songId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

const getPlaylists = async (req, res) => {
  try {
    const playlists = await fs.getUserPlaylists(req.user.uid);
    res.json({ playlists });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
};

module.exports = { getProfile, updateProfile, toggleLike, getPlaylists };
