import usePlayerStore from '../../store/playerStore';

export default function QueuePanel() {
  const { queue, currentSong, history, playFromQueue, removeFromQueue } = usePlayerStore();

  return (
    <div className="flex flex-col h-full p-6">
      <h3 className="font-display font-semibold text-text-primary mb-4">Queue</h3>

      {currentSong && (
        <div className="mb-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Now Playing</p>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
            <div className="w-9 h-9 rounded overflow-hidden bg-surface-overlay flex-shrink-0">
              {currentSong.coverUrl
                ? <img src={currentSong.coverUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-sm">🎵</div>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{currentSong.title}</p>
              <p className="text-xs text-text-muted truncate">{currentSong.artist}</p>
            </div>
            <div className="equalizer flex-shrink-0">
              {[0, 0.15, 0.3].map((d) => (
                <div key={d} className="equalizer-bar" style={{ animationDelay: `${d}s`, height: '100%' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {queue.length > 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Next Up</p>
          {queue.map((song, i) => (
            <div
              key={`${song.id}-${i}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover group transition-colors cursor-pointer"
              onClick={() => playFromQueue(i)}
            >
              <div className="w-9 h-9 rounded overflow-hidden bg-surface-overlay flex-shrink-0">
                {song.coverUrl
                  ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-sm">🎵</div>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{song.title}</p>
                <p className="text-xs text-text-muted truncate">{song.artist}</p>
              </div>
              <button
                className="btn-icon text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm">Queue is empty</p>
        </div>
      )}
    </div>
  );
}
