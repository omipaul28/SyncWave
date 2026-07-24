import { useState, useRef, useCallback } from 'react';
import { adminImportFromYoutube } from '../../api/adminApi';

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  queued:       { label: 'Queued',      color: 'text-text-muted',   bg: 'bg-surface-overlay',  icon: '⏳' },
  fetching_info:{ label: 'Fetching info', color: 'text-blue-400',   bg: 'bg-blue-500/10',      icon: '🔍' },
  downloading:  { label: 'Downloading', color: 'text-yellow-400',   bg: 'bg-yellow-500/10',    icon: '⬇️'  },
  converting:   { label: 'Converting',  color: 'text-orange-400',   bg: 'bg-orange-500/10',    icon: '🔄' },
  uploading:    { label: 'Uploading',   color: 'text-purple-400',   bg: 'bg-purple-500/10',    icon: '☁️'  },
  saving:       { label: 'Saving',      color: 'text-accent',       bg: 'bg-accent/10',        icon: '💾' },
  done:         { label: 'Done',        color: 'text-green-400',    bg: 'bg-green-500/10',     icon: '✅' },
  error:        { label: 'Error',       color: 'text-red-400',      bg: 'bg-red-500/10',       icon: '❌' },
};

// ── URL parsing ──────────────────────────────────────────────────────────────
const parseUrls = (text) =>
  text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && (s.includes('youtube.com') || s.includes('youtu.be')));

// ── Song card ────────────────────────────────────────────────────────────────
function SongCard({ item }) {
  const meta = STATUS_META[item.status] || STATUS_META.queued;
  const isActive = !['queued', 'done', 'error'].includes(item.status);

  return (
    <div className={`rounded-xl border transition-all duration-300 ${
      item.status === 'done'  ? 'border-green-500/20 bg-green-500/5' :
      item.status === 'error' ? 'border-red-500/20 bg-red-500/5' :
      isActive                ? 'border-accent/30 bg-accent/5 shadow-glow' :
                                'border-surface-border bg-surface-raised'
    } p-4`}>
      <div className="flex items-center gap-4">

        {/* Cover / placeholder */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-overlay">
          {item.song?.coverUrl ? (
            <img src={item.song.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {meta.icon}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {item.song?.title || item.title || item.url}
          </p>
          {(item.song?.artist || item.title) && (
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {item.song?.artist || ''}
            </p>
          )}
          {item.errorMsg && (
            <p className="text-xs text-red-400 mt-1 truncate">{item.errorMsg}</p>
          )}
          <p className="text-xs text-text-muted truncate mt-0.5 opacity-60">{item.url}</p>
        </div>

        {/* Status badge */}
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${meta.color} ${meta.bg}`}>
          {isActive && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          )}
          {meta.label}
        </div>
      </div>

      {/* Progress bar for active states */}
      {isActive && (
        <div className="mt-3 h-0.5 bg-surface-border rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-progress-indeterminate" />
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ImportYouTube() {
  const [rawInput, setRawInput]   = useState('');
  const [items, setItems]         = useState([]);   // { url, status, title, song, errorMsg }
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary]     = useState(null); // { done, failed }
  const abortRef = useRef(null);

  const parsedUrls = parseUrls(rawInput);

  // ── Update a single item by url ──────────────────────────────────────────
  const updateItem = useCallback((url, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.url === url ? { ...it, ...patch } : it))
    );
  }, []);

  // ── Stream handler ───────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parsedUrls.length || isRunning) return;

    // Reset state
    setSummary(null);
    setIsRunning(true);
    setItems(parsedUrls.map((url) => ({ url, status: 'queued', title: null, song: null, errorMsg: null })));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await adminImportFromYoutube(parsedUrls);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete chunk

        for (const part of parts) {
          const line = part.replace(/^data:\s*/, '').trim();
          if (!line) continue;

          let evt;
          try { evt = JSON.parse(line); } catch { continue; }

          if (evt.type === 'progress') {
            updateItem(evt.url, { status: evt.status, title: evt.title || null });
          } else if (evt.type === 'done') {
            updateItem(evt.url || parsedUrls[evt.index], { status: 'done', song: evt.song });
          } else if (evt.type === 'error') {
            updateItem(evt.url || parsedUrls[evt.index], { status: 'error', errorMsg: evt.message });
          } else if (evt.type === 'complete') {
            const done   = (evt.results || []).filter((r) => !r.error).length;
            const failed = (evt.results || []).filter((r) =>  r.error).length;
            setSummary({ done, failed });
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('YouTube import error:', err);
        // Mark all still-queued items as error
        setItems((prev) =>
          prev.map((it) =>
            it.status === 'queued' ? { ...it, status: 'error', errorMsg: 'Connection lost' } : it
          )
        );
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const handleReset = () => {
    setRawInput('');
    setItems([]);
    setSummary(null);
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">Import from YouTube</h1>
        <p className="text-text-secondary text-sm mt-1">
          Paste one or more YouTube URLs — audio is downloaded, converted to MP3 and uploaded automatically.
        </p>
      </div>

      {/* Summary banner */}
      {summary && (
        <div className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
          summary.failed === 0
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
        }`}>
          <span>
            ✅ {summary.done} imported
            {summary.failed > 0 && <span className="text-red-400 ml-3">❌ {summary.failed} failed</span>}
          </span>
          <button onClick={handleReset} className="btn-ghost text-xs">Start new batch</button>
        </div>
      )}

      {/* Input area */}
      {!isRunning && items.length === 0 && (
        <div className="card space-y-4">
          <label className="block text-sm font-medium text-text-secondary">
            YouTube URLs
            <span className="text-text-muted ml-2 font-normal">(one per line, or comma-separated)</span>
          </label>
          <textarea
            id="yt-url-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://youtu.be/L_jWHffIx5E\nhttps://www.youtube.com/watch?v=...`}
            rows={6}
            className="input-field resize-none font-mono text-xs leading-relaxed"
            spellCheck={false}
          />

          {parsedUrls.length > 0 && (
            <p className="text-xs text-text-muted">
              {parsedUrls.length} valid URL{parsedUrls.length !== 1 ? 's' : ''} detected
            </p>
          )}

          <button
            id="yt-import-btn"
            onClick={handleImport}
            disabled={parsedUrls.length === 0}
            className="btn-primary w-full justify-center py-3 gap-2"
          >
            ▶ Start Import ({parsedUrls.length} song{parsedUrls.length !== 1 ? 's' : ''})
          </button>
        </div>
      )}

      {/* Progress list */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Progress — {items.filter((i) => i.status === 'done').length} / {items.length} complete
            </h2>
            {isRunning && (
              <button onClick={handleCancel} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Cancel
              </button>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(
                  (items.filter((i) => ['done', 'error'].includes(i.status)).length / items.length) * 100
                )}%`,
              }}
            />
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <SongCard key={item.url} item={item} />
            ))}
          </div>

          {!isRunning && (
            <button onClick={handleReset} className="btn-ghost text-sm w-full justify-center mt-2">
              ← Import another batch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
