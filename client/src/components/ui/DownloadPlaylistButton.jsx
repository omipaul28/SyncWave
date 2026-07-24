import { useState, useEffect, useCallback } from 'react';
import { savePlaylistOffline, removePlaylistOffline, isPlaylistDownloaded, saveSongOffline } from '../../services/offlineDB';
import { CACHE_NAME } from '../../hooks/useOffline';
import { ArrowDownCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function DownloadPlaylistButton({ playlist, songs = [], className = '' }) {
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (playlist) {
      isPlaylistDownloaded(playlist.id).then(setDownloaded);
    }
  }, [playlist?.id]);

  const toggleDownload = useCallback(async () => {
    if (!playlist) return;

    if (downloaded) {
      await removePlaylistOffline(playlist.id);
      // We don't auto-remove songs because they might be in other playlists or individually downloaded
      setDownloaded(false);
      setProgress(0);
    } else {
      setDownloading(true);
      try {
        const cache = await caches.open(CACHE_NAME);
        
        let i = 0;
        for (const song of songs) {
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
          
          i++;
          setProgress(Math.round((i / songs.length) * 100));
        }
        
        await savePlaylistOffline(playlist);
        setDownloaded(true);
      } catch (err) {
        console.error('Failed to download playlist:', err);
        alert('Failed to download playlist for offline playback.');
      } finally {
        setDownloading(false);
      }
    }
  }, [playlist, songs, downloaded]);

  return (
    <button
      onClick={toggleDownload}
      disabled={downloading || songs.length === 0}
      className={`btn-secondary rounded-full font-bold transition-all ${downloaded ? 'border-accent text-accent' : ''} ${className}`}
    >
      {downloading ? (
        <><Loader2 className="w-4 h-4 animate-spin mr-1" /> {progress}%</>
      ) : downloaded ? (
        <><CheckCircle2 className="w-4 h-4 mr-1 fill-accent text-black" /> Downloaded</>
      ) : (
        <><ArrowDownCircle className="w-4 h-4 mr-1" /> Download</>
      )}
    </button>
  );
}
