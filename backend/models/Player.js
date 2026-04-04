const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: {
    type: String,
    enum: ['GK', 'DEF', 'MID', 'FWD'],
    required: true,
  },
  club: { type: String, required: true },
  nationality: { type: String, required: true },
  basePrice: { type: Number, required: true }, // in millions
  rating: { type: Number, min: 1, max: 99 },
  age: { type: Number },
  stats: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },
    appearances: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Player', playerSchema);
