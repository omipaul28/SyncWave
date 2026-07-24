import { create } from 'zustand';

const useNetworkStore = create((set) => ({
  isOffline: !navigator.onLine,
  setOffline: (status) => set({ isOffline: status }),
}));

window.addEventListener('online', () => useNetworkStore.getState().setOffline(false));
window.addEventListener('offline', () => useNetworkStore.getState().setOffline(true));

export default useNetworkStore;
