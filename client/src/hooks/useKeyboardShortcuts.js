import { useEffect } from 'react';
import usePlayerStore from '../store/playerStore';
import { audio } from './useAudio';

/**
 * Registers global keyboard shortcuts for the music player.
 * Space: play/pause, ArrowLeft/Right: seek ±10s, M: mute, ArrowUp/Down: volume
 */
const useKeyboardShortcuts = () => {
  const store = usePlayerStore();

  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore when typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          store.setIsPlaying(!store.isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audio) {
            const newTime = Math.max(0, audio.currentTime - 10);
            audio.currentTime = newTime;
            store.setCurrentTime(newTime);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audio) {
            const newTime = Math.min(audio.duration || 0, audio.currentTime + 10);
            audio.currentTime = newTime;
            store.setCurrentTime(newTime);
          }
          break;
        case 'KeyM':
          store.toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          store.setVolume(Math.min(1, store.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          store.setVolume(Math.max(0, store.volume - 0.05));
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store.isPlaying, store.volume]);
};

export default useKeyboardShortcuts;
