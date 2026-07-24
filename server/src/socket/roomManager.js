/**
 * In-memory Room State Manager for SyncWave Jam Rooms.
 *
 * Structure of a room:
 * {
 *   roomId: string,
 *   ownerId: string,
 *   members: [{ uid, username, avatar, socketId }],
 *   currentSong: object | null,
 *   currentTime: number,       // seconds
 *   isPlaying: boolean,
 *   queue: object[],
 *   history: object[],         // previously played songs
 *   shuffle: boolean,
 *   repeat: 'off' | 'one' | 'all',
 *   updatedBy: string,
 *   updatedAt: number,         // Date.now() timestamp
 * }
 */

const rooms = new Map();

// ── CRUD ──────────────────────────────────────────────────────────────────────

const createRoom = (roomId, ownerId) => {
  const room = {
    roomId,
    ownerId,
    members: [],
    bannedUsers: [],
    currentSong: null,
    currentTime: 0,
    isPlaying: false,
    queue: [],
    history: [],
    messages: [],
    shuffle: false,
    repeat: 'off',
    updatedBy: ownerId,
    updatedAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
};

const getRoom = (roomId) => rooms.get(roomId) || null;

const deleteRoom = (roomId) => rooms.delete(roomId);

const roomExists = (roomId) => rooms.has(roomId);

// ── State updates ─────────────────────────────────────────────────────────────

const updateRoomState = (roomId, patch, updatedBy) => {
  const room = getRoom(roomId);
  if (!room) return null;
  Object.assign(room, patch, { updatedBy, updatedAt: Date.now() });
  return room;
};

// ── Member management ─────────────────────────────────────────────────────────

const addMember = (roomId, member) => {
  const room = getRoom(roomId);
  if (!room) return null;
  // Remove any stale entry for this uid then add fresh
  room.members = room.members.filter((m) => m.uid !== member.uid);
  room.members.push(member);
  return room;
};

const removeMember = (roomId, uid) => {
  const room = getRoom(roomId);
  if (!room) return null;
  room.members = room.members.filter((m) => m.uid !== uid);
  return room;
};

const banMember = (roomId, uid) => {
  const room = getRoom(roomId);
  if (!room) return null;
  if (!room.bannedUsers) room.bannedUsers = [];
  if (!room.bannedUsers.includes(uid)) {
    room.bannedUsers.push(uid);
  }
  room.members = room.members.filter((m) => m.uid !== uid);
  return room;
};

const getMemberBySocketId = (socketId) => {
  for (const room of rooms.values()) {
    const member = room.members.find((m) => m.socketId === socketId);
    if (member) return { room, member };
  }
  return null;
};

// ── Queue helpers ─────────────────────────────────────────────────────────────

const addToQueue = (roomId, song, updatedBy) => {
  const room = getRoom(roomId);
  if (!room) return null;
  room.queue.push(song);
  room.updatedBy = updatedBy;
  room.updatedAt = Date.now();
  return room;
};

const removeFromQueue = (roomId, index, updatedBy) => {
  const room = getRoom(roomId);
  if (!room) return null;
  room.queue.splice(index, 1);
  room.updatedBy = updatedBy;
  room.updatedAt = Date.now();
  return room;
};

const reorderQueue = (roomId, from, to, updatedBy) => {
  const room = getRoom(roomId);
  if (!room) return null;
  const [item] = room.queue.splice(from, 1);
  room.queue.splice(to, 0, item);
  room.updatedBy = updatedBy;
  room.updatedAt = Date.now();
  return room;
};

const advanceQueue = (roomId, updatedBy) => {
  const room = getRoom(roomId);
  if (!room) return null;

  if (room.currentSong) room.history.push(room.currentSong);

  if (room.shuffle && room.queue.length > 0) {
    const idx = Math.floor(Math.random() * room.queue.length);
    room.currentSong = room.queue.splice(idx, 1)[0];
  } else if (room.queue.length > 0) {
    room.currentSong = room.queue.shift();
  } else if (room.repeat === 'all' && room.history.length > 0) {
    // Refill queue from history
    room.queue = [...room.history];
    room.history = [];
    room.currentSong = room.queue.shift();
  } else {
    room.currentSong = null;
    room.isPlaying = false;
  }

  room.currentTime = 0;
  room.updatedBy = updatedBy;
  room.updatedAt = Date.now();
  return room;
};

const goToPrevious = (roomId, updatedBy) => {
  const room = getRoom(roomId);
  if (!room) return null;

  if (room.currentTime > 3) {
    // Restart current song if > 3s in
    room.currentTime = 0;
  } else if (room.history.length > 0) {
    if (room.currentSong) room.queue.unshift(room.currentSong);
    room.currentSong = room.history.pop();
    room.currentTime = 0;
  } else {
    room.currentTime = 0;
  }

  room.updatedBy = updatedBy;
  room.updatedAt = Date.now();
  return room;
};

// ── Chat ──────────────────────────────────────────────────────────────────────

const addMessage = (roomId, message) => {
  const room = getRoom(roomId);
  if (!room) return null;
  
  if (!room.messages) room.messages = [];
  room.messages.push(message);
  
  // Keep only the last 100 messages
  if (room.messages.length > 100) {
    room.messages = room.messages.slice(-100);
  }
  
  return room;
};

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  roomExists,
  updateRoomState,
  addMember,
  removeMember,
  banMember,
  getMemberBySocketId,
  addToQueue,
  removeFromQueue,
  reorderQueue,
  advanceQueue,
  goToPrevious,
  addMessage,
};
