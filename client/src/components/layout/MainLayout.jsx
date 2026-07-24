import { Outlet } from 'react-router-dom';
import { Play } from 'lucide-react';
import { audio } from '../../lib/audio';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import MiniPlayer from '../player/MiniPlayer';
import FullPlayer from '../player/FullPlayer';
import usePlayerStore from '../../store/playerStore';
import useRoomStore from '../../store/roomStore';
import useAudio from '../../hooks/useAudio';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import useNetworkStore from '../../store/networkStore';

/**
 * Permanently mounted audio engine — never unmounts so the song
 * never restarts when FullPlayer opens/closes or routes change.
 */
function AudioManager() {
  useAudio();
  useKeyboardShortcuts();
  return null;
}

export default function MainLayout() {
  const { currentSong, isFullPlayer, isAudioBlocked } = usePlayerStore();
  const { isInRoom } = useRoomStore();

  return (
    <div className="flex flex-col h-full bg-surface-base overflow-hidden">
      <AudioManager />

      {/* Main Content Area (Sidebar + Pages) */}
      <div className="flex flex-1 min-h-0">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main page content */}
        <div className="flex flex-col flex-1 min-w-0 bg-surface-base rounded-tl-xl md:ml-2">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-24 md:pb-0">
            {useNetworkStore().isOffline && (
              <div className="bg-surface-overlay text-text-secondary text-xs font-semibold py-1.5 text-center flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Offline Mode - Showing downloaded music only
              </div>
            )}
            <div className="p-4 md:p-6 pb-32">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Player - Persistent on all screen sizes */}
      {currentSong && !isInRoom && (
        <div className={`z-50 ${isFullPlayer ? 'invisible h-0' : ''}`}>
          <MiniPlayer />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Full screen player overlay — hidden in rooms */}
      {isFullPlayer && !isInRoom && <FullPlayer />}

      {/* Audio unblock overlay for iOS Safari */}
      {isAudioBlocked && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
          <div className="glass p-8 rounded-3xl flex flex-col items-center max-w-xs text-center border border-surface-border">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6 shadow-lg shadow-accent/10 animate-pulse-slow">
              <Play className="w-10 h-10 text-accent ml-1" />
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-3">Tap to Play</h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              Your browser requires you to tap the screen before music can play in the background.
            </p>
            <button 
              className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-accent/20 transition-transform active:scale-95"
              onClick={() => {
                audio.play().then(() => {
                  usePlayerStore.getState().setAudioBlocked(false);
                }).catch(() => {});
              }}
            >
              Start Listening
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
