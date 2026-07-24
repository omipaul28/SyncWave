import { useQuery } from '@tanstack/react-query';
import { fetchTrending, fetchSongs } from '../api/songsApi';
import useAuthStore from '../store/authStore';
import SongCard from '../components/songs/SongCard';
import SongList from '../components/songs/SongList';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Headphones, Search, Flame } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: trending = [], isLoading: loadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => fetchTrending(12),
  });

  const { data: recentSongs = [] } = useQuery({
    queryKey: ['recent-songs'],
    queryFn: async () => {
      if (!user?.recentlyPlayed?.length) return [];
      const ids = user.recentlyPlayed.slice(0, 6).map((r) => r.songId);
      const results = await Promise.allSettled(ids.map((id) => api.get(`/api/songs/${id}`).then((r) => r.data.song)));
      return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    },
    enabled: !!user,
  });

  const handleCreateRoom = async () => {
    try {
      const res = await api.post('/api/rooms');
      navigate(`/room/${res.data.room.roomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <div className="space-y-10 pb-4">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden p-8 min-h-48 flex flex-col justify-end"
        style={{ background: 'linear-gradient(135deg, #1DB954 0%, #121212 100%)' }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Good {getGreeting()}
          </h1>
          <p className="text-white/80 mb-6">Start listening or invite friends for a shared session</p>
          <div className="flex gap-3 flex-wrap">
            <button
              id="home-create-room-btn"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-black font-bold
                         hover:scale-105 hover:bg-accent-light active:scale-95 transition-all shadow-lg text-sm"
              onClick={handleCreateRoom}
            >
              <Headphones className="w-4 h-4" /> Start Listening Room
            </button>
            <button
              onClick={() => navigate('/search')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-overlay text-white font-bold
                         hover:bg-surface-border active:scale-95 transition-all text-sm"
            >
              <Search className="w-4 h-4" /> Discover Music
            </button>
          </div>
        </div>
      </div>

      {/* Recently played */}
      {recentSongs.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">Recently Played</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentSongs.map((song) => (
              <SongCard key={song.id} song={song} queue={recentSongs} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <h2 className="font-display text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-accent" /> Trending Now</h2>
        {loadingTrending ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="song-card animate-pulse">
                <div className="aspect-square rounded-lg bg-surface-overlay" />
                <div className="h-3 bg-surface-overlay rounded w-3/4" />
                <div className="h-2 bg-surface-overlay rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trending.map((song) => (
              <SongCard key={song.id} song={song} queue={trending} />
            ))}
          </div>
        )}
      </section>

      {/* Top trending list */}
      {trending.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">Top Songs</h2>
          <SongList songs={trending.slice(0, 10)} />
        </section>
      )}
    </div>
  );
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
