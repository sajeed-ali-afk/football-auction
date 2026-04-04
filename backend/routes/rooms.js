const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Player = require('../models/Player');
const auth = require('../middleware/auth');

const router = express.Router();

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// POST /api/rooms - Create room
router.post('/', auth, async (req, res) => {
  try {
    const { name, settings } = req.body;
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateRoomCode();
      const existing = await Room.findOne({ code });
      if (!existing) isUnique = true;
    }

    // Fetch and shuffle players
    const players = await Player.find({ isActive: true });
    const shuffled = players.sort(() => Math.random() - 0.5);
    const auctionPlayers = shuffled.map(p => ({
      player: p._id,
      status: 'pending',
    }));

    const room = new Room({
      name,
      code,
      host: req.user._id,
      hostUsername: req.user.username,
      settings: { ...settings },
      players: auctionPlayers,
      teams: [{
        user: req.user._id,
        username: req.user.username,
        budget: settings?.budgetPerTeam || 100,
        remainingBudget: settings?.budgetPerTeam || 100,
        squad: [],
        isReady: true,
      }],
        isReady: false,
      }],
    });

    await room.save();
    const populated = await Room.findById(room._id)
      .populate('players.player')
      .populate('host', 'username');
    res.status(201).json({ room: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/join - Join room
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'lobby') return res.status(400).json({ error: 'Auction already started' });
    if (room.teams.length >= room.settings.maxTeams) {
      return res.status(400).json({ error: 'Room is full' });
    }
    const alreadyIn = room.teams.find(t => t.user.toString() === req.user._id.toString());
    if (alreadyIn) {
      const populated = await Room.findById(room._id).populate('players.player');
      return res.json({ room: populated });
    }
    room.teams.push({
      user: req.user._id,
      username: req.user.username,
      budget: room.settings.budgetPerTeam,
      remainingBudget: room.settings.budgetPerTeam,
      squad: [],
      isReady: true,
    });
      isReady: false,
    });
    await room.save();
    const populated = await Room.findById(room._id).populate('players.player');
    res.json({ room: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id - Get room
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('players.player')
      .populate('host', 'username');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms - Get user's rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      'teams.user': req.user._id,
    }).sort({ createdAt: -1 }).limit(10);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave room
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    room.teams = room.teams.filter(t => t.username !== req.user.username);
    await room.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Delete room (host only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostUsername !== req.user.username) return res.status(403).json({ error: 'Only host can delete' });
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
