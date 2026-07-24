import { create } from 'zustand';

const useRoomStore = create((set) => ({
  // Room state (mirrors server's in-memory room)
  roomId: null,
  ownerId: null,
  members: [],
  currentSong: null,
  currentTime: 0,
  isPlaying: false,
  queue: [],
  shuffle: false,
  repeat: 'off',
  updatedBy: null,
  updatedAt: null,

  // Local UI flags
  isInRoom: false,
  isConnecting: false,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setRoom: (roomState) => set({ ...roomState, isInRoom: true }),
  applyStateDelta: (delta) => set((s) => ({ ...s, ...delta })),

  setIsConnecting: (isConnecting) => set({ isConnecting }),

  leaveRoom: () =>
    set({
      roomId: null,
      ownerId: null,
      members: [],
      currentSong: null,
      currentTime: 0,
      isPlaying: false,
      queue: [],
      shuffle: false,
      repeat: 'off',
      updatedBy: null,
      updatedAt: null,
      isInRoom: false,
      isConnecting: false,
    }),
}));

export default useRoomStore;
