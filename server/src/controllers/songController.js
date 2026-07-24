const fs = require('../services/firestoreService');

const listSongs = async (req, res) => {
  try {
    const { search, genre, artist, album, limit, startAfter } = req.query;
    const songs = await fs.getSongs({
      search,
      genre,
      artist,
      album,
      limit: limit ? parseInt(limit) : 20,
      startAfter,
    });
    res.json({ songs });
  } catch (err) {
    console.error('listSongs error:', err);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
};

const getSong = async (req, res) => {
  try {
    const song = await fs.getSongById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json({ song });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch song' });
  }
};

const getTrending = async (req, res) => {
  try {
    const { limit } = req.query;
    const songs = await fs.getTrendingSongs(limit ? parseInt(limit) : 20);
    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending songs' });
  }
};

const playSong = async (req, res) => {
  try {
    const { id } = req.params;
    await Promise.all([
      fs.incrementPlayCount(id),
      fs.addRecentlyPlayed(req.user.uid, id),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record play' });
  }
};

module.exports = { listSongs, getSong, getTrending, playSong };
