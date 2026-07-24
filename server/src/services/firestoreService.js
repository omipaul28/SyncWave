const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// ── Songs ─────────────────────────────────────────────────────────────────────

const getSongs = async ({ search, genre, artist, album, limit = 20, startAfter } = {}) => {
  let query = db.collection('songs').orderBy('uploadedAt', 'desc').limit(limit);

  if (genre) query = query.where('genre', '==', genre);
  if (artist) query = query.where('artist', '==', artist);
  if (album) query = query.where('album', '==', album);

  if (startAfter) {
    const cursor = await db.collection('songs').doc(startAfter).get();
    if (cursor.exists) query = query.startAfter(cursor);
  }

  const snap = await query.get();
  let songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (search) {
    const kw = search.toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(kw) ||
        s.artist?.toLowerCase().includes(kw) ||
        s.album?.toLowerCase().includes(kw) ||
        s.keywords?.some((k) => k.includes(kw))
    );
  }

  return songs;
};

const getSongById = async (id) => {
  const snap = await db.collection('songs').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const getTrendingSongs = async (limit = 20) => {
  const snap = await db
    .collection('songs')
    .orderBy('playCount', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const createSong = async (data) => {
  const ref = db.collection('songs').doc();
  const song = {
    ...data,
    id: ref.id,
    playCount: 0,
    uploadedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(song);
  return song;
};

const updateSong = async (id, data) => {
  await db.collection('songs').doc(id).update(data);
  return getSongById(id);
};

const deleteSong = async (id) => {
  await db.collection('songs').doc(id).delete();
};

const incrementPlayCount = async (id) => {
  await db.collection('songs').doc(id).update({ playCount: FieldValue.increment(1) });
};

// ── Users ─────────────────────────────────────────────────────────────────────

const getUserById = async (uid) => {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { uid: snap.id, ...snap.data() };
};

const createUser = async (uid, data) => {
  const user = {
    uid,
    role: 'user',
    likedSongs: [],
    recentlyPlayed: [],
    playlists: [],
    createdAt: FieldValue.serverTimestamp(),
    ...data,
  };
  await db.collection('users').doc(uid).set(user);
  return user;
};

const updateUser = async (uid, data) => {
  await db.collection('users').doc(uid).update(data);
  return getUserById(uid);
};

const getAllUsers = async () => {
  const snap = await db.collection('users').get();
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
};

const toggleLikedSong = async (uid, songId) => {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  const liked = snap.data()?.likedSongs || [];
  const alreadyLiked = liked.includes(songId);

  await ref.update({
    likedSongs: alreadyLiked
      ? FieldValue.arrayRemove(songId)
      : FieldValue.arrayUnion(songId),
  });

  return { liked: !alreadyLiked };
};

const addRecentlyPlayed = async (uid, songId) => {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  let recent = snap.data()?.recentlyPlayed || [];

  // Remove if already present (dedup)
  recent = recent.filter((r) => r.songId !== songId);
  // Prepend newest
  recent.unshift({ songId, playedAt: Date.now() });
  // Keep max 50
  recent = recent.slice(0, 50);

  await ref.update({ recentlyPlayed: recent });
};

// ── Playlists ─────────────────────────────────────────────────────────────────

const getPlaylistById = async (id) => {
  const snap = await db.collection('playlists').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const getUserPlaylists = async (ownerId) => {
  const snap = await db
    .collection('playlists')
    .where('ownerId', '==', ownerId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const createPlaylist = async (ownerId, data) => {
  const ref = db.collection('playlists').doc();
  const playlist = {
    ...data,
    id: ref.id,
    ownerId,
    songs: [],
    visibility: data.visibility || 'private',
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(playlist);
  // Add playlist ref to user
  await db
    .collection('users')
    .doc(ownerId)
    .update({ playlists: FieldValue.arrayUnion(ref.id) });
  return playlist;
};

const updatePlaylist = async (id, data) => {
  await db.collection('playlists').doc(id).update(data);
  return getPlaylistById(id);
};

const deletePlaylist = async (id, ownerId) => {
  await db.collection('playlists').doc(id).delete();
  await db
    .collection('users')
    .doc(ownerId)
    .update({ playlists: FieldValue.arrayRemove(id) });
};

const addSongToPlaylist = async (playlistId, songId) => {
  await db
    .collection('playlists')
    .doc(playlistId)
    .update({ songs: FieldValue.arrayUnion(songId) });
  return getPlaylistById(playlistId);
};

const removeSongFromPlaylist = async (playlistId, songId) => {
  await db
    .collection('playlists')
    .doc(playlistId)
    .update({ songs: FieldValue.arrayRemove(songId) });
  return getPlaylistById(playlistId);
};

// ── Artists ───────────────────────────────────────────────────────────────────

const getArtistById = async (id) => {
  const snap = await db.collection('artists').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const getAllArtists = async () => {
  const snap = await db.collection('artists').orderBy('name').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const createArtist = async (data) => {
  const ref = db.collection('artists').doc();
  const artist = { ...data, id: ref.id, songIds: [] };
  await ref.set(artist);
  return artist;
};

const updateArtist = async (id, data) => {
  await db.collection('artists').doc(id).update(data);
  return getArtistById(id);
};

// ── Albums ────────────────────────────────────────────────────────────────────

const getAlbumById = async (id) => {
  const snap = await db.collection('albums').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const getAllAlbums = async () => {
  const snap = await db.collection('albums').orderBy('title').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const createAlbum = async (data) => {
  const ref = db.collection('albums').doc();
  const album = { ...data, id: ref.id, songIds: [] };
  await ref.set(album);
  return album;
};

module.exports = {
  getSongs,
  getSongById,
  getTrendingSongs,
  createSong,
  updateSong,
  deleteSong,
  incrementPlayCount,
  getUserById,
  createUser,
  updateUser,
  getAllUsers,
  toggleLikedSong,
  addRecentlyPlayed,
  getPlaylistById,
  getUserPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getArtistById,
  getAllArtists,
  createArtist,
  updateArtist,
  getAlbumById,
  getAllAlbums,
  createAlbum,
};
