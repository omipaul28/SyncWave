import { useEffect, useCallback } from 'react';
import usePlayerStore from '../store/playerStore';
import { recordPlay } from '../api/songsApi';
import { audio } from '../lib/audio';

let preloadAudio = null;

/**
 * Manages the HTMLAudioElement for solo (non-room) playback.
 * Syncs with playerStore and fires side effects like play-count recording.
 */
const useAudio = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    playNext,
    queue,
  } = usePlayerStore();

  // ── Load new song side-effects ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong?.audioUrl) return;

    // Record play in background
    recordPlay(currentSong.id).catch(() => {});

    // Preload next song
    if (queue.length > 0 && queue[0].audioUrl) {
      preloadAudio = new Audio(queue[0].audioUrl);
      preloadAudio.preload = 'metadata';
    }
  }, [currentSong?.id]);

  // ── Stop when currentSong is cleared (close button) ──────────────────────
  useEffect(() => {
    // Handled synchronously by store, but we can keep side effects here if needed
  }, [currentSong]);



  // ── Volume / Mute ──────────────────────────────────────────────────────────
  useEffect(() => {
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ── Time update listener ───────────────────────────────────────────────────
  useEffect(() => {
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => playNext();
    const onError = (e) => console.error('Audio error:', e);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [playNext]);

  // ── Seek ───────────────────────────────────────────────────────────────────
  const seek = useCallback((time) => {
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Register seek into the store so FullPlayer/other components can call it
  // without importing useAudio (which would create duplicate event listeners)
  useEffect(() => {
    usePlayerStore.getState().registerSeek(seek);
  }, [seek]);

  // ── Set playback rate ──────────────────────────────────────────────────────
  const setPlaybackRate = useCallback((rate) => {
    audio.playbackRate = rate;
  }, []);

  return { audio, seek, setPlaybackRate };
};

export default useAudio;
