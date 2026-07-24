import { openDB } from 'idb';

const DB_NAME = 'syncwave-db';
const DB_VERSION = 1;

/**
 * Initialize the database
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
    },
  });
};

// ── Songs ──────────────────────────────────────────────────────────────────

export const saveSongOffline = async (song) => {
  const db = await initDB();
  await db.put('songs', song);
};

export const removeSongOffline = async (songId) => {
  const db = await initDB();
  await db.delete('songs', songId);
};

export const getOfflineSongs = async () => {
  const db = await initDB();
  return db.getAll('songs');
};

export const isSongDownloaded = async (songId) => {
  const db = await initDB();
  const song = await db.get('songs', songId);
  return !!song;
};

// ── Playlists ──────────────────────────────────────────────────────────────

export const savePlaylistOffline = async (playlist) => {
  const db = await initDB();
  await db.put('playlists', playlist);
};

export const removePlaylistOffline = async (playlistId) => {
  const db = await initDB();
  await db.delete('playlists', playlistId);
};

export const getOfflinePlaylists = async () => {
  const db = await initDB();
  return db.getAll('playlists');
};

export const isPlaylistDownloaded = async (playlistId) => {
  const db = await initDB();
  const pl = await db.get('playlists', playlistId);
  return !!pl;
};
