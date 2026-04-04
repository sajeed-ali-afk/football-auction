# ⚽ Football Auction Game

A real-time multiplayer football player auction platform — similar to IPL-style auction games but built for football. Create private rooms, invite friends, bid on real players with virtual currency, and build your dream squad!

---

## 🚀 Features

- **Real-time bidding** via Socket.io with countdown timers
- **"Going once, going twice, SOLD!"** overlay animations
- **Web Audio sound effects** for bids, sold, timers — no external assets needed
- **50 real football players** seeded across GK / DEF / MID / FWD
- **Squad constraints** enforced (position limits, budget cap)
- **Live chat** inside each auction room
- **Post-auction leaderboard, squad viewer & player results**
- **Mobile-first** responsive dark-neon UI
- **Host controls**: pause, resume, skip player
- **Quick bid buttons** (+0.5M, +1M, +2M, +5M) and custom bid input

---

## 🗂 Folder Structure

```
football-auction/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (bcrypt passwords)
│   │   ├── Player.js        # Football player schema
│   │   └── Room.js          # Room, teams, auction state
│   ├── routes/
│   │   ├── auth.js          # POST /register, POST /login, GET /me
│   │   ├── rooms.js         # POST /, POST /join, GET /:id
│   │   ├── players.js       # GET / (with filters), GET /:id
│   │   └── auction.js       # GET /:roomId/results
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── socket/
│   │   └── socketHandler.js # All Socket.io event logic
│   ├── data/
│   │   └── seed.js          # 50 real players seed script
│   ├── server.js            # Express + Socket.io entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── auction/
    │   │   │   ├── AuctionTimer.js        # Circular countdown ring
    │   │   │   ├── AuctionStatusOverlay.js # Going once/twice/SOLD!
    │   │   │   ├── BidPanel.js            # Quick bid + custom bid
    │   │   │   ├── BidHistory.js          # Scrollable bid log
    │   │   │   ├── ChatPanel.js           # In-room chat
    │   │   │   └── TeamsSidebar.js        # Budgets + position breakdown
    │   │   └── shared/
    │   │       ├── Navbar.js
    │   │       ├── LoadingSpinner.js
    │   │       └── PlayerCard.js          # Full + compact modes
    │   ├── context/
    │   │   ├── AuthContext.js             # Login/register/logout state
    │   │   └── SocketContext.js           # Socket.io connection
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js           # Create/join rooms + history
    │   │   ├── LobbyPage.js               # Pre-auction waiting room
    │   │   ├── AuctionPage.js             # Live auction floor
    │   │   └── ResultsPage.js             # Post-auction results
    │   ├── utils/
    │   │   ├── api.js                     # Axios with auth interceptor
    │   │   ├── sounds.js                  # Web Audio API sound effects
    │   │   └── helpers.js                 # Formatting + color utilities
    │   ├── App.js
    │   ├── index.js
    │   └── index.css                      # Tailwind + custom CSS
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Clone & Install

```bash
# Backend
cd football-auction/backend
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/football-auction
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

### 3. Seed the Database

```bash
cd backend
npm run seed
# ✅ Seeded 50 players
```

---

### 4. Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

Open **http://localhost:3000**

---

## 🔌 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/rooms` | Create auction room |
| POST | `/api/rooms/join` | Join by room code |
| GET | `/api/rooms/:id` | Get room details |
| GET | `/api/rooms` | Get my rooms |

### Players
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/players` | List players (filter: `?position=FWD&search=Mbappe`) |
| GET | `/api/players/:id` | Get single player |

### Auction
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auction/:roomId/results` | Post-auction results |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId }` | Join auction room |
| `player_ready` | `{ roomId }` | Toggle ready status |
| `start_auction` | `{ roomId }` | Host starts auction |
| `place_bid` | `{ roomId, amount }` | Place a bid |
| `skip_player` | `{ roomId }` | Host skips current player |
| `pause_auction` | `{ roomId }` | Host pauses/resumes |
| `chat_message` | `{ roomId, message }` | Send chat message |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room_joined` | `{ room, auctionState }` | Joined successfully |
| `auction_started` | `{ player, basePrice, timeLeft, ... }` | Auction begins |
| `next_player` | `{ player, basePrice, timeLeft, ... }` | Next player up |
| `timer_tick` | `{ timeLeft }` | Every second countdown |
| `bid_placed` | `{ amount, bidder, timeLeft }` | New bid placed |
| `bid_rejected` | `{ message }` | Bid validation failed |
| `going_once` | `{}` | Timer at 5s |
| `going_twice` | `{}` | Timer at 3s |
| `player_sold` | `{ player, soldTo, price, teams }` | Player sold |
| `player_unsold` | `{ player }` | No bids, player unsold |
| `auction_paused` | `{}` | Auction paused |
| `auction_resumed` | `{ timeLeft }` | Auction resumed |
| `auction_completed` | `{ teams }` | All players done |
| `chat_message` | `{ username, message, timestamp }` | New chat message |

---

## 🗄 Database Schema

### User
```js
{ username, email, password (hashed), avatar, stats: { auctionsPlayed, auctionsWon, totalSpent } }
```

### Player
```js
{ name, position (GK/DEF/MID/FWD), club, nationality, basePrice, rating, age,
  stats: { goals, assists, cleanSheets, appearances, saves } }
```

### Room
```js
{
  name, code, host, hostUsername, status (lobby/active/paused/completed),
  settings: { maxTeams, budgetPerTeam, bidTimer, squadSize, minBidIncrement },
  teams: [{ user, username, budget, remainingBudget, squad: [{ player, pricePaid }], isReady }],
  players: [{ player, status, soldTo, soldToUsername, finalPrice, bids: [{ user, username, amount }] }],
  currentPlayerIndex, chat: [{ user, username, message, timestamp }]
}
```

---

## 🎨 Squad Rules

| Position | Min | Max |
|----------|-----|-----|
| GK | 1 | 1 |
| DEF | 3 | 5 |
| MID | 3 | 5 |
| FWD | 1 | 3 |
| **Total** | **11** | **15** |

---

## 🚀 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve with Express (add to backend/server.js)
# app.use(express.static(path.join(__dirname, '../frontend/build')));

# Use environment variables for:
# - MONGODB_URI (MongoDB Atlas)
# - JWT_SECRET (long random string)
# - CLIENT_URL (your frontend domain)
# - NODE_ENV=production
```

Recommended: **Railway / Render** for backend, **Vercel** for frontend, **MongoDB Atlas** for DB.

---

## 📱 Mobile Support

The app is fully responsive with:
- Mobile-first layout on AuctionPage
- Slide-up squad drawer on mobile
- Touch-friendly bid buttons
- Condensed navbar on small screens
