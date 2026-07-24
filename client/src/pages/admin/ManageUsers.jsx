import { useQuery } from '@tanstack/react-query';
import { adminFetchUsers } from '../../api/adminApi';

export default function ManageUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminFetchUsers,
  });

  return (
    <div className="space-y-6 pb-4">
      <h1 className="font-display text-3xl font-bold text-text-primary">Manage Users</h1>

      {isLoading ? (
        <div className="text-text-muted animate-pulse">Loading users…</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border">
              <tr className="text-left text-text-muted text-xs uppercase tracking-widest">
                <th className="p-4">User</th>
                <th className="p-4 hidden md:table-cell">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                        {user.avatar
                          ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          : user.username?.[0]?.toUpperCase()
                        }
                      </div>
                      <span className="font-medium text-text-primary">{user.username}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-text-secondary">{user.email}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-surface-overlay text-text-muted'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-text-muted text-xs">
                    {user.createdAt?.seconds
                      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-text-muted">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
