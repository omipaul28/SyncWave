const { v4: uuidv4 } = require('uuid');
const rm = require('../socket/roomManager');

const checkRoom = (req, res) => {
  const exists = rm.roomExists(req.params.roomId.toUpperCase());
  res.json({ exists });
};

const createRoom = (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const room = rm.createRoom(roomId, req.user.uid);
  res.status(201).json({ room });
};

const getRoomState = (req, res) => {
  const room = rm.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
};

const closeRoom = (req, res) => {
  const room = rm.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.ownerId !== req.user.uid) return res.status(403).json({ error: 'Only the owner can close this room' });

  rm.deleteRoom(req.params.roomId);
  res.json({ success: true });
};

module.exports = { createRoom, getRoomState, closeRoom, checkRoom };
