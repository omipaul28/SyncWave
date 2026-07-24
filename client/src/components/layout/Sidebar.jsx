import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../../lib/firebase';
import useAuthStore from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchMyPlaylists } from '../../api/usersApi';
import api from '../../api/axiosInstance';
import { Home, Search, Library, Settings, Plus, Headphones, LogOut, Disc, Music } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',        label: 'Home',    icon: Home },
  { to: '/search',  label: 'Search',  icon: Search },
  { to: '/library', label: 'Library', icon: Library },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [joinCode, setJoinCode]   = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining]     = useState(false);

  const { data: playlists = [] } = useQuery({
    queryKey: ['my-playlists'],
    queryFn: fetchMyPlaylists,
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate('/login');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setJoinError('');
    try {
      const { data } = await api.get(`/api/rooms/check/${code}`);
      if (data.exists) {
        navigate(`/room/${code}`);
        setJoinCode('');
      } else {
        setJoinError('Room not found');
      }
    } catch {
      setJoinError('Room not found');
    } finally {
      setJoining(false);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-surface-raised border-r border-surface-border h-full">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2">
        <Disc className="w-8 h-8 text-accent" />
        <span className="font-display text-xl font-bold text-white">SyncWave</span>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active text-text-primary' : ''}`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active text-text-primary' : ''}`
            }
          >
            <Settings className="w-5 h-5" />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <hr className="my-3 border-surface-border mx-3" />

      {/* ── Listening Room ──────────────────────────────────────────────────── */}
      <div className="px-3 mb-1">
        <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
          <Headphones className="w-4 h-4" /> Listening Room
        </p>

        <button
          id="create-room-btn"
          onClick={() => navigate('/room/new')}
          className="sidebar-item w-full text-left"
        >
          <Plus className="w-5 h-5" />
          <span>Create Room</span>
        </button>

        {/* Join by code */}
        <form onSubmit={handleJoin} className="mt-2 px-1">
          <div className="flex gap-1.5">
            <input
              id="join-room-input"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
              placeholder="Enter room code…"
              maxLength={8}
              className="input-field text-xs py-1.5 px-2 flex-1 font-mono tracking-widest"
              spellCheck={false}
            />
            <button
              id="join-room-btn"
              type="submit"
              disabled={!joinCode.trim() || joining}
              className="btn-primary text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              {joining ? '…' : 'Join'}
            </button>
          </div>
          {joinError && (
            <p className="text-xs text-red-400 mt-1 px-1">{joinError}</p>
          )}
        </form>
      </div>

      <hr className="my-3 border-surface-border mx-3" />

      {/* ── Playlists ───────────────────────────────────────────────────────── */}
      <div className="px-3 flex-1 overflow-y-auto no-scrollbar">
        <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
          Your Playlists
        </p>
        {playlists.length === 0 ? (
          <p className="px-4 text-sm text-text-muted">No playlists yet</p>
        ) : (
          <div className="space-y-0.5">
            {playlists.map((pl) => (
              <NavLink
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className={({ isActive }) =>
                  `sidebar-item text-sm ${isActive ? 'active' : ''}`
                }
              >
                <span className="w-8 h-8 rounded flex-shrink-0 bg-surface-overlay flex items-center justify-center text-text-secondary overflow-hidden">
                  {pl.cover ? (
                    <img src={pl.cover} alt={pl.title} className="w-full h-full object-cover" />
                  ) : <Music className="w-4 h-4" />}
                </span>
                <span className="truncate">{pl.title}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* ── User profile ────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-surface-border">
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : user?.username?.[0]?.toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.username}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <button
            id="logout-btn"
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="btn-icon text-text-muted hover:text-red-400 flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
