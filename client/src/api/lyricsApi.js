import api from './axiosInstance';

export const fetchLyrics = (songId) => api.get(`/api/lyrics/${songId}`).then((r) => r.data.lyrics);
