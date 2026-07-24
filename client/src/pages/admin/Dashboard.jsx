import { useQuery } from '@tanstack/react-query';
import { adminFetchStats } from '../../api/adminApi';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminFetchStats,
  });

  return (
    <div className="space-y-8 pb-4">
      <h1 className="font-display text-3xl font-bold text-text-primary">Admin Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-text-primary">
            {isLoading ? '—' : stats?.totalUsers || 0}
          </div>
          <div className="text-sm text-text-muted">Total Users</div>
        </div>
        <div className="card">
          <div className="text-3xl mb-2">🎵</div>
          <div className="text-3xl font-bold text-text-primary">
            {isLoading ? '—' : stats?.topSongs?.length || 0}
          </div>
          <div className="text-sm text-text-muted">Songs</div>
        </div>
      </div>

      {/* Cloudinary Usage */}
      {stats?.cloudinaryStats?.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">☁️ Cloudinary Storage & Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.cloudinaryStats.map((cloud) => (
              <div key={cloud.account} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-text-primary text-base">Account {cloud.account}</div>
                  {cloud.plan && <div className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded uppercase tracking-wider">{cloud.plan}</div>}
                </div>
                <div className="text-xs text-text-muted mb-4 font-mono">{cloud.cloudName || 'Unknown'}</div>

                {cloud.error ? (
                  <div className="text-xs text-red-400">Error: {cloud.error}</div>
                ) : (
                  <div className="space-y-3">
                    {/* Credits */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">Credits Used</span>
                        <span className="tabular-nums">{(cloud.credits?.usage || 0).toFixed(2)} / {cloud.credits?.limit || 25}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-overlay rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${(cloud.credits?.used_percent || 0) > 80 ? 'bg-red-400' : 'bg-accent'}`} 
                          style={{ width: `${Math.min((cloud.credits?.used_percent || 0), 100)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Storage */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">Storage Used</span>
                        <span className="tabular-nums">
                          {((cloud.storage?.usage || 0) / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/admin/upload',  label: 'Upload Song',        icon: '⬆️' },
            { to: '/admin/youtube', label: 'Import from YouTube', icon: '▶️' },
            { to: '/admin/songs',   label: 'Manage Songs',        icon: '🎵' },
            { to: '/admin/users',   label: 'Manage Users',        icon: '👥' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card flex flex-col items-center gap-3 text-center hover:border-accent/30 hover:shadow-glow transition-all"
            >
              <div className="text-3xl">{item.icon}</div>
              <div className="text-sm font-medium text-text-primary">{item.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top songs */}
      {stats?.topSongs?.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">🔥 Top Songs</h2>
          <div className="space-y-2">
            {stats.topSongs.map((song, i) => (
              <div key={song.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-raised">
                <span className="text-text-muted font-mono text-sm w-6 text-center">{i + 1}</span>
                <div className="w-10 h-10 rounded bg-surface-overlay overflow-hidden flex-shrink-0">
                  {song.coverUrl
                    ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-sm">🎵</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{song.title}</p>
                  <p className="text-xs text-text-muted truncate">{song.artist}</p>
                </div>
                <span className="text-xs text-text-muted tabular-nums">{song.playCount || 0} plays</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
