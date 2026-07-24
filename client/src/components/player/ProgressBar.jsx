import { useRef, useCallback } from 'react';

export default function ProgressBar({ value = 0, max = 0, onChange }) {
  const barRef = useRef(null);
  const isDragging = useRef(false);

  const getTimeFromEvent = useCallback((e) => {
    const bar = barRef.current;
    if (!bar || !max) return 0;
    const rect = bar.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * max;
  }, [max]);

  const handleClick = useCallback((e) => {
    onChange?.(getTimeFromEvent(e));
  }, [getTimeFromEvent, onChange]);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    const onMove = (ev) => {
      if (isDragging.current) onChange?.(getTimeFromEvent(ev));
    };
    const onUp = (ev) => {
      if (isDragging.current) onChange?.(getTimeFromEvent(ev));
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [getTimeFromEvent, onChange]);

  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div
      ref={barRef}
      id="progress-bar"
      className="progress-bar flex-1"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="progress-fill transition-all duration-100" style={{ width: `${pct}%` }} />
      <div className="progress-thumb" style={{ left: `${pct}%` }} />
    </div>
  );
}
