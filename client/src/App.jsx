import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { connectSocket, disconnectSocket } from './lib/socket';
import { verifyUser } from './api/usersApi';
import useAuthStore from './store/authStore';
import { audio } from './lib/audio';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Login     from './pages/Login';
import Register  from './pages/Register';
import Home      from './pages/Home';
import Search    from './pages/Search';
import Library   from './pages/Library';
import PlaylistPage from './pages/PlaylistPage';
import ArtistPage   from './pages/ArtistPage';
import AlbumPage    from './pages/AlbumPage';
import RoomPage     from './pages/RoomPage';
import Profile      from './pages/Profile';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UploadSong     from './pages/admin/UploadSong';
import ManageSongs    from './pages/admin/ManageSongs';
import ManageUsers    from './pages/admin/ManageUsers';
import ImportYouTube  from './pages/admin/ImportYouTube';

// Guards
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="text-text-secondary">Loading…</span></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  const { setUser, setToken, setLoading, logout } = useAuthStore();

  useEffect(() => {
    // Unlock HTMLAudioElement for iOS Safari on first interaction
    const unlockAudio = () => {
      // Empty play call rejects with NotSupportedError but sets the unlocked flag on iOS Safari
      audio.play().catch(() => {});
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setToken(token);
          // Connect socket with token
          connectSocket(token);
          // Sync user profile from backend
          const user = await verifyUser();
          setUser(user);
        } catch (err) {
          console.error('Auth sync error:', err);
          logout();
        }
      } else {
        disconnectSocket();
        logout();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected (with sidebar/player layout) */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index               element={<Home />} />
        <Route path="search"       element={<Search />} />
        <Route path="library"      element={<Library />} />
        <Route path="playlist/:id" element={<PlaylistPage />} />
        <Route path="artist/:id"   element={<ArtistPage />} />
        <Route path="album/:id"    element={<AlbumPage />} />
        <Route path="room/:roomId" element={<RoomPage />} />
        <Route path="profile"      element={<Profile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><MainLayout /></AdminRoute>}>
        <Route index         element={<AdminDashboard />} />
        <Route path="upload" element={<UploadSong />} />
        <Route path="songs"  element={<ManageSongs />} />
        <Route path="users"  element={<ManageUsers />} />
        <Route path="youtube" element={<ImportYouTube />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
