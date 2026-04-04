const express = require('express');
const Player = require('../models/Player');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/players - List with filters
router.get('/', auth, async (req, res) => {
  try {
    const { position, search, sort = 'rating', order = 'desc' } = req.query;
    const filter = { isActive: true };
    if (position) filter.position = position;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const players = await Player.find(filter).sort(sortObj);
    res.json({ players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
