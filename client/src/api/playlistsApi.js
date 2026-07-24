import api from './axiosInstance';
import useNetworkStore from '../store/networkStore';
import { getOfflinePlaylists } from '../services/offlineDB';

export const fetchPlaylist = async (id) => {
  if (useNetworkStore.getState().isOffline) {
    const offlinePls = await getOfflinePlaylists();
    const pl = offlinePls.find(p => p.id === id);
    if (!pl) throw new Error('Playlist not available offline');
    return pl;
  }
  return api.get(`/api/playlists/${id}`).then((r) => r.data.playlist);
};

export const createPlaylist = (data) => api.post('/api/playlists', data).then((r) => r.data.playlist);
export const updatePlaylist = (id, data) => api.put(`/api/playlists/${id}`, data).then((r) => r.data.playlist);
export const deletePlaylist = (id) => api.delete(`/api/playlists/${id}`);
export const addSongToPlaylist = (id, songId) => api.patch(`/api/playlists/${id}/songs`, { action: 'add', songId }).then((r) => r.data.playlist);
export const removeSongFromPlaylist = (id, songId) => api.patch(`/api/playlists/${id}/songs`, { action: 'remove', songId }).then((r) => r.data.playlist);
