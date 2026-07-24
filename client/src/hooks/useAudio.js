import { useEffect, useCallback } from 'react';
import usePlayerStore from '../store/playerStore';
import { recordPlay } from '../api/songsApi';

/**
 * Module-level singleton Audio element.
 * Shared across ALL components that call useAudio() so only one
 * audio source ever plays at a time (fixes double-audio when
 * MiniPlayer and FullPlayer are both mounted).
 */
export const audio = new Audio();
audio.preload = 'metadata';

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

  // ── Load new song ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong?.audioUrl) return;
    audio.src = currentSong.audioUrl;
    audio.load();
    if (isPlaying) audio.play().catch(console.error);

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
    if (!currentSong) {
      audio.pause();
      audio.src = '';
    }
  }, [currentSong]);

  // ── Play / Pause ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong) return;
    if (isPlaying) audio.play().catch(console.error);
    else audio.pause();
  }, [isPlaying]);

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
