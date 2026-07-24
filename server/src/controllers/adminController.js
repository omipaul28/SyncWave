const { v4: uuidv4 } = require('uuid');
const fs = require('../services/firestoreService');
const { getNextAccountIndex, uploadAudio, uploadImage, deleteAsset, getCloudinaryStats } = require('../services/cloudinaryService');
const ytService = require('../services/youtubeService');

const uploadSong = async (req, res) => {
  try {
    const audioFile = req.files?.audio?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!audioFile) return res.status(400).json({ error: 'Audio file is required' });

    const { title, artist, artistId, album, albumId, genre, duration } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'title and artist are required' });

    const songId = uuidv4();
    const accountIndex = getNextAccountIndex();

    // Upload audio + cover in parallel to the selected account
    const [audioResult, coverResult] = await Promise.all([
      uploadAudio(audioFile.buffer, `song_${songId}`, accountIndex),
      coverFile ? uploadImage(coverFile.buffer, `cover_${songId}`, accountIndex) : Promise.resolve(null),
    ]);

    // Build keyword array for search
    const keywords = [
      ...title.toLowerCase().split(' '),
      ...artist.toLowerCase().split(' '),
      ...(album ? album.toLowerCase().split(' ') : []),
      ...(genre ? [genre.toLowerCase()] : []),
    ];

    const song = await fs.createSong({
      title,
      artist,
      artistId: artistId || null,
      album: album || null,
      albumId: albumId || null,
      genre: genre || null,
      duration: parseFloat(duration) || 0,
      coverUrl: coverResult?.secure_url || null,
      audioUrl: audioResult.secure_url,
      audioPublicId: audioResult.public_id,
      coverPublicId: coverResult?.public_id || null,
      lyrics: null,
      keywords,
      cloudinaryAccount: accountIndex + 1,
    });

    res.status(201).json({ song });
  } catch (err) {
    console.error('uploadSong error:', err);
    res.status(500).json({ error: 'Failed to upload song' });
  }
};

const editSong = async (req, res) => {
  try {
    const song = await fs.getSongById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    const updated = await fs.updateSong(req.params.id, req.body);
    res.json({ song: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update song' });
  }
};

const removeSong = async (req, res) => {
  try {
    const song = await fs.getSongById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    // Delete Cloudinary assets
    const tasks = [];
    if (song.audioPublicId) tasks.push(deleteAsset(song.audioPublicId, 'video'));
    if (song.coverPublicId) tasks.push(deleteAsset(song.coverPublicId, 'image'));
    await Promise.all(tasks);

    await fs.deleteSong(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete song' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await fs.getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createArtist = async (req, res) => {
  try {
    const { name, bio, coverUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Artist name is required' });
    const artist = await fs.createArtist({ name, bio, coverUrl });
    res.status(201).json({ artist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create artist' });
  }
};

const updateArtist = async (req, res) => {
  try {
    const updated = await fs.updateArtist(req.params.id, req.body);
    res.json({ artist: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update artist' });
  }
};

const createAlbum = async (req, res) => {
  try {
    const { title, artistId, coverUrl, releaseYear } = req.body;
    if (!title || !artistId) return res.status(400).json({ error: 'title and artistId required' });
    const album = await fs.createAlbum({ title, artistId, coverUrl, releaseYear });
    res.status(201).json({ album });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create album' });
  }
};

const getStats = async (req, res) => {
  try {
    const [users, trending, cloudinaryStats] = await Promise.all([
      fs.getAllUsers(),
      fs.getTrendingSongs(10),
      getCloudinaryStats(),
    ]);
    res.json({
      totalUsers: users.length,
      topSongs: trending,
      cloudinaryStats,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

/**
 * POST /api/admin/youtube/import
 * Body: { urls: string[] }
 * Response: text/event-stream (SSE)
 *
 * Processes each YouTube URL sequentially:
 *   fetch info → download MP3 → fetch thumbnail → upload Cloudinary → save Firestore
 * Sends an SSE event for every status change and a final "complete" event.
 */
const importFromYoutube = async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array is required' });
  }

  // ── SSE setup ──────────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({ type: 'start', total: urls.length });

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!url) continue;

    try {
      // 1. Fetch metadata
      send({ type: 'progress', index: i, url, status: 'fetching_info' });
      const info = await ytService.getVideoInfo(url);

      // 2. Download + convert to MP3
      send({ type: 'progress', index: i, url, status: 'downloading', title: info.title });
      const audioBuffer = await ytService.downloadAsMP3(url, (status) => {
        send({ type: 'progress', index: i, url, status, title: info.title });
      });

      // 3. Fetch thumbnail
      send({ type: 'progress', index: i, url, status: 'uploading', title: info.title });
      const thumbBuffer = await ytService.fetchThumbnail(info.thumbnailUrl);

      // 4. Upload to Cloudinary in parallel to the selected account
      const songId = uuidv4();
      const accountIndex = getNextAccountIndex();
      const [audioResult, coverResult] = await Promise.all([
        uploadAudio(audioBuffer, `song_${songId}`, accountIndex),
        thumbBuffer ? uploadImage(thumbBuffer, `cover_${songId}`, accountIndex) : Promise.resolve(null),
      ]);

      // 5. Build keywords for search
      const keywords = [
        ...info.title.toLowerCase().split(/\s+/),
        ...info.artist.toLowerCase().split(/\s+/),
        ...(info.album ? info.album.toLowerCase().split(/\s+/) : []),
        ...(info.genre ? [info.genre.toLowerCase()] : []),
      ].filter(Boolean);

      // 6. Save to Firestore
      send({ type: 'progress', index: i, url, status: 'saving', title: info.title });
      const song = await fs.createSong({
        title: info.title,
        artist: info.artist,
        artistId: null,
        album: info.album || null,
        albumId: null,
        genre: info.genre || null,
        duration: info.duration,
        coverUrl: coverResult?.secure_url || null,
        audioUrl: audioResult.secure_url,
        audioPublicId: audioResult.public_id,
        coverPublicId: coverResult?.public_id || null,
        lyrics: null,
        keywords,
        sourceUrl: url,
        cloudinaryAccount: accountIndex + 1,
      });

      results.push({ url, song });
      send({ type: 'done', index: i, song });
    } catch (err) {
      console.error(`[youtube import] Failed for ${url}:`, err.message);
      results.push({ url, error: err.message });
      send({ type: 'error', index: i, url, message: err.message });
    }
  }

  send({ type: 'complete', results });
  res.end();
};

module.exports = {
  uploadSong,
  editSong,
  removeSong,
  listUsers,
  createArtist,
  updateArtist,
  createAlbum,
  getStats,
  importFromYoutube,
};
