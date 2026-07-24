import { useState, useCallback, useEffect } from 'react';
import { saveSongOffline, removeSongOffline, isSongDownloaded } from '../services/offlineDB';

export const CACHE_NAME = 'syncwave-media';

export default function useOffline(song) {
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (song) {
      isSongDownloaded(song.id).then(setDownloaded);
    }
  }, [song?.id]);

  const toggleDownload = useCallback(async () => {
    if (!song) return;

    if (downloaded) {
      // Remove from offlineDB and Cache
      await removeSongOffline(song.id);
      const cache = await caches.open(CACHE_NAME);
      if (song.audioUrl) await cache.delete(song.audioUrl);
      if (song.coverUrl) await cache.delete(song.coverUrl);
      setDownloaded(false);
    } else {
      // Add to offlineDB and Cache
      setDownloading(true);
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Fetch and cache resources
        const cacheAsset = async (url) => {
          if (!url) return;
          const req = new Request(url, { mode: 'no-cors' });
          const res = await fetch(req);
          await cache.put(req, res);
        };

        await Promise.all([
          cacheAsset(song.audioUrl),
          cacheAsset(song.coverUrl)
        ]);
        
        await saveSongOffline(song);
        setDownloaded(true);
      } catch (err) {
        console.error('Failed to download song:', err);
        alert('Failed to download song for offline playback.');
      } finally {
        setDownloading(false);
      }
    }
  }, [song, downloaded]);

  return { downloaded, downloading, toggleDownload };
}
