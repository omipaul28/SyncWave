import { Outlet } from 'react-router-dom';
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
  const { currentSong, isFullPlayer } = usePlayerStore();
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
    </div>
  );
}
