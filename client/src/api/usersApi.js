import api from './axiosInstance';
import useNetworkStore from '../store/networkStore';
import { getOfflinePlaylists } from '../services/offlineDB';

export const verifyUser    = ()       => api.post('/api/auth/verify').then((r) => r.data.user);
export const fetchProfile  = ()       => api.get('/api/users/me').then((r) => r.data.user);
export const updateProfile = (data)   => api.put('/api/users/me', data).then((r) => r.data.user);
export const toggleLike    = (songId) => api.patch('/api/users/me/likes', { songId }).then((r) => r.data);
export const fetchMyPlaylists = async () => {
  if (useNetworkStore.getState().isOffline) {
    return getOfflinePlaylists();
  }
  return api.get('/api/users/me/playlists').then((r) => r.data.playlists);
};
