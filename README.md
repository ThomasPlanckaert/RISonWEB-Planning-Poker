# Planning Poker (Firebase)

Real-time Planning Poker built with React, TypeScript, TailwindCSS, Framer Motion, and **Firebase** (Hosting, Anonymous Auth, Firestore, Cloud Functions). No custom Express or Socket.IO backend.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite → **Firebase Hosting** |
| Auth | **Anonymous Authentication** |
| Data | **Cloud Firestore** (real-time listeners) |
| Privileged actions | **Cloud Functions** (Firebase Admin SDK server-side only) |
| Security | **Firestore Security Rules** + callable function auth |

Moderator-only operations (reveal, reset, settings, remove participant, transfer moderator) run through **HTTPS Callable Functions**. The Admin SDK is used **only inside Functions** — never in the React app.

Consensus is evaluated **server-side** when votes are revealed and stored on the session document (`consensusReached`, `consensusRound`, `consensusVote`).

## Prerequisites

- Node.js 20+
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A Firebase project with Blaze plan (required for Cloud Functions; Hosting + Firestore work on Spark)

## Firebase setup

### 1. Create project

1. [Firebase Console](https://console.firebase.google.com/) → Create project.
2. **Authentication** → Sign-in method → Enable **Anonymous**.
3. **Firestore** → Create database (production mode).
4. **Project settings** → Your apps → Add **Web** app → copy config values.

### 2. Local environment

```bash
cp client/.env.example client/.env
```

Fill in all `VITE_FIREBASE_*` values from the web app config.

### 3. Link Firebase CLI

```bash
firebase login
firebase use --add   # select your project ID
```

### 4. Install dependencies

```bash
npm install
```

### 5. Deploy rules and functions

```bash
npm run deploy:rules
npm run deploy:functions
```

### 6. Deploy hosting (after first client build)

```bash
npm run deploy:hosting
```

Or deploy everything:

```bash
npm run deploy
```

## Service account security

**Never** place Firebase Admin SDK JSON keys in the React app or commit them to git.

| Environment | Admin SDK |
|-------------|-----------|
| Cloud Functions (production) | Uses the project’s default service account automatically |
| Local Functions emulator | Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS` pointing to a key file **outside the repo** |
| CI/CD | Store JSON in a secret (e.g. `FIREBASE_SERVICE_ACCOUNT`) — not in source control |

`.gitignore` blocks common service account filename patterns.

## Cloud Functions (moderator API)

| Callable | Description |
|----------|-------------|
| `revealVotes` | Reveal cards + run consensus detection |
| `resetVotes` | Clear votes; optional new round |
| `updateSessionSettings` | Title, story, and/or card deck |
| `removeParticipant` | Remove participant and their vote |
| `transferModerator` | Transfer moderator role to another participant |

All callables require an authenticated user and verify `moderatorUid` server-side.

## Firestore structure

```text
sessions/{roomCode}
  title, roomCode, moderatorUid, currentStory, cardSet,
  revealed, round, consensusReached, consensusRound, consensusVote, createdAt

sessions/{roomCode}/participants/{uid}
  uid, username, isModerator, joinedAt, lastSeen

sessions/{roomCode}/votes/{uid}
  participantId, value
```

## Client-direct writes (rules-enforced)

- Create session (creator = moderator)
- Join / update own participant (`username`, `lastSeen` only)
- Cast / update own vote (while not revealed)
- Leave session (non-moderators)

## Local development

```bash
# Terminal 1 — Firestore + Auth + Functions emulators
firebase emulators:start

# Terminal 2 — Vite dev server
# Set VITE_USE_FIREBASE_EMULATORS=true in client/.env
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Outputs:

- `client/dist/` — static hosting bundle
- `functions/lib/` — compiled Cloud Functions

## Deployment options

### Firebase (recommended)

```bash
npm run deploy
```

Deploys Hosting, Functions, and Firestore rules.

### GitHub Actions

1. Create a Firebase service account with roles: **Firebase Admin**, **Cloud Functions Developer**, **Firebase Hosting Admin**.
2. Add repository secret `FIREBASE_SERVICE_ACCOUNT` (full JSON).
3. Add `VITE_FIREBASE_*` secrets for the build step.
4. Example deploy step:

```yaml
- run: npm ci && npm run build
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
- run: firebase deploy --only hosting,functions,firestore:rules
```

### Netlify / Vercel (hosting only)

- Build: `npm run build -w @planning-poker/client`
- Publish: `client/dist`
- Set all `VITE_FIREBASE_*` env vars
- Functions and rules must still be deployed via Firebase CLI

## Environment variables

See `client/.env.example` for the full list.

## Project structure

```text
client/src/
  firebase/         App init, auth, Firestore, callable functions
  services/         sessionService (client + callable wrappers)
  hooks/            useSession, useParticipants, useVotes
  features/         UI, consensus utils (display only)
functions/src/
  index.ts          Callable exports
  moderator.ts      Secured moderator handlers (Admin SDK)
  consensus.ts      Server-side consensus logic
firestore.rules     Production security rules
firebase.json       Hosting, Functions, emulator config
```

## Indexes

No composite indexes are required for default queries. `firestore.indexes.json` is included as an empty placeholder.
