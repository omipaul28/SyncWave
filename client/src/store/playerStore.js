import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  // Current track
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,

  // Queue
  queue: [],
  history: [],

  // Modes
  shuffle: false,
  repeat: 'off', // 'off' | 'one' | 'all'

  // UI state
  isFullPlayer: false,
  isQueueOpen: false,
  isLyricsOpen: false,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setCurrentSong: (song) => set({ currentSong: song, currentTime: 0, isPlaying: true }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  // seek is set by useAudio after it mounts so all components can call it without importing the hook
  seek: () => {},
  registerSeek: (fn) => set({ seek: fn }),
  // Stop all playback and clear the current song (close button)
  stopPlayback: () => set({ currentSong: null, isPlaying: false, currentTime: 0, duration: 0, queue: [], history: [], isFullPlayer: false }),
  toggleMute: () => {
    const { isMuted, volume } = get();
    set({ isMuted: !isMuted, volume: isMuted ? (volume || 0.5) : volume });
  },

  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),

  toggleFullPlayer: () => set((s) => ({ isFullPlayer: !s.isFullPlayer })),
  toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),
  toggleLyrics: () => set((s) => ({ isLyricsOpen: !s.isLyricsOpen })),

  // ── Queue management ──────────────────────────────────────────────────────────
  setQueue: (queue) => set({ queue }),
  addToQueue: (song) => set((s) => ({ queue: [...s.queue, song] })),
  removeFromQueue: (index) =>
    set((s) => ({ queue: s.queue.filter((_, i) => i !== index) })),

  playNext: () => {
    const { queue, history, currentSong, shuffle, repeat } = get();

    if (currentSong) {
      // Push to history
      set((s) => ({ history: [...s.history, s.currentSong] }));
    }

    if (repeat === 'one' && currentSong) {
      set({ currentTime: 0, isPlaying: true });
      return;
    }

    if (queue.length === 0) {
      if (repeat === 'all' && history.length > 0) {
        const fullHistory = [...history, currentSong].filter(Boolean);
        set({ queue: fullHistory.slice(1), currentSong: fullHistory[0], history: [], currentTime: 0 });
      } else {
        set({ isPlaying: false, currentTime: 0 });
      }
      return;
    }

    let nextIndex = 0;
    let newQueue = [...queue];
    if (shuffle) nextIndex = Math.floor(Math.random() * queue.length);

    const [nextSong] = newQueue.splice(nextIndex, 1);
    set({ currentSong: nextSong, queue: newQueue, currentTime: 0, isPlaying: true });
  },

  playPrevious: () => {
    const { history, currentSong, queue, currentTime } = get();

    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    if (history.length === 0) {
      set({ currentTime: 0 });
      return;
    }

    const prev = [...history];
    const prevSong = prev.pop();
    set({
      currentSong: prevSong,
      history: prev,
      queue: currentSong ? [currentSong, ...queue] : queue,
      currentTime: 0,
      isPlaying: true,
    });
  },

  playFromQueue: (index) => {
    const { queue, currentSong, history } = get();
    if (index < 0 || index >= queue.length) return;
    const song = queue[index];
    const newQueue = queue.filter((_, i) => i !== index);
    const newHistory = currentSong ? [...history, currentSong] : history;
    set({ currentSong: song, queue: newQueue, history: newHistory, currentTime: 0, isPlaying: true });
  },
}));

export default usePlayerStore;
