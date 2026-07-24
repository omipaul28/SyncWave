const { Server } = require('socket.io');
const { auth, rtdb } = require('../config/firebase');
const rm = require('./roomManager');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── Authentication handshake ─────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = await auth.verifyIdToken(token);
      socket.user = {
        uid: decoded.uid,
        username: decoded.name || decoded.email,
        avatar: decoded.picture || null,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { uid, username, avatar } = socket.user;
    console.log(`🔌 Socket connected: ${username} (${uid})`);

    // ── join-room ──────────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomId: rawId }) => {
      const roomId = (rawId || '').toUpperCase();
      let room = rm.getRoom(roomId);

      if (!room) {
        room = rm.createRoom(roomId, uid);
      } else if (room.bannedUsers?.includes(uid)) {
        return socket.emit('banned-error', { message: 'You have been banned from this room.' });
      }

      socket.join(roomId);
      socket.currentRoomId = roomId;

      room = rm.addMember(roomId, { uid, username, avatar, socketId: socket.id });

      // Send current state to the joining user
      socket.emit('sync-state', room);

      // Notify everyone else
      socket.to(roomId).emit('member-joined', { uid, username, avatar });
    });

    // ── leave-room ─────────────────────────────────────────────────────────────
    socket.on('leave-room', ({ roomId }) => {
      handleLeaveRoom(socket, roomId);
    });

    // ── kick-member (Ban) ──────────────────────────────────────────────────────
    socket.on('kick-member', ({ roomId, targetUid }) => {
      const room = rm.getRoom(roomId);
      if (!room) return;
      // Only owner can kick
      if (room.ownerId !== uid) return;
      if (targetUid === uid) return; // Cannot kick self

      const targetMember = room.members.find((m) => m.uid === targetUid);
      if (!targetMember) return;

      // Notify the target that they are kicked
      io.to(targetMember.socketId).emit('kicked', { message: 'You have been removed from the room by the host.' });
      
      // Force them to leave the socket room
      const targetSocket = io.sockets.sockets.get(targetMember.socketId);
      if (targetSocket) {
        targetSocket.leave(roomId);
        targetSocket.currentRoomId = null;
      }

      // Ban and remove from state
      rm.banMember(roomId, targetUid);
      
      // Notify remaining members
      io.to(roomId).emit('member-left', { uid: targetUid });
    });

    // ── play ───────────────────────────────────────────────────────────────────
    socket.on('play', ({ roomId, currentTime }) => {
      const room = rm.updateRoomState(roomId, { isPlaying: true, currentTime }, uid);
      if (room) io.to(roomId).emit('state-update', { isPlaying: true, currentTime, updatedBy: uid });
    });

    // ── pause ──────────────────────────────────────────────────────────────────
    socket.on('pause', ({ roomId, currentTime }) => {
      const room = rm.updateRoomState(roomId, { isPlaying: false, currentTime }, uid);
      if (room) io.to(roomId).emit('state-update', { isPlaying: false, currentTime, updatedBy: uid });
    });

    // ── seek ───────────────────────────────────────────────────────────────────
    socket.on('seek', ({ roomId, currentTime }) => {
      const room = rm.updateRoomState(roomId, { currentTime }, uid);
      if (room) io.to(roomId).emit('state-update', { currentTime, updatedBy: uid });
    });

    // ── next ───────────────────────────────────────────────────────────────────
    socket.on('next', ({ roomId }) => {
      const room = rm.advanceQueue(roomId, uid);
      if (room) io.to(roomId).emit('sync-state', room);
    });

    // ── previous ───────────────────────────────────────────────────────────────
    socket.on('previous', ({ roomId }) => {
      const room = rm.goToPrevious(roomId, uid);
      if (room) io.to(roomId).emit('sync-state', room);
    });

    // ── song-change ────────────────────────────────────────────────────────────
    socket.on('song-change', ({ roomId, song, currentTime = 0 }) => {
      const room = rm.updateRoomState(
        roomId,
        { currentSong: song, currentTime, isPlaying: true },
        uid
      );
      if (room) io.to(roomId).emit('sync-state', room);
    });

    // ── queue-add ──────────────────────────────────────────────────────────────
    socket.on('queue-add', ({ roomId, song }) => {
      const room = rm.addToQueue(roomId, song, uid);
      if (room) io.to(roomId).emit('state-update', { queue: room.queue, updatedBy: uid });
    });

    // ── queue-remove ───────────────────────────────────────────────────────────
    socket.on('queue-remove', ({ roomId, index }) => {
      const room = rm.removeFromQueue(roomId, index, uid);
      if (room) io.to(roomId).emit('state-update', { queue: room.queue, updatedBy: uid });
    });

    // ── queue-reorder ──────────────────────────────────────────────────────────
    socket.on('queue-reorder', ({ roomId, from, to }) => {
      const room = rm.reorderQueue(roomId, from, to, uid);
      if (room) io.to(roomId).emit('state-update', { queue: room.queue, updatedBy: uid });
    });

    // ── shuffle ────────────────────────────────────────────────────────────────
    socket.on('shuffle', ({ roomId, enabled }) => {
      const room = rm.updateRoomState(roomId, { shuffle: enabled }, uid);
      if (room) io.to(roomId).emit('state-update', { shuffle: enabled, updatedBy: uid });
    });

    // ── repeat ─────────────────────────────────────────────────────────────────
    socket.on('repeat', ({ roomId, mode }) => {
      const room = rm.updateRoomState(roomId, { repeat: mode }, uid);
      if (room) io.to(roomId).emit('state-update', { repeat: mode, updatedBy: uid });
    });

    // ── chat-message ───────────────────────────────────────────────────────────
    socket.on('chat-message', async ({ roomId, text }) => {
      const room = rm.getRoom(roomId);
      if (!room) return;
      
      const message = {
        uid,
        username,
        avatar,
        text,
        timestamp: Date.now()
      };
      
      try {
        const chatRef = rtdb.ref(`rooms/${roomId}/chat`);
        await chatRef.push(message);
      } catch (err) {
        console.error('Error writing chat message to RTDB:', err);
      }
    });

    // ── heartbeat (drift correction) ───────────────────────────────────────────
    socket.on('heartbeat', ({ roomId, currentTime }) => {
      // Update server time silently — no broadcast needed
      const room = rm.getRoom(roomId);
      if (room && room.isPlaying) {
        room.currentTime = currentTime;
        room.updatedAt = Date.now();
      }
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.currentRoomId;
      if (roomId) handleLeaveRoom(socket, roomId);
      console.log(`🔌 Socket disconnected: ${username}`);
    });
  });

  return io;
};

const handleLeaveRoom = (socket, roomId) => {
  const { uid } = socket.user;
  socket.leave(roomId);
  socket.currentRoomId = null;

  const room = rm.removeMember(roomId, uid);
  if (!room) return;

  // If room is empty, clean it up
  if (room.members.length === 0) {
    rm.deleteRoom(roomId);
    rtdb.ref(`rooms/${roomId}`).remove().catch((e) => console.error('Failed to clean up RTDB room:', e));
    return;
  }

  // If owner left, transfer ownership to first remaining member
  if (room.ownerId === uid && room.members.length > 0) {
    room.ownerId = room.members[0].uid;
  }

  io.to(roomId).emit('member-left', { uid });
};

const getIO = () => io;

module.exports = { initSocket, getIO };
