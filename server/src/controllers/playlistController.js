const fs = require('../services/firestoreService');

const getPlaylist = async (req, res) => {
  try {
    const playlist = await fs.getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    // Only owner or public playlists
    if (playlist.visibility === 'private' && playlist.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'This playlist is private' });
    }
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
};

const createPlaylist = async (req, res) => {
  try {
    const { title, visibility, cover } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const playlist = await fs.createPlaylist(req.user.uid, { title, visibility, cover });
    res.status(201).json({ playlist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
};

const updatePlaylist = async (req, res) => {
  try {
    const playlist = await fs.getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.ownerId !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    const updated = await fs.updatePlaylist(req.params.id, req.body);
    res.json({ playlist: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update playlist' });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const playlist = await fs.getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.ownerId !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    await fs.deletePlaylist(req.params.id, req.user.uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};

const modifyPlaylistSongs = async (req, res) => {
  try {
    const { action, songId } = req.body;
    if (!action || !songId) return res.status(400).json({ error: 'action and songId required' });

    const playlist = await fs.getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.ownerId !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    let updated;
    if (action === 'add') updated = await fs.addSongToPlaylist(req.params.id, songId);
    else if (action === 'remove') updated = await fs.removeSongFromPlaylist(req.params.id, songId);
    else return res.status(400).json({ error: 'action must be add or remove' });

    res.json({ playlist: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to modify playlist' });
  }
};

module.exports = { getPlaylist, createPlaylist, updatePlaylist, deletePlaylist, modifyPlaylistSongs };
