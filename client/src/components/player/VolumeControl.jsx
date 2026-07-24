import usePlayerStore from '../../store/playerStore';
import { VolumeX, Volume, Volume1, Volume2 } from 'lucide-react';

export default function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayerStore();
  const displayVol = isMuted ? 0 : volume;

  let Icon = Volume2;
  if (displayVol === 0) Icon = VolumeX;
  else if (displayVol < 0.4) Icon = Volume;
  else if (displayVol < 0.8) Icon = Volume1;

  return (
    <div className="flex items-center gap-2 group w-full">
      <button
        id="mute-btn"
        className="text-text-muted hover:text-text-primary transition-colors"
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <Icon className="w-4 h-4" />
      </button>
      <div className="flex-1 h-1 bg-surface-border rounded-full relative cursor-pointer group/vol">
        <div
          className="absolute top-0 left-0 h-full bg-white rounded-full group-hover/vol:bg-accent transition-colors"
          style={{ width: `${displayVol * 100}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/vol:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{ left: `calc(${displayVol * 100}% - 6px)` }}
        />
        <input
          id="volume-slider"
          type="range"
          min="0" max="1" step="0.01"
          value={displayVol}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
