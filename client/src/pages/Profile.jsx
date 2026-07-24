import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateProfile } from '../api/usersApi';
import useAuthStore from '../store/authStore';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () => updateProfile({ username }),
    onSuccess: (updated) => {
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">Profile</h1>

      <div className="card space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : user?.username?.[0]?.toUpperCase()
            }
          </div>
          <div>
            <p className="font-semibold text-text-primary">{user?.username}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
              user?.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-surface-overlay text-text-muted'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Edit username */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="profile-username">
            Username
          </label>
          <input
            id="profile-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
        </div>

        <button
          id="save-profile-btn"
          className="btn-primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !username.trim()}
        >
          {mutation.isPending ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Liked Songs', value: user?.likedSongs?.length || 0, icon: '❤️' },
          { label: 'Playlists', value: user?.playlists?.length || 0, icon: '🎵' },
          { label: 'Recently Played', value: user?.recentlyPlayed?.length || 0, icon: '🕐' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
