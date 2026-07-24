import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import useRoomStore from '../store/roomStore';
import usePlayerStore from '../store/playerStore';
import useSocket from './useSocket';

const DRIFT_THRESHOLD_SEC = 0.5;   // seek-correct if drift > 500ms
const DRIFT_RESYNC_SEC = 3;        // full resync if drift > 3s
const HEARTBEAT_INTERVAL_MS = 5000; // heartbeat every 5s

/**
 * Manages joining/leaving a room and drift correction for collaborative playback.
 * @param {string|null} roomId
 * @param {HTMLAudioElement} audio - the shared audio element
 */
const useRoom = (rawRoomId, audio) => {
  const roomId = (rawRoomId || '').toUpperCase();
  const heartbeatRef = useRef(null);
  const { setRoom, applyStateDelta, leaveRoom } = useRoomStore();
  const storeRef = useRef(useRoomStore.getState());

  // Keep ref in sync with store
  useEffect(() => {
    const unsub = useRoomStore.subscribe((state) => { storeRef.current = state; });
    return unsub;
  }, []);

  // ── Join / Leave ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join-room', { roomId });

    return () => {
      socket.emit('leave-room', { roomId });
      leaveRoom();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [roomId]);

  // ── Socket event handlers ────────────────────────────────────────────────────
  useSocket(
    {
      'sync-state': (room) => {
        setRoom(room);
        applyAudioState(room);
      },
      'state-update': (delta) => {
        applyStateDelta(delta);
        if (audio && delta.currentTime !== undefined && !delta.isPlaying) {
          audio.currentTime = delta.currentTime;
        }
        if (delta.isPlaying === true) {
          audio?.play().then(() => {
            if (usePlayerStore.getState().audioError) usePlayerStore.getState().setAudioError(null);
          }).catch((e) => {
            usePlayerStore.getState().setAudioError(e.name + ': ' + e.message);
          });
        }
        if (delta.isPlaying === false) audio?.pause();
      },
      'member-joined': ({ uid, username, avatar }) => {
        applyStateDelta({
          members: [...storeRef.current.members.filter((m) => m.uid !== uid), { uid, username, avatar }],
        });
      },
      'member-left': ({ uid }) => {
        applyStateDelta({
          members: storeRef.current.members.filter((m) => m.uid !== uid),
        });
      },
      'kicked': ({ message }) => {
        alert(message || 'You have been removed from the room.');
        window.location.href = '/';
      },
      'banned-error': ({ message }) => {
        alert(message || 'You are not allowed to join this room.');
        window.location.href = '/';
      },
    },
    !!roomId
  );

  // ── Drift correction heartbeat ───────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !audio) return;

    heartbeatRef.current = setInterval(() => {
      const socket = getSocket();
      const room = storeRef.current;
      if (!socket || !room.isPlaying) return;

      // Calculate expected server position
      const elapsed = (Date.now() - room.updatedAt) / 1000;
      const expectedTime = room.currentTime + elapsed;
      const actualTime = audio.currentTime;
      const drift = Math.abs(actualTime - expectedTime);

      if (drift > DRIFT_RESYNC_SEC) {
        // Large drift — full resync
        audio.currentTime = expectedTime;
      } else if (drift > DRIFT_THRESHOLD_SEC) {
        // Small drift — gentle correction via playback rate
        audio.playbackRate = actualTime < expectedTime ? 1.05 : 0.95;
        setTimeout(() => { audio.playbackRate = 1.0; }, 1000);
      }

      // Report to server
      socket.emit('heartbeat', { roomId, currentTime: audio.currentTime });
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(heartbeatRef.current);
  }, [roomId, audio]);

  // ── Room control emitters ────────────────────────────────────────────────────
  const emitPlay    = useCallback(() => getSocket()?.emit('play',    { roomId, currentTime: audio?.currentTime || 0 }), [roomId, audio]);
  const emitPause   = useCallback(() => getSocket()?.emit('pause',   { roomId, currentTime: audio?.currentTime || 0 }), [roomId, audio]);
  const emitSeek    = useCallback((t) => getSocket()?.emit('seek',   { roomId, currentTime: t }), [roomId]);
  const emitNext    = useCallback(() => getSocket()?.emit('next',    { roomId }), [roomId]);
  const emitPrev    = useCallback(() => getSocket()?.emit('previous',{ roomId }), [roomId]);
  const emitSongChange = useCallback((song) => getSocket()?.emit('song-change', { roomId, song }), [roomId]);
  const emitQueueAdd   = useCallback((song)  => getSocket()?.emit('queue-add',  { roomId, song }), [roomId]);
  const emitQueueRemove= useCallback((index) => getSocket()?.emit('queue-remove',{ roomId, index }), [roomId]);
  const emitReorder    = useCallback((from, to) => getSocket()?.emit('queue-reorder', { roomId, from, to }), [roomId]);
  const emitShuffle    = useCallback((enabled) => getSocket()?.emit('shuffle', { roomId, enabled }), [roomId]);
  const emitRepeat     = useCallback((mode) => getSocket()?.emit('repeat', { roomId, mode }), [roomId]);
  const emitKick       = useCallback((targetUid) => getSocket()?.emit('kick-member', { roomId, targetUid }), [roomId]);
  const emitChatMessage= useCallback((text) => getSocket()?.emit('chat-message', { roomId, text }), [roomId]);

  return {
    emitPlay, emitPause, emitSeek,
    emitNext, emitPrev, emitSongChange,
    emitQueueAdd, emitQueueRemove, emitReorder,
    emitShuffle, emitRepeat, emitKick, emitChatMessage,
  };
};

const applyAudioState = (room) => {
  // Audio element is managed externally via ref; this is a signal to sync
};

export default useRoom;
