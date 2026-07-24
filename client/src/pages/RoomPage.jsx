import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import useRoomStore from '../store/roomStore';
import useRoom from '../hooks/useRoom';
import useAuthStore from '../store/authStore';
import usePlayerStore from '../store/playerStore';
import { audio } from '../lib/audio'; // shared singleton — no double audio
import ProgressBar from '../components/player/ProgressBar';
import VolumeControl from '../components/player/VolumeControl';
import { fetchSongs } from '../api/songsApi';
import api from '../api/axiosInstance';
import {
  Search, Play, Plus, Music, Headphones, CheckCircle2, Link2, LogOut,
  Shuffle, SkipBack, Pause, SkipForward, Repeat, Repeat1, Users, Ban, X, MessageSquare, Send
} from 'lucide-react';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

// ── Song Search Panel ──────────────────────────────────────────────────────────
function SongSearchPanel({ onAdd, onPlayNow }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const songs = await fetchSongs({ search: q, limit: 20 });
        setResults(songs || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, []);

  useEffect(() => { search(query); }, [query]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3">
        <input
          className="input-field pl-9 text-sm"
          placeholder="Search songs to add…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted animate-pulse">…</span>
        )}
      </div>

      <div className="overflow-y-auto no-scrollbar flex-1 space-y-1">
        {results.map((song) => (
          <div
            key={song.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors group"
          >
            <div className="w-9 h-9 rounded overflow-hidden bg-surface-overlay flex-shrink-0 shadow-sm">
              {song.coverUrl
                ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-text-muted"><Music className="w-4 h-4" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{song.title}</p>
              <p className="text-xs text-text-muted truncate">{song.artist}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onPlayNow(song)}
                className="p-1.5 rounded-full bg-accent text-white hover:bg-accent-light hover:scale-105 active:scale-95 transition-all shadow-md"
                title="Play now"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
              <button
                onClick={() => onAdd(song)}
                className="p-1.5 rounded-full bg-surface-border text-text-secondary hover:bg-surface-hover hover:text-white transition-all"
                title="Add to queue"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {!searching && query && results.length === 0 && (
          <p className="text-text-muted text-xs text-center py-4">No results for "{query}"</p>
        )}
        {!query && (
          <p className="text-text-muted text-xs text-center py-6">Type to search your library</p>
        )}
      </div>
    </div>
  );
}

// ── Room Chat Panel ────────────────────────────────────────────────────────────
function RoomChatPanel({ roomId, onSendMessage, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array and sort by timestamp
        const msgs = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });

    return () => off(chatRef);
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const formatChatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-surface-base/50 rounded-xl overflow-hidden border border-surface-border">
      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.uid === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-surface-border flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden">
                    {msg.avatar ? <img src={msg.avatar} alt={msg.username} className="w-full h-full object-cover" /> : msg.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] text-text-muted mb-1 ml-1">{msg.username}</span>}
                  <div className={`px-3 py-1.5 rounded-2xl text-sm ${isMe ? 'bg-accent text-white rounded-br-sm' : 'bg-surface-overlay text-text-primary rounded-bl-sm border border-surface-border'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-text-muted mt-1 mx-1">{formatChatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-2 bg-surface-overlay border-t border-surface-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            className="input-field py-2 px-3 text-xs flex-1 rounded-full bg-surface-base"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-light transition-colors flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Room Page ─────────────────────────────────────────────────────────────
export default function RoomPage() {
  const { roomId: rawRoomId } = useParams();
  const roomId = rawRoomId?.toUpperCase();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setIsPlaying: setMainIsPlaying } = usePlayerStore();

  const room = useRoomStore();
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'search'
  const [copied, setCopied] = useState(false);

  const {
    emitPlay, emitPause, emitSeek, emitNext, emitPrev,
    emitQueueAdd, emitQueueRemove, emitShuffle, emitRepeat, emitSongChange,
    emitKick, emitChatMessage
  } = useRoom(roomId, audio);

  // Create room if navigating from "new"
  useEffect(() => {
    if (rawRoomId === 'new') {
      api.post('/api/rooms').then((r) => {
        navigate(`/room/${r.data.room.roomId}`, { replace: true });
      }).catch(() => navigate('/'));
    }
  }, [rawRoomId]);

  // Pause main player when entering a room
  useEffect(() => {
    setMainIsPlaying(false);
  }, []);

  // Sync singleton audio element with room state
  useEffect(() => {
    if (!room.currentSong?.audioUrl) return;
    if (audio.src !== room.currentSong.audioUrl) {
      audio.src = room.currentSong.audioUrl;
      audio.load();
    }
    if (room.isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [room.currentSong?.id, room.isPlaying]);

  // Stop room audio when leaving
  useEffect(() => {
    return () => {
      audio.pause();
    };
  }, []);

  // Audio event listeners
  useEffect(() => {
    const onTime = () => setLocalTime(audio.currentTime);
    const onDur  = () => setDuration(audio.duration || 0);
    const onEnded = () => emitNext();

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('ended', onEnded);
    };
  }, [emitNext]);

  const handleSeek = (t) => { audio.currentTime = t; emitSeek(t); };
  const handlePlayPause = () => room.isPlaying ? emitPause() : emitPlay();

  const handleLeave = () => {
    audio.pause();
    navigate('/');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
  };

  const handleAddToQueue = (song) => emitQueueAdd(song);

  const handlePlayNow = (song) => {
    emitSongChange(song);
    setActiveTab('queue');
  };

  if (!room.isInRoom && rawRoomId !== 'new') {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <Headphones className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse-slow" />
          <p className="text-text-secondary">Joining room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5 pb-4 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="room-badge mb-2"><Headphones className="w-3.5 h-3.5" /> Listening Room</div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Room&nbsp;
              <span
                className="font-mono text-accent cursor-pointer hover:underline"
                title="Click to copy code"
                onClick={copyCode}
              >
                {roomId}
              </span>
            </h1>
            {copied && <span className="text-xs text-green-400 animate-fade-in">Copied!</span>}
          </div>
          <p className="text-text-secondary text-sm mt-0.5">
            {room.members.length} member{room.members.length !== 1 ? 's' : ''} listening
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary text-sm px-4" onClick={copyCode}>
            {copied ? <><CheckCircle2 className="w-4 h-4 text-green-400" /> Copied!</> : '# Copy Code'}
          </button>
          <button className="btn-secondary text-sm px-4" onClick={copyLink}>
            <Link2 className="w-4 h-4" /> Copy Link
          </button>
          <button className="btn-ghost text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={handleLeave}>
            <LogOut className="w-4 h-4" /> Leave Room
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* ── Player ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center glass rounded-2xl p-8 min-h-0">
          {room.currentSong ? (
            <>
              {/* Cover */}
              <div className="w-52 h-52 rounded-2xl overflow-hidden mb-6 shadow-card ring-1 ring-white/5 flex-shrink-0">
                {room.currentSong.coverUrl ? (
                  <img src={room.currentSong.coverUrl} alt={room.currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-overlay flex items-center justify-center text-text-muted"><Music className="w-16 h-16" /></div>
                )}
              </div>

              {/* Song info */}
              <div className="text-center mb-6 w-full max-w-sm">
                <h2 className="font-display text-xl font-bold text-text-primary truncate">{room.currentSong.title}</h2>
                <p className="text-text-secondary truncate">{room.currentSong.artist}</p>
                {room.updatedBy && (
                  <p className="text-xs text-text-muted mt-1">
                    ▶ by {room.members.find((m) => m.uid === room.updatedBy)?.username || 'someone'}
                  </p>
                )}
              </div>

              {/* Progress */}
              <div className="w-full max-w-sm flex items-center gap-3 mb-6">
                <span className="text-xs text-text-muted tabular-nums w-10 text-right">{formatTime(localTime)}</span>
                <ProgressBar value={localTime} max={duration} onChange={handleSeek} />
                <span className="text-xs text-text-muted tabular-nums w-10">{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6">
                <button
                  id="room-shuffle-btn"
                  className={`transition-colors hover:text-white ${room.shuffle ? 'text-accent hover:text-accent-light' : 'text-text-muted'}`}
                  onClick={() => emitShuffle(!room.shuffle)}
                  title="Shuffle"
                ><Shuffle className="w-5 h-5" /></button>
                <button id="room-prev-btn" className="text-text-secondary hover:text-white transition-colors" onClick={emitPrev}>
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button
                  id="room-play-pause-btn"
                  onClick={handlePlayPause}
                  className="w-16 h-16 rounded-full bg-white text-surface-base flex items-center justify-center
                             hover:scale-105 active:scale-95 transition-transform shadow-lg hover:bg-gray-100"
                >
                  {room.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                <button id="room-next-btn" className="text-text-secondary hover:text-white transition-colors" onClick={emitNext}>
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
                <button
                  id="room-repeat-btn"
                  className={`transition-colors hover:text-white ${room.repeat !== 'off' ? 'text-accent hover:text-accent-light' : 'text-text-muted'}`}
                  onClick={() => emitRepeat(room.repeat === 'off' ? 'all' : room.repeat === 'all' ? 'one' : 'off')}
                  title={`Repeat: ${room.repeat}`}
                >
                  {room.repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </button>
              </div>

              <div className="mt-4">
                <VolumeControl />
              </div>
            </>
          ) : (
            <div className="text-center">
              <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-2 font-semibold">No song playing</p>
              <p className="text-text-muted text-sm mb-6">Search for songs and add them to the queue</p>
              <button className="btn-primary" onClick={() => setActiveTab('search')}>
                <Search className="w-4 h-4" /> Search Songs
              </button>
            </div>
          )}
        </div>

        {/* ── Right Panel ────────────────────────────────────────────────── */}
        <div className="w-72 flex flex-col gap-4 min-h-0">

          {/* Members */}
          <div className="glass rounded-2xl p-4 flex-shrink-0">
            <h3 className="flex items-center gap-2 font-semibold text-text-primary mb-3 text-sm">
              <Users className="w-4 h-4 text-text-muted" /> Members ({room.members.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
              {room.members.map((m) => (
                <div key={m.uid} className="flex items-center gap-2 group">
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden">
                    {m.avatar
                      ? <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" />
                      : m.username?.[0]?.toUpperCase()
                    }
                  </div>
                  <span className="text-sm text-text-primary truncate flex-1">{m.username}</span>
                  
                  {/* Roles and Actions */}
                  {m.uid === room.ownerId && <span className="text-xs text-accent">Host</span>}
                  
                  {m.uid === user?.uid && m.uid !== room.ownerId && (
                    <span className="text-xs text-text-muted">You</span>
                  )}
                  
                  {/* Ban Button for Host */}
                  {user?.uid === room.ownerId && m.uid !== room.ownerId && (
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-all"
                      title="Remove and Ban User"
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove and ban ${m.username}? They will not be able to rejoin.`)) {
                          emitKick(m.uid);
                        }
                      }}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Queue / Search tabs */}
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col min-h-0">
            {/* Tab switcher */}
            <div className="flex rounded-lg bg-surface-overlay p-0.5 mb-3 flex-shrink-0">
              {[
                { id: 'queue', label: `Queue (${room.queue.length})` },
                { id: 'chat', label: '💬 Chat' },
                { id: 'search', label: '🔍 Search' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-accent text-white shadow'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Queue tab */}
            {activeTab === 'queue' && (
              <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                {room.queue.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-text-muted text-sm mb-3">Queue is empty</p>
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => setActiveTab('search')}
                    >
                      + Add songs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {room.queue.map((song, i) => (
                      <div
                        key={`${song.id}-${i}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors group"
                      >
                        <div className="w-9 h-9 rounded overflow-hidden bg-surface-overlay flex-shrink-0">
                          {song.coverUrl
                            ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-text-muted"><Music className="w-4 h-4" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{song.title}</p>
                          <p className="text-xs text-text-muted truncate">{song.artist}</p>
                        </div>
                        <button
                          onClick={() => emitQueueRemove(i)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-red-400 hover:bg-surface-border rounded transition-all"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search tab */}
            {activeTab === 'search' && (
              <div className="flex-1 min-h-0 flex flex-col">
                <SongSearchPanel onAdd={handleAddToQueue} onPlayNow={handlePlayNow} />
              </div>
            )}

            {/* Chat tab */}
            {activeTab === 'chat' && (
              <div className="flex-1 min-h-0 flex flex-col">
                <RoomChatPanel 
                  roomId={roomId}
                  onSendMessage={(text) => emitChatMessage(text)} 
                  currentUserId={user?.uid}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
