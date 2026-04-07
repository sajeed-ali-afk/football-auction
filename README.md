# ⚽ Football Auction Game

A real-time multiplayer football player auction platform built for friend groups. Create private rooms, invite friends, bid on real players with virtual currency, and build your dream squad — all in real time.

**Live:** [football-auction-kappa.vercel.app](https://football-auction-kappa.vercel.app)

---

## What It Is

Football Auction is an IPL-style auction game for football fans. One person hosts a room, shares a code with friends, and everyone competes to sign the best squad within a budget. Bids happen live — every bid resets the timer and every player goes to the highest bidder when time runs out.

---

## Features

**Auction**
- Real-time bidding with a countdown timer that resets on every new bid
- Vote to skip — any player can vote, the current player is skipped only when all players agree
- Host controls: pause, resume, instant skip, and end room
- Quick bid buttons (+0.5M, +1M, +2M, +5M) and a custom bid input
- Live bid history showing every bid placed on the current player
- SOLD and UNSOLD overlay animations when each player is finalized

**Rooms & Lobby**
- Private rooms with a shareable 6-character code
- Waiting lobby showing all players and their ready status
- Host can delete the room, players can leave at any time
- Configurable settings: budget per team, bid timer, squad size, max teams, min bid increment

**Squads**
- Position constraints enforced (GK ×1, DEF ×5, MID ×5, FWD ×3)
- View any team's full squad during the auction — organized by position
- Budget tracker showing remaining funds and spending per team

**After the Auction**
- Leaderboard ranked by squad size and budget spent
- Winner podium with full stats
- Browse every team's signed squad by position
- All Players tab showing every sold player, price paid, and who signed them

**Other**
- In-room live chat during the auction
- Persistent login — stay logged in across sessions
- Fully mobile responsive with a bottom tab navigation on small screens
- Dark neon UI with sound effects for bids, sold, and unsold events

---

## Players

84 real football players seeded across four positions:

| Position | Count | Examples |
|---|---|---|
| 🧤 GK | 10 | Courtois, Alisson, Ederson, Maignan |
| 🛡️ DEF | 22 | Van Dijk, Hakimi, Saliba, Alexander-Arnold |
| ⚡ MID | 24 | Bellingham, De Bruyne, Wirtz, Rodri |
| 🔥 FWD | 28 | Mbappé, Haaland, Salah, Cole Palmer |

Each player has a rating, base price, age, club, nationality, and season stats (goals, assists, appearances or clean sheets/saves for GKs).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Axios, Socket.io client |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB with Mongoose |
| Auth | JWT with bcrypt |
| Real-time | WebSockets via Socket.io |
| Hosting | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

---

## Project Structure

```
football-auction/
├── backend/
│   ├── data/
│   │   └── seed.js              # 84 players seed script
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Player.js            # Player schema
│   │   └── Room.js              # Room, teams, auction state
│   ├── routes/
│   │   ├── auth.js              # Register, login, me
│   │   ├── rooms.js             # Create, join, leave, delete
│   │   ├── players.js           # List and filter players
│   │   └── auction.js           # Results endpoint
│   ├── socket/
│   │   └── socketHandler.js     # All real-time auction logic
│   └── server.js                # Express + Socket.io entry point
│
└── frontend/
    └── src/
        ├── components/
        │   ├── auction/
        │   │   ├── AuctionTimer.js         # Circular countdown ring
        │   │   ├── AuctionStatusOverlay.js # SOLD / UNSOLD overlays
        │   │   ├── BidPanel.js             # Quick bid + custom input
        │   │   ├── BidHistory.js           # Live bid log
        │   │   ├── ChatPanel.js            # In-room chat
        │   │   └── TeamsSidebar.js         # Team budgets + squad counts
        │   └── shared/
        │       ├── Navbar.js
        │       ├── LoadingSpinner.js
        │       └── PlayerCard.js
        ├── context/
        │   ├── AuthContext.js              # Auth state + persistent login
        │   └── SocketContext.js            # Socket.io connection
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js            # Create / join rooms
        │   ├── LobbyPage.js                # Pre-auction waiting room
        │   ├── AuctionPage.js              # Live auction floor
        │   └── ResultsPage.js              # Post-auction results
        └── utils/
            ├── api.js                      # Axios with auth interceptor
            ├── sounds.js                   # Web Audio API sound effects
            └── helpers.js                  # Formatting and color utilities
```

---

## Data Schema

**User**
```
username, email, password (bcrypt hashed),
stats: { auctionsPlayed, auctionsWon, totalSpent }
```

**Player**
```
name, position, club, nationality, basePrice, rating, age,
stats: { goals, assists, cleanSheets, appearances, saves }
```

**Room**
```
name, code, host, hostUsername,
status: lobby | active | paused | completed,
settings: { maxTeams, budgetPerTeam, bidTimer, squadSize, minBidIncrement },
teams: [{ user, username, budget, remainingBudget, isReady, squad: [{ player, pricePaid }] }],
players: [{ player, status, soldTo, finalPrice, bids: [{ user, username, amount }] }],
currentPlayerIndex,
chat: [{ user, username, message, timestamp }]
```

---

## Real-time Events

**Client → Server**

| Event | Description |
|---|---|
| `join_room` | Join an auction room |
| `player_ready` | Toggle ready status in lobby |
| `start_auction` | Host starts the auction |
| `place_bid` | Place a bid on the current player |
| `vote_skip` | Vote to skip the current player |
| `skip_player` | Host instant skip |
| `pause_auction` | Host pause or resume |
| `chat_message` | Send a chat message |
| `leave_room` | Leave the room |
| `delete_room` | Host deletes the room |

**Server → Client**

| Event | Description |
|---|---|
| `room_joined` | Successfully joined, receives full room state |
| `auction_started` | Auction begins with first player |
| `next_player` | New player up for bidding |
| `timer_tick` | Every second countdown update |
| `bid_placed` | A bid was placed, timer resets |
| `bid_rejected` | Bid failed validation |
| `skip_vote_update` | Someone voted to skip, shows current tally |
| `player_sold` | Player sold, teams updated |
| `player_unsold` | No bids, player unsold |
| `auction_paused` | Auction paused by host |
| `auction_resumed` | Auction resumed |
| `auction_completed` | All players done |
| `chat_message` | New chat message |
| `room_deleted` | Host deleted the room |

---

## Squad Rules

| Position | Max allowed |
|---|---|
| GK | 1 |
| DEF | 5 |
| MID | 5 |
| FWD | 3 |

The server enforces these limits — bids are rejected if a team's position quota is already full or their budget is insufficient.