import api from './axiosInstance';
import { auth } from '../lib/firebase';

export const adminUploadSong = (formData) =>
  api.post('/api/admin/songs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // Disable timeout — audio uploads to Cloudinary can take 30–120s
    onUploadProgress: (e) => console.log('Upload progress:', Math.round((e.loaded / e.total) * 100) + '%'),
  }).then((r) => r.data.song);

/**
 * Batch import songs from YouTube URLs.
 * Uses raw fetch (not axios) to support SSE streaming for real-time progress.
 * Returns the raw Response — caller reads body as ReadableStream.
 */
export const adminImportFromYoutube = async (urls) => {
  const token = await auth.currentUser?.getIdToken();
  return fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/youtube/import`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ urls }),
    }
  );
};

export const adminEditSong    = (id, data) => api.put(`/api/admin/songs/${id}`, data).then((r) => r.data.song);
export const adminDeleteSong  = (id)       => api.delete(`/api/admin/songs/${id}`);
export const adminFetchUsers  = ()         => api.get('/api/admin/users').then((r) => r.data.users);
export const adminCreateArtist = (data)    => api.post('/api/admin/artists', data).then((r) => r.data.artist);
export const adminUpdateArtist = (id, data)=> api.put(`/api/admin/artists/${id}`, data).then((r) => r.data.artist);
export const adminCreateAlbum  = (data)    => api.post('/api/admin/albums', data).then((r) => r.data.album);
export const adminFetchStats   = ()        => api.get('/api/admin/stats').then((r) => r.data);

