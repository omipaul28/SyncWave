import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyPlaylists, fetchProfile } from '../api/usersApi';
import { createPlaylist } from '../api/playlistsApi';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import SongList from '../components/songs/SongList';
import api from '../api/axiosInstance';
import { Heart, Clock, Music, Plus } from 'lucide-react';

export default function Library() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [activeTab, setActiveTab] = useState('playlists');

  const { data: playlists = [] } = useQuery({ queryKey: ['my-playlists'], queryFn: fetchMyPlaylists });
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: fetchProfile });

  // Fetch liked songs
  const { data: likedSongs = [] } = useQuery({
    queryKey: ['liked-songs', user?.likedSongs],
    queryFn: async () => {
      if (!user?.likedSongs?.length) return [];
      const results = await Promise.allSettled(
        user.likedSongs.slice(0, 50).map((id) => api.get(`/api/songs/${id}`).then((r) => r.data.song))
      );
      return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    },
    enabled: !!user?.likedSongs?.length,
  });

  const createMutation = useMutation({
    mutationFn: () => createPlaylist({ title: newPlaylistTitle }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      setShowCreateModal(false);
      setNewPlaylistTitle('');
    },
  });

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-text-primary">Your Library</h1>
        <button id="create-playlist-btn" className="btn-secondary rounded-full" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Playlist
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border">
        {['playlists', 'liked', 'recent'].map((tab) => (
          <button
            key={tab}
            id={`library-tab-${tab}`}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px capitalize flex items-center gap-2 ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'liked' ? <><Heart className="w-4 h-4" /> Liked Songs</> : 
             tab === 'recent' ? <><Clock className="w-4 h-4" /> Recent</> : 
             <><Music className="w-4 h-4" /> Playlists</>}
          </button>
        ))}
      </div>

      {activeTab === 'playlists' && (
        <div>
          {playlists.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Music className="w-16 h-16 text-text-muted mb-4" />
              <p className="text-text-secondary">No playlists yet</p>
              <button className="btn-primary rounded-full font-bold mt-4" onClick={() => setShowCreateModal(true)}>
                Create your first playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <Link
                  key={pl.id}
                  to={`/playlist/${pl.id}`}
                  className="card hover:border-surface-border group transition-all"
                >
                  <div className="aspect-square rounded-sm mb-3 overflow-hidden bg-surface-overlay flex items-center justify-center text-text-secondary shadow-card">
                    {pl.cover ? (
                      <img src={pl.cover} alt={pl.title} className="w-full h-full object-cover" />
                    ) : <Music className="w-10 h-10" />}
                  </div>
                  <p className="font-semibold text-text-primary truncate">{pl.title}</p>
                  <p className="text-xs text-text-muted">{pl.songs?.length || 0} songs</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'liked' && (
        <div>
          {likedSongs.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Heart className="w-16 h-16 text-text-muted mb-4" />
              <p className="text-text-secondary">Songs you like will appear here</p>
            </div>
          ) : (
            <SongList songs={likedSongs} />
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="text-center py-16">
          <p className="text-text-secondary">Recently played songs will appear here</p>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-overlay border border-surface-border rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-display text-lg font-bold text-text-primary mb-4">Create Playlist</h3>
            <input
              id="playlist-title-input"
              type="text"
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              placeholder="My Playlist"
              className="input-field mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createMutation.mutate()}
            />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                id="create-playlist-submit"
                className="btn-primary flex-1 justify-center"
                onClick={() => createMutation.mutate()}
                disabled={!newPlaylistTitle.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
