const mongoose = require('mongoose');

const squadPlayerSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  pricePaid: { type: Number, required: true },
}, { _id: false });

const teamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  budget: { type: Number, required: true },
  remainingBudget: { type: Number, required: true },
  squad: [squadPlayerSchema],
  isReady: { type: Boolean, default: false },
}, { _id: false });

const bidSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  amount: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const auctionPlayerSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  status: {
    type: String,
    enum: ['pending', 'active', 'sold', 'unsold'],
    default: 'pending',
  },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  soldToUsername: { type: String, default: null },
  finalPrice: { type: Number, default: 0 },
  bids: [bidSchema],
}, { _id: false });

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostUsername: { type: String, required: true },
  status: {
    type: String,
    enum: ['lobby', 'active', 'paused', 'completed'],
    default: 'lobby',
  },
  settings: {
    maxTeams: { type: Number, default: 8, min: 2, max: 12 },
    budgetPerTeam: { type: Number, default: 100 }, // millions
    squadSize: { type: Number, default: 15 },
    bidTimer: { type: Number, default: 15 }, // seconds
    minBidIncrement: { type: Number, default: 0.5 }, // millions
    autoSkipUnsold: { type: Boolean, default: true },
  },
  teams: [teamSchema],
  players: [auctionPlayerSchema],
  currentPlayerIndex: { type: Number, default: 0 },
  chat: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('Room', roomSchema);
