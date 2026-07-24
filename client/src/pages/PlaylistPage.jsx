import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlaylist, deletePlaylist } from '../api/playlistsApi';
import { fetchSong } from '../api/songsApi';
import useAuthStore from '../store/authStore';
import usePlayerStore from '../store/playerStore';
import SongList from '../components/songs/SongList';
import DownloadPlaylistButton from '../components/ui/DownloadPlaylistButton';
import { Play, Trash2, Globe, Lock, Music } from 'lucide-react';

export default function PlaylistPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => fetchPlaylist(id),
  });

  // Fetch all songs in the playlist
  const { data: songs = [] } = useQuery({
    queryKey: ['playlist-songs', playlist?.songs],
    queryFn: async () => {
      if (!playlist?.songs?.length) return [];
      const results = await Promise.allSettled(
        playlist.songs.map((sid) => fetchSong(sid))
      );
      return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    },
    enabled: !!playlist?.songs,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlaylist(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      navigate('/library');
    },
  });

  const playAll = () => {
    if (songs.length === 0) return;
    setCurrentSong(songs[0]);
    setQueue(songs.slice(1));
  };

  if (isLoading) return <div className="text-text-muted animate-pulse p-4">Loading playlist…</div>;
  if (!playlist) return <div className="text-text-muted p-4">Playlist not found</div>;

  const isOwner = playlist.ownerId === user?.uid;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 items-end md:items-end">
        <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 rounded-sm overflow-hidden bg-surface-overlay flex items-center justify-center text-text-secondary shadow-card">
          {playlist.cover ? (
            <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover" />
          ) : <Music className="w-16 h-16" />}
        </div>
        <div className="flex flex-col justify-end w-full">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
            {playlist.visibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
            {playlist.visibility === 'public' ? 'Public' : 'Private'} Playlist
          </p>
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">{playlist.title}</h1>
          <p className="text-text-secondary text-sm mb-6">{songs.length} songs</p>
          <div className="flex items-center gap-3">
            <button
              id="play-playlist-btn"
              className="w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center
                         hover:scale-105 active:scale-95 transition-all shadow-glow hover:bg-accent-light"
              onClick={playAll}
              disabled={songs.length === 0}
            >
              <Play className="w-6 h-6 fill-current ml-1" />
            </button>
            <DownloadPlaylistButton playlist={playlist} songs={songs} />
            {isOwner && (
              <button
                id="delete-playlist-btn"
                className="btn-ghost text-text-muted hover:text-red-400 p-2"
                onClick={() => deleteMutation.mutate()}
                title="Delete Playlist"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">This playlist is empty. Search for songs to add!</p>
        </div>
      ) : (
        <SongList songs={songs} />
      )}
    </div>
  );
}
