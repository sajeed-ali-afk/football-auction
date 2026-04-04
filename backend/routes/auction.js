const express = require('express');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/auction/:roomId/results - Get auction results
router.get('/:roomId/results', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('players.player')
      .populate('players.soldTo', 'username');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const results = room.teams.map(team => ({
      username: team.username,
      userId: team.user,
      budgetSpent: team.budget - team.remainingBudget,
      remainingBudget: team.remainingBudget,
      squad: team.squad,
      squadSize: team.squad.length,
    }));

    const soldPlayers = room.players.filter(p => p.status === 'sold');
    res.json({ results, soldPlayers, roomName: room.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
