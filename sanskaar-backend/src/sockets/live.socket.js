// src/sockets/live.socket.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name avatar');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

// In-memory state — sirf jab tak server chal raha hai tab tak yaad rehta hai,
// database mein save nahi hota (live-only data hai, jaisa Instagram bhi karta hai).
// Structure: { [streamId]: { hostSocketId, viewers: Map<socketId, {_id, name, avatar}>, heartsCount } }
const rooms = new Map();

const getOrCreateRoom = (streamId) => {
  if (!rooms.has(streamId)) {
    rooms.set(streamId, { hostSocketId: null, viewers: new Map(), heartsCount: 0 });
  }
  return rooms.get(streamId);
};

const initSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    // socket kis stream ke room mein hai, disconnect ke waqt cleanup ke liye yaad rakhna padta hai
    let currentStreamId = null;

    // ---------- JOIN ----------
    // role: 'host' | 'viewer'
    socket.on('join-live', ({ streamId, role }) => {
      currentStreamId = streamId;
      socket.join(streamId); // Socket.io ka built-in room-grouping feature
      const room = getOrCreateRoom(streamId);

      if (role === 'host') {
        room.hostSocketId = socket.id;
      } else {
        room.viewers.set(socket.id, { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar });

        // naye viewer ko host ko batao taaki host uske liye WebRTC connection shuru kare
        if (room.hostSocketId) {
          io.to(room.hostSocketId).emit('viewer-joined', { viewerSocketId: socket.id, user: socket.user });
        }
      }

      // sabko (room ke andar) updated viewer count bhejo
      io.to(streamId).emit('viewer-count', { count: room.viewers.size });
    });

    // ---------- WEBRTC SIGNALING (server sirf relay karta hai) ----------
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
    });

    // ---------- CHAT ----------
    socket.on('live-chat-message', ({ streamId, text }) => {
      if (!text?.trim()) return;
      io.to(streamId).emit('live-chat-message', {
        user: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
        text: text.trim(),
        at: Date.now(),
      });
    });

    // ---------- HEARTS ----------
    socket.on('live-heart', ({ streamId }) => {
      const room = getOrCreateRoom(streamId);
      room.heartsCount += 1;
      io.to(streamId).emit('live-heart', { heartsCount: room.heartsCount });
    });

    // ---------- LEAVE / DISCONNECT ----------
    const handleLeave = () => {
      if (!currentStreamId) return;
      const room = rooms.get(currentStreamId);
      if (!room) return;

      if (room.hostSocketId === socket.id) {
        // host chala gaya — sabko batao live khatam ho gayi
        io.to(currentStreamId).emit('live-host-left');
        rooms.delete(currentStreamId);
      } else if (room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        if (room.hostSocketId) {
          io.to(room.hostSocketId).emit('viewer-left', { viewerSocketId: socket.id });
        }
        io.to(currentStreamId).emit('viewer-count', { count: room.viewers.size });
      }
    };

    socket.on('leave-live', handleLeave);
    socket.on('disconnect', handleLeave);
  });
};

module.exports = { initSocket };