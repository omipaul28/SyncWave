import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-base">
      {/* Left – branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-surface-base to-accent-dark/20" />
        <div className="relative text-center space-y-6">
          <div className="text-8xl mb-4 animate-pulse-slow">🎵</div>
          <h1 className="font-display text-5xl font-bold gradient-text">SyncWave</h1>
          <p className="text-text-secondary text-xl max-w-sm text-balance">
            Stream music and listen together — in perfect sync with anyone, anywhere.
          </p>
          <div className="flex gap-6 justify-center mt-8 text-text-muted text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">🎧</div>
              <div>Collaborative</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <div>Real-time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎶</div>
              <div>Synchronized</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-3xl">🎵</span>
            <h1 className="font-display text-2xl font-bold gradient-text mt-2">SyncWave</h1>
          </div>

          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
          <p className="text-text-secondary mb-8 text-sm">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs text-text-muted">
              <span className="bg-surface-base px-3">or continue with</span>
            </div>
          </div>

          <button
            id="google-login-btn"
            onClick={handleGoogle}
            className="btn-secondary w-full justify-center py-3"
          >
            <span>🔵</span> Google
          </button>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-light font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
