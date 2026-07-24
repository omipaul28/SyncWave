import { useState } from 'react';
import usePlayerStore from '../../store/playerStore';
import useAuthStore from '../../store/authStore';
import { toggleLike } from '../../api/usersApi';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, X, Maximize2, ListMusic, Mic2, Music } from 'lucide-react';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration,
    setIsPlaying, toggleFullPlayer, toggleQueue, toggleLyrics,
    isLyricsOpen, playNext, playPrevious, shuffle, setShuffle, repeat, setRepeat,
    seek, stopPlayback,
  } = usePlayerStore();

  const { user, setUser } = useAuthStore();
  const [likeLoading, setLikeLoading] = useState(false);
  const isLiked = user?.likedSongs?.includes(currentSong?.id);

  const handleToggleLike = async () => {
    if (!currentSong || likeLoading) return;
    setLikeLoading(true);
    try {
      const { liked } = await toggleLike(currentSong.id);
      setUser({
        ...user,
        likedSongs: liked
          ? [...(user.likedSongs || []), currentSong.id]
          : (user.likedSongs || []).filter((id) => id !== currentSong.id),
      });
    } catch (e) {
      console.error('Failed to toggle like:', e);
    } finally {
      setLikeLoading(false);
    }
  };

  if (!currentSong) return null;

  const cycleRepeat = () => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');

  return (
    <div
      id="mini-player"
      className="flex items-center gap-4 px-4 py-3 bg-surface-raised border-t border-surface-border h-20 flex-shrink-0 z-30"
    >
      {/* Song info — click to expand full player */}
      <div
        className="flex items-center gap-3 md:w-60 flex-shrink-0 cursor-pointer group flex-1 md:flex-none"
        onClick={toggleFullPlayer}
      >
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded overflow-hidden bg-surface-overlay flex-shrink-0 shadow-card">
          {currentSong.coverUrl ? (
            <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary"><Music className="w-6 h-6" /></div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="equalizer">
                {[0, 0.2, 0.4].map((d) => (
                  <div key={d} className="equalizer-bar" style={{ animationDelay: `${d}s`, height: '100%' }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {currentSong.title}
          </p>
          <p className="text-xs text-text-secondary truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* Like button next to song info (Desktop only) */}
      <button
        id="like-btn"
        className={`hidden md:flex btn-icon transition-colors ${isLiked ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
        onClick={handleToggleLike}
        disabled={likeLoading}
        title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Center — controls + progress (Desktop only) */}
      <div className="hidden md:flex flex-1 flex-col gap-1.5 min-w-0 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4">
          <button
            id="shuffle-btn"
            className={`transition-colors ${shuffle ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setShuffle(!shuffle)}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button id="prev-btn" className="text-text-secondary hover:text-text-primary transition-colors" onClick={playPrevious}>
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            id="play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-white text-surface-base flex items-center justify-center
                       hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button id="next-btn" className="text-text-secondary hover:text-text-primary transition-colors" onClick={playNext}>
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            id="repeat-btn"
            className={`transition-colors ${repeat !== 'off' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
            onClick={cycleRepeat}
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <ProgressBar value={currentTime} max={duration} onChange={seek} />
          <span className="w-10 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Mobile Play/Pause (Visible only on small screens) */}
      <div className="md:hidden flex items-center gap-2 flex-shrink-0">
        <button
          id="like-btn-mobile"
          className={`btn-icon transition-colors ${isLiked ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
          onClick={handleToggleLike}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        <button
          id="play-pause-btn-mobile"
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 flex items-center justify-center text-text-primary"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
      </div>

      {/* Right controls (Desktop only) */}
      <div className="hidden md:flex items-center justify-end gap-3 md:w-60 flex-shrink-0">
        <button className={`text-text-muted hover:text-text-primary transition-colors ${isLyricsOpen ? 'text-accent' : ''}`} onClick={toggleLyrics} title="Lyrics">
          <Mic2 className="w-4 h-4" />
        </button>
        <button className="text-text-muted hover:text-text-primary transition-colors" onClick={toggleQueue} title="Queue">
          <ListMusic className="w-4 h-4" />
        </button>
        <div className="w-24 flex items-center">
          <VolumeControl />
        </div>
        <button className="text-text-muted hover:text-text-primary transition-colors ml-2" onClick={toggleFullPlayer} title="Expand">
          <Maximize2 className="w-4 h-4" />
        </button>
        {/* ✕ Close */}
        <button
          className="text-text-muted hover:text-text-primary transition-colors ml-1"
          onClick={stopPlayback}
          title="Close player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
