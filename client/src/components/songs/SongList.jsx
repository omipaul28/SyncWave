import usePlayerStore from '../../store/playerStore';
import DownloadButton from '../ui/DownloadButton';
import { Play, Pause, Music } from 'lucide-react';

const formatTime = (s) => {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function SongList({ songs = [], showIndex = true }) {
  const { currentSong, isPlaying, setCurrentSong, setIsPlaying, setQueue } = usePlayerStore();

  const play = (song, idx) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setQueue(songs.slice(idx + 1));
    }
  };

  return (
    <div className="space-y-1">
      {songs.map((song, idx) => {
        const isActive = currentSong?.id === song.id;
        return (
          <div
            key={song.id}
            id={`song-row-${song.id}`}
            className={`flex items-center gap-4 px-4 py-2 rounded-lg group cursor-pointer transition-colors
              ${isActive ? 'bg-white/5' : 'hover:bg-surface-hover'}`}
            onClick={() => play(song, idx)}
          >
            {/* Index or play icon */}
            <div className="w-6 flex-shrink-0 text-center flex items-center justify-center">
              {isActive && isPlaying ? (
                <div className="equalizer h-3 justify-center">
                  {[0, 0.1, 0.2].map((d) => (
                    <div key={d} className="equalizer-bar bg-accent" style={{ animationDelay: `${d}s`, height: '100%' }} />
                  ))}
                </div>
              ) : (
                <span className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-text-muted group-hover:hidden'}`}>
                  {showIndex ? idx + 1 : ''}
                </span>
              )}
              <span className="hidden group-hover:block text-text-primary text-sm">
                {isActive && !isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </span>
            </div>

            {/* Cover */}
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-surface-overlay">
              {song.coverUrl
                ? <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-text-secondary"><Music className="w-4 h-4" /></div>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                {song.title}
              </p>
              <p className="text-xs text-text-secondary truncate">{song.artist}</p>
            </div>

            <p className="text-xs text-text-muted hidden md:block truncate max-w-32">{song.album}</p>
            
            <div className="flex items-center gap-2">
              <DownloadButton song={song} className="hidden group-hover:block" />
              <p className="text-xs text-text-muted tabular-nums">{formatTime(song.duration)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
