import api from './axiosInstance';
import useNetworkStore from '../store/networkStore';
import { getOfflineSongs, isSongDownloaded } from '../services/offlineDB';

export const fetchSongs = async (params) => {
  if (useNetworkStore.getState().isOffline) {
    const offlineSongs = await getOfflineSongs();
    // simple filtering for search if offline
    if (params?.q) {
      const q = params.q.toLowerCase();
      return offlineSongs.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.artist.toLowerCase().includes(q)
      );
    }
    return offlineSongs;
  }
  return api.get('/api/songs', { params }).then((r) => r.data.songs);
};

export const fetchSong = async (id) => {
  if (useNetworkStore.getState().isOffline) {
    const offlineSongs = await getOfflineSongs();
    const song = offlineSongs.find(s => s.id === id);
    if (!song) throw new Error('Not available offline');
    return song;
  }
  return api.get(`/api/songs/${id}`).then((r) => r.data.song);
};

export const fetchTrending = async (limit = 20) => {
  if (useNetworkStore.getState().isOffline) {
    const offlineSongs = await getOfflineSongs();
    // sort by playCount or just return as is
    return offlineSongs.sort((a,b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, limit);
  }
  return api.get('/api/songs/trending', { params: { limit } }).then((r) => r.data.songs);
};

export const recordPlay = async (id) => {
  if (useNetworkStore.getState().isOffline) return;
  return api.post(`/api/songs/${id}/play`);
};
