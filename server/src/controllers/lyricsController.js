const lyricsService = require('../services/lyricsService');
const fs = require('../services/firestoreService');

const fetchLyrics = async (req, res) => {
  try {
    const { songId } = req.params;
    const song = await fs.getSongById(songId);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    const lyrics = await lyricsService.getLyrics(songId, {
      title: song.title,
      artist: song.artist,
      duration: song.duration,
    });

    res.json({ lyrics });
  } catch (err) {
    console.error('fetchLyrics error:', err);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
};

module.exports = { fetchLyrics };
