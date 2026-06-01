# Planning Poker (Real-Time Multiplayer)

A modern Planning Poker application with a React + TypeScript client and a Node.js + Socket.IO server. Multiple participants can join the same room, vote in real time, reveal estimates together, and celebrate consensus.

## Monorepo structure

```text
/client   — React + Vite frontend (existing UI preserved)
/server   — Express + Socket.IO backend
/shared   — Shared TypeScript types and socket event contracts
```

## Features

- Real-time sessions via Socket.IO rooms
- Short shareable room codes (e.g. `AB12CD`, `TEAM42`)
- Join existing room or create new room (creator is moderator)
- Hidden votes until moderator reveals
- Server-side consensus detection with confetti celebration
- Moderator controls synchronized for all clients
- Automatic reconnection with `localStorage` identity restore
- Dark mode, Framer Motion animations, Tailwind styling (unchanged UX)

## Prerequisites

- Node.js 20+
- npm 10+

## Local development

1. Install dependencies from the repository root:

```bash
npm install
```

2. Copy environment examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start both server and client:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001
- Vite proxies `/socket.io` to the server in development

4. Open two browser windows (or machines), enter the same room code, and vote together.

### Run packages individually

```bash
npm run dev -w @planning-poker/server
npm run dev -w @planning-poker/client
```

## Environment variables

### Server (`server/.env`)

| Variable        | Default                  | Description                          |
|----------------|--------------------------|--------------------------------------|
| `PORT`         | `3001`                   | HTTP + Socket.IO port                |
| `CLIENT_ORIGIN`| `http://localhost:5173`  | Allowed CORS origins (comma-separated)|
| `NODE_ENV`     | `development`            | Set to `production` for static hosting |

### Client (`client/.env`)

| Variable           | Default | Description                                      |
|--------------------|---------|--------------------------------------------------|
| `VITE_SOCKET_URL`  | _(empty)_ | Socket server URL; leave empty to use Vite proxy |

In production, set `VITE_SOCKET_URL` to your public API origin (e.g. `https://api.example.com`).

## Production deployment

### 1. Build

```bash
npm install
npm run build
```

This builds the client into `client/dist` and compiles the server to `server/dist`.

### 2. Configure

```bash
# server/.env
PORT=3001
CLIENT_ORIGIN=https://your-frontend.example.com
NODE_ENV=production

# client/.env (at build time)
VITE_SOCKET_URL=https://your-api.example.com
```

Rebuild the client after setting `VITE_SOCKET_URL`.

### 3. Start

```bash
npm run start
```

With `NODE_ENV=production`, the server serves the built client from `client/dist` and handles Socket.IO on the same port.

### Deployment options

- **Single host**: Run the server process behind a reverse proxy (nginx, Caddy) with WebSocket support for `/socket.io`.
- **Split hosts**: Deploy `client/dist` to static hosting (S3, Netlify, etc.) and the server separately; set `VITE_SOCKET_URL` and `CLIENT_ORIGIN` accordingly.

> **Note**: Room state is stored in memory. Restarting the server clears active rooms. Use Redis or a database adapter for horizontal scaling if needed.

## Socket events

Shared typed contracts live in `shared/types/events.ts`.

**Client → Server**: `create_room`, `join_room`, `leave_room`, `cast_vote`, `reveal_votes`, `reset_votes`, `change_card_set`, `update_story`, `kick_participant`

**Server → Client**: `room_created`, `room_joined`, `participant_joined`, `participant_left`, `vote_cast`, `votes_revealed`, `votes_reset`, `card_set_changed`, `story_updated`, `room_state_updated`, `consensus_reached`, `error`

## Reconnection

`localStorage` stores only:

- `planning-poker:username`
- `planning-poker:roomCode`
- `planning-poker:participantId`

On reconnect, the client re-emits `join_room` with the stored participant id. The server is the source of truth for all session state.
