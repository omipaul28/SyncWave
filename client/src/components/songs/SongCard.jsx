import usePlayerStore from '../../store/playerStore';
import DownloadButton from '../ui/DownloadButton';
import { Play, Pause, Music } from 'lucide-react';

export default function SongCard({ song, queue = [] }) {
  const { currentSong, isPlaying, setCurrentSong, setIsPlaying, setQueue } = usePlayerStore();
  const isActive = currentSong?.id === song.id;

  const handlePlay = () => {
    if (isActive) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setQueue(queue.filter((s) => s.id !== song.id));
    }
  };

  return (
    <div
      id={`song-card-${song.id}`}
      className="song-card"
      onClick={handlePlay}
    >
      <div className="song-card-cover">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-overlay text-text-secondary">
            <Music className="w-8 h-8" />
          </div>
        )}

        {/* Play overlay - Spotify style (floating bottom right) */}
        <div className={`absolute bottom-2 right-2 flex items-center justify-center transition-all duration-300 shadow-xl
          ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
          {isActive && isPlaying ? (
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <div className="equalizer h-4">
                {[0, 0.15, 0.3].map((d) => (
                  <div key={d} className="equalizer-bar bg-black" style={{ animationDelay: `${d}s`, height: '100%' }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center hover:scale-105 hover:bg-accent-light transition-all">
              {isActive && !isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-0.5 mt-2 relative">
        <p className={`text-sm font-semibold truncate pr-8 ${isActive ? 'text-accent' : 'text-text-primary'}`}>
          {song.title}
        </p>
        <p className="text-xs text-text-secondary truncate pr-8">{song.artist}</p>
        {song.album && <p className="text-xs text-text-muted truncate pr-8">{song.album}</p>}
        
        <div className="absolute top-0 right-0">
          <DownloadButton song={song} className="text-xs" />
        </div>
      </div>
    </div>
  );
}
