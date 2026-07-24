import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSongs } from '../../api/songsApi';
import { adminDeleteSong } from '../../api/adminApi';
import { Link } from 'react-router-dom';

const formatTime = (s) => {
  if (!s) return '';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

export default function ManageSongs() {
  const qc = useQueryClient();

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['admin-songs'],
    queryFn: () => fetchSongs({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteSong(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-songs'] }),
  });

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-text-primary">Manage Songs</h1>
        <Link to="/admin/upload" className="btn-primary">+ Upload Song</Link>
      </div>

      {isLoading ? (
        <div className="text-text-muted animate-pulse">Loading songs…</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border">
              <tr className="text-left text-text-muted text-xs uppercase tracking-widest">
                <th className="p-4">Song</th>
                <th className="p-4 hidden md:table-cell">Artist</th>
                <th className="p-4 hidden lg:table-cell">Genre</th>
                <th className="p-4 hidden lg:table-cell">Duration</th>
                <th className="p-4 hidden md:table-cell">Plays</th>
                <th className="p-4 hidden md:table-cell">Storage</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr key={song.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded overflow-hidden bg-surface-overlay flex-shrink-0">
                        {song.coverUrl
                          ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>
                        }
                      </div>
                      <span className="font-medium text-text-primary truncate max-w-32">{song.title}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-text-secondary">{song.artist}</td>
                  <td className="p-4 hidden lg:table-cell text-text-muted">{song.genre || '—'}</td>
                  <td className="p-4 hidden lg:table-cell text-text-muted tabular-nums">{formatTime(song.duration)}</td>
                  <td className="p-4 hidden md:table-cell text-text-muted tabular-nums">{song.playCount || 0}</td>
                  <td className="p-4 hidden md:table-cell">
                    {song.cloudinaryAccount ? (
                      <span className="text-xs bg-surface-overlay px-2 py-1 rounded-md text-text-secondary border border-surface-border font-mono">
                        Cloud {song.cloudinaryAccount}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      id={`delete-song-${song.id}`}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                      onClick={() => {
                        if (confirm(`Delete "${song.title}"?`)) deleteMutation.mutate(song.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {songs.length === 0 && (
            <div className="text-center py-12 text-text-muted">No songs uploaded yet</div>
          )}
        </div>
      )}
    </div>
  );
}
