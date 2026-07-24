import { useState } from 'react';
import usePlayerStore from '../../store/playerStore';
import useAuthStore from '../../store/authStore';
import { toggleLike } from '../../api/usersApi';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import LyricsPanel from './LyricsPanel';
import QueuePanel from './QueuePanel';
import DownloadButton from '../ui/DownloadButton';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Mic2, ListMusic, ChevronDown, Music } from 'lucide-react';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function FullPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration,
    setIsPlaying, toggleFullPlayer, isQueueOpen, toggleQueue,
    isLyricsOpen, toggleLyrics, shuffle, setShuffle,
    repeat, setRepeat, playNext, playPrevious, seek,
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
      id="full-player"
      className="fixed inset-0 z-50 flex animate-fade-in"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0c0618 100%)' }}
    >
      {/* Blurred background from cover art */}
      {currentSong.coverUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${currentSong.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px)',
          }}
        />
      )}

      <div className="relative flex w-full h-full">
        {/* Main player */}
        <div className={`flex flex-col items-center justify-center flex-1 p-12 ${isQueueOpen || isLyricsOpen ? 'border-r border-surface-border' : ''}`}>
          {/* Close button */}
          <button
            id="close-full-player"
            className="absolute top-6 left-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-text-secondary hover:text-white transition-colors"
            onClick={toggleFullPlayer}
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* Cover art */}
          <div className="relative mb-10 group">
            <div className="w-72 h-72 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
              {currentSong.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                  style={{ borderRadius: 'inherit' }}
                />
              ) : (
                <div className="w-full h-full bg-surface-overlay flex items-center justify-center text-text-muted"><Music className="w-20 h-20" /></div>
              )}
            </div>
            {isPlaying && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-5">
                {[0, 0.1, 0.2, 0.1, 0].map((d, i) => (
                  <div
                    key={i}
                    className="w-1 bg-accent rounded-full animate-equalizer"
                    style={{ animationDelay: `${d}s`, height: '100%' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Song info */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-text-primary mb-1">{currentSong.title}</h1>
            <p className="text-text-secondary text-lg">{currentSong.artist}</p>
            {currentSong.album && (
              <p className="text-text-muted text-sm mt-1">{currentSong.album}</p>
            )}
          </div>

          {/* Progress */}
          <div className="w-full max-w-md flex items-center gap-4 mb-6">
            <span className="text-xs text-text-muted tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
            <ProgressBar value={currentTime} max={duration} onChange={seek} />
            <span className="text-xs text-text-muted tabular-nums w-10">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-8">
            <button
              id="full-shuffle-btn"
              className={`transition-colors ${shuffle ? 'text-accent' : 'text-text-muted hover:text-white'}`}
              onClick={() => setShuffle(!shuffle)}
            >
              <Shuffle className="w-6 h-6" />
            </button>
            <button id="full-prev-btn" className="text-text-secondary hover:text-white transition-colors" onClick={playPrevious}>
              <SkipBack className="w-8 h-8 fill-current" />
            </button>
            <button
              id="full-play-pause-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 rounded-full bg-accent text-black flex items-center justify-center
                         hover:scale-105 active:scale-95 transition-all shadow-glow hover:bg-accent-light"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button id="full-next-btn" className="text-text-secondary hover:text-white transition-colors" onClick={playNext}>
              <SkipForward className="w-8 h-8 fill-current" />
            </button>
            <button
              id="full-repeat-btn"
              className={`transition-colors ${repeat !== 'off' ? 'text-accent' : 'text-text-muted hover:text-white'}`}
              onClick={cycleRepeat}
            >
              <Repeat className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center gap-6 mt-8">
            <div className="w-32 flex items-center">
              <VolumeControl />
            </div>
            <button
              id="full-like-btn"
              className={`btn-ghost px-2 py-2 transition-colors ${isLiked ? 'text-accent' : 'text-text-muted hover:text-white'}`}
              onClick={handleToggleLike}
              disabled={likeLoading}
              title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <DownloadButton song={currentSong} className="p-2" />
            <button
              id="full-lyrics-btn"
              className={`btn-ghost px-2 py-2 transition-colors ${isLyricsOpen ? 'text-accent' : 'text-text-muted hover:text-white'}`}
              onClick={toggleLyrics}
              title="Lyrics"
            >
              <Mic2 className="w-5 h-5" />
            </button>
            <button
              id="full-queue-btn"
              className={`btn-ghost px-2 py-2 transition-colors ${isQueueOpen ? 'text-accent' : 'text-text-muted hover:text-white'}`}
              onClick={toggleQueue}
              title="Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side panel — Lyrics or Queue */}
        {(isLyricsOpen || isQueueOpen) && (
          <div className="w-80 flex-shrink-0 overflow-y-auto bg-surface-raised/50">
            {isLyricsOpen && <LyricsPanel songId={currentSong.id} currentTime={currentTime} />}
            {isQueueOpen && !isLyricsOpen && <QueuePanel />}
          </div>
        )}
      </div>
    </div>
  );
}
