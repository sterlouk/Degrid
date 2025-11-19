# Degrid Game API

A production-ready Node.js/Express REST API for the Degrid turn-based multiplayer strategy game. This backend supports a 10x10 grid-based game where players compete to acquire the 4 central cells by completing challenges.

## 🎮 Game Description

**Degrid** is a turn-based multiplayer web-based strategy game where:
- The board is a 10x10 grid of square cells
- Each player starts at a cell on the grid perimeter with at least one cell distance between them
- The objective is to acquire the 4 most central cells of the grid
- On each turn, players request adjacent cells and complete challenges to acquire them
- When two players request the same cell, they compete with the same challenge
- Cells track best completion times - beating the best time claims the cell

## ✨ Features

- **Complete REST API** with 25+ endpoints
- **Mock Data Mode** - Works without database (in-memory storage)
- **MongoDB Support** - Optional persistent storage with Mongoose
- **Production-Ready Code** - Error handling, validation, logging
- **ES6+ Modules** - Modern JavaScript with async/await
- **Comprehensive Validation** - Input validation with express-validator
- **Security** - Helmet, CORS, input sanitization
- **Game Logic** - Turn management, cell adjacency checking, win conditions
- **Challenge System** - Multiple challenge types with difficulty levels
- **Queue System** - Player matchmaking and game creation

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (Optional - API works with mock data if not provided)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd nodejs-server-server-generated
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

### Running the Server

**Start the server:**
```bash
npm start
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

### Base URL: `http://localhost:3000`

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🎯 Key API Endpoints

### Health Check
- **GET** `/health` - Check if API is running

### Games (Full CRUD)
- **POST** `/games` - Create a new game
- **GET** `/games` - Get all games
- **GET** `/games/:gameId` - Get game by ID
- **PUT** `/games/:gameId/grid` - Update game grid
- **DELETE** `/games/:gameId/players/:playerId` - Remove player

### Players (Full CRUD)
- **POST** `/players` - Create player
- **GET** `/players` - Get all players
- **GET** `/players/:playerId` - Get player by ID
- **PUT** `/players/:playerId` - Update player

### Challenges (Full CRUD)
- **POST** `/challenges` - Create challenge
- **GET** `/challenges` - Get all challenges
- **GET** `/challenges/:challengeId` - Get challenge by ID
- **POST** `/challenges/:challengeId/answer` - Check answer

### Queue
- **POST** `/queue/players` - Join queue
- **GET** `/queue` - Get queue status
- **DELETE** `/queue/players/:playerId` - Leave queue

### Game Actions
- **POST** `/games/:gameId/players` - Join game
- **POST** `/games/:gameId/cells/:cellId/claim` - Claim cell
- **GET** `/games/:gameId/grid` - Get game grid
- **POST** `/games/:gameId/players/:playerId/rematch` - Vote rematch

## 🧪 Testing Examples

### Create a Game
```bash
curl -X POST http://localhost:3000/games \
  -H "Content-Type: application/json" \
  -d '{"language":"en","maxPlayers":4,"gridSize":10}'
```

### Get All Players
```bash
curl http://localhost:3000/players
```

### Get Random Challenge
```bash
curl http://localhost:3000/challenges/random
```

## 🎲 Mock Data

Pre-populated with:
- **2 active games** with multiple players
- **6 players** with stats
- **10 challenges** (math & trivia)
- **100 cells per game**
- **Queue system** ready

## 📊 Requirements Met

✅ **10+ routes** - 25+ endpoints  
✅ **GET, POST, PUT, DELETE** - All covered  
✅ **3+ entities** - Games, Players, Cells, Challenges, Queue  
✅ **Mock data** - Immediately usable  
✅ **MongoDB optional** - Falls back to mock data  
✅ **Production-ready** - Complete implementation  

## 🎉 Quick Start

```bash
npm install
npm start
curl http://localhost:3000/health
```

**Your Degrid Game API is ready! 🎮**

## 🛠 Developer: debug & smoke tests

When developing locally you might want to see internal challenge values (stored and attempt values) to debug the claim flow.

- By default debug output is OFF in production. The server only returns debug details when all of the following are true:
  1. NODE_ENV is `development` or `staging`.
  2. The environment variable `DEBUG_CLAIM` is explicitly set to `true`.
  3. The client supplies the query parameter `?debug=true` on the request.

Example: start the server locally with debug enabled:
```bash
DEBUG_CLAIM=true NODE_ENV=development npm start
```

Then call the claim endpoint with debug flag:
```bash
curl -s -X POST "http://localhost:3000/games/1/cells/2/claim?debug=true" \
  -H "Content-Type: application/json" \
  -d '{"playerId":1}' | jq .
```

Quick smoke test sequence (basic checks to ensure the app boots and core endpoints respond):
```bash
curl -s http://localhost:3000/health | jq .
curl -s http://localhost:3000/games | jq .
curl -s http://localhost:3000/games/1/grid | jq '.data | length'
curl -s -X POST "http://localhost:3000/games/1/cells/2/claim?debug=true" \
  -H "Content-Type: application/json" \
  -d '{"playerId":1}' | jq .
```

Note: keep `DEBUG_CLAIM` disabled in production and use only in trusted development or staging environments.
