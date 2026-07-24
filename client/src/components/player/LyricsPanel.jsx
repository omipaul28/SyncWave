import { useEffect, useRef } from 'react';
import useLyrics from '../../hooks/useLyrics';

export default function LyricsPanel({ songId, currentTime }) {
  const { lyrics, activeLine, isLoading, error, refetch } = useLyrics(songId, currentTime);
  const activeRef = useRef(null);

  // Auto-scroll to active line
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  return (
    <div className="flex flex-col h-full p-6">
      <h3 className="font-display font-semibold text-text-primary mb-6">Lyrics</h3>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-text-muted text-sm animate-pulse">Loading lyrics…</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-text-muted text-sm text-center">{error}</p>
          <button onClick={refetch} className="btn-ghost text-xs">Try again</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {lyrics?.synced ? (
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {lyrics.synced.map((line, i) => (
                <p
                  key={i}
                  ref={i === activeLine ? activeRef : null}
                  className={`text-base leading-relaxed transition-all duration-300 ${
                    i === activeLine
                      ? 'text-text-primary font-semibold text-lg scale-105 origin-left'
                      : 'text-text-muted'
                  }`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          ) : lyrics?.plain ? (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <pre className="text-text-secondary text-sm leading-loose whitespace-pre-wrap font-sans">
                {lyrics.plain}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-text-muted text-sm text-center">Lyrics not available for this song</p>
              <button onClick={refetch} className="btn-ghost text-xs">🔄 Search again</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
