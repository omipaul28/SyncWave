import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLyrics } from '../api/lyricsApi';

/**
 * Fetches and syncs lyrics for the currently playing song.
 * Uses React Query so loading/error/refetch lifecycle is handled correctly.
 * Never caches "not found" results — each song open retries the server.
 *
 * @param {string|null} songId
 * @param {number} currentTime - current playback position in seconds
 * @returns {{ lyrics, activeLine, isLoading, error, refetch }}
 */
const useLyrics = (songId, currentTime) => {
  const [activeLine, setActiveLine] = useState(0);

  const {
    data: lyrics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['lyrics', songId],
    queryFn: () => fetchLyrics(songId),
    enabled: !!songId,
    // Keep successful lyrics cached for the session; never cache "no lyrics" results
    staleTime: Infinity,
    retry: 1,
    select: (data) => {
      // If neither plain nor synced lyrics exist, treat as null so the
      // "unavailable" state renders correctly instead of caching the empty object
      if (!data?.plain && !data?.synced) return null;
      return data;
    },
  });

  // ── Active line tracking ─────────────────────────────────────────────────
  useEffect(() => {
    if (!lyrics?.synced?.length) return;

    let lineIndex = 0;
    for (let i = 0; i < lyrics.synced.length; i++) {
      if (lyrics.synced[i].time <= currentTime) lineIndex = i;
      else break;
    }
    setActiveLine(lineIndex);
  }, [currentTime, lyrics]);

  // Reset active line when song changes
  useEffect(() => {
    setActiveLine(0);
  }, [songId]);

  return {
    lyrics,
    activeLine,
    isLoading,
    error: isError ? 'Could not load lyrics' : null,
    refetch,
  };
};

export default useLyrics;

