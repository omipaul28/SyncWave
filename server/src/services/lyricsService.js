const axios = require('axios');
const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const LRCLIB_BASE = 'https://lrclib.net/api';

/**
 * Parse .lrc format into an array of { time, text } objects.
 * @param {string} lrc - Raw LRC string
 * @returns {Array<{time: number, text: string}>}
 */
const parseLRC = (lrc) => {
  const lines = lrc.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (!match) continue;
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const centiseconds = parseInt(match[3]);
    const time = minutes * 60 + seconds + centiseconds / (match[3].length === 3 ? 1000 : 100);
    const text = line.replace(timeRegex, '').trim();
    if (text) result.push({ time, text });
  }

  return result.sort((a, b) => a.time - b.time);
};

/**
 * Fetch lyrics for a song. Checks Firestore cache first, then LRCLIB.
 * @param {string} songId
 * @param {object} songMeta - { title, artist, duration }
 */
const getLyrics = async (songId, songMeta) => {
  // 1. Check Firestore cache
  const cacheRef = db.collection('lyrics').doc(songId);
  const cached = await cacheRef.get();
  if (cached.exists) {
    return cached.data();
  }

  // 2. Fetch from LRCLIB — exact match first, then search fallback
  try {
    let data = null;

    // 2a. Exact match (title + artist + duration)
    try {
      const exactRes = await axios.get(`${LRCLIB_BASE}/get`, {
        params: {
          track_name: songMeta.title,
          artist_name: songMeta.artist,
          duration: Math.round(songMeta.duration),
        },
        timeout: 8000,
      });
      data = exactRes.data;
    } catch (exactErr) {
      // 404 means not found with exact params — fall through to search
      if (exactErr.response?.status !== 404) throw exactErr;
    }

    // 2b. Fallback: search by title only (helps YouTube imports where artist = channel name)
    if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
      try {
        const searchRes = await axios.get(`${LRCLIB_BASE}/search`, {
          params: { q: songMeta.title },
          timeout: 8000,
        });
        const results = searchRes.data;
        if (Array.isArray(results) && results.length > 0) {
          // Pick the best match: prefer entries with synced lyrics
          data = results.find((r) => r.syncedLyrics) || results[0];
        }
      } catch {
        // Search also failed — give up gracefully
      }
    }

    if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
      console.warn(`[lyrics] No lyrics found for "${songMeta.title}" by "${songMeta.artist}"`);
      return { songId, plain: null, synced: null, source: null };
    }

    const lyricsData = {
      songId,
      plain: data.plainLyrics || null,
      synced: data.syncedLyrics ? parseLRC(data.syncedLyrics) : null,
      source: 'lrclib',
      cachedAt: FieldValue.serverTimestamp(),
    };

    // 3. Only cache if we actually got lyrics — never cache misses
    if (lyricsData.plain || lyricsData.synced) {
      await cacheRef.set(lyricsData);
    }
    return lyricsData;
  } catch (err) {
    // LRCLIB returned 404 (no lyrics found) or network error — do NOT cache so we retry next time
    console.warn(`[lyrics] No lyrics found for "${songMeta.title}" by "${songMeta.artist}": ${err.message}`);
    return { songId, plain: null, synced: null, source: null };
  }
};

module.exports = { getLyrics };
