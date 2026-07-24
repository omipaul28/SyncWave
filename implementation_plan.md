# SyncWave – Real-Time Collaborative Music Streaming Platform

SyncWave is a full-stack web application combining Spotify-like music streaming with a real-time collaborative "Jam Room" system where every participant has equal control over playback. The platform uses a free infrastructure stack (Firebase, Cloudinary, Render, Vercel).

---

## User Review Required

> [!IMPORTANT]
> **Key Design Decisions Requiring Confirmation**
> 
> 1. **Tailwind CSS version**: The planning doc specifies Tailwind CSS. Please confirm which version you want to use (v3 or v4).
> 2. **Room state persistence**: Jam Room state is stored in-memory on the server for low latency. Do you also want it mirrored in Firestore for persistence across server restarts?
> 3. **Lyrics source**: The plan recommends LRCLIB. Should we also fall back to Genius API (requires an API key) or just show "Lyrics unavailable"?
> 4. **Audio quality**: The planning doc mentions 128/192/320 kbps as a future enhancement. For now, should all audio be uploaded as-is, or should we target a specific bitrate?

> [!WARNING]
> **Monorepo Structure**: This plan proposes a monorepo with `/client` and `/server` directories inside `d:\Dev\Music`. This keeps everything in one repository for simplicity. Raise any concerns before proceeding.

---

## Open Questions

> [!IMPORTANT]
> **Firebase & Cloudinary Setup**: Do you already have Firebase and Cloudinary accounts configured, or should the plan include setup instructions and `.env.example` files?

> [!CAUTION]
> **Admin Role Assignment**: Admin role cannot be self-assigned. The plan proposes a Firestore field `role: "admin" | "user"` set manually or via a seed script. Confirm the preferred approach.

---

## Proposed Changes

### Phase 1 – Project Scaffolding & Configuration

#### [NEW] Monorepo Root
```
d:\Dev\Music\
├── client/          (React + Vite + Tailwind)
├── server/          (Node.js + Express + Socket.IO)
├── .gitignore
└── README.md
```

---

### Phase 2 – Backend (Server)

#### Directory Structure
```
server/
├── src/
│   ├── config/
│   │   ├── firebase.js          # Firebase Admin SDK init
│   │   └── cloudinary.js        # Cloudinary SDK init
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification via Firebase Auth
│   │   └── adminMiddleware.js    # Role-based guard
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── songRoutes.js         # /api/songs/*
│   │   ├── playlistRoutes.js     # /api/playlists/*
│   │   ├── userRoutes.js         # /api/users/*
│   │   ├── adminRoutes.js        # /api/admin/*
│   │   └── lyricsRoutes.js       # /api/lyrics/:songId
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── songController.js
│   │   ├── playlistController.js
│   │   ├── userController.js
│   │   ├── adminController.js
│   │   └── lyricsController.js
│   ├── services/
│   │   ├── firestoreService.js   # Abstraction over Firestore CRUD
│   │   ├── cloudinaryService.js  # Upload helpers
│   │   └── lyricsService.js      # LRCLIB fetch + Firestore cache
│   ├── socket/
│   │   ├── roomManager.js        # In-memory room state store
│   │   └── socketHandlers.js     # All Socket.IO event handlers
│   ├── utils/
│   │   └── validators.js
│   ├── app.js                    # Express app setup
│   └── index.js                  # Server entry point
├── .env.example
└── package.json
```

#### [NEW] REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/verify` | Verify Firebase token, return user profile |
| GET | `/api/songs` | List/search songs (with query params) |
| GET | `/api/songs/:id` | Get single song |
| GET | `/api/songs/trending` | Get trending songs |
| POST | `/api/admin/songs` | Upload song (admin only) |
| PUT | `/api/admin/songs/:id` | Edit song metadata (admin only) |
| DELETE | `/api/admin/songs/:id` | Delete song (admin only) |
| GET | `/api/playlists/:id` | Get playlist |
| POST | `/api/playlists` | Create playlist |
| PUT | `/api/playlists/:id` | Update playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |
| PATCH | `/api/playlists/:id/songs` | Add/remove songs |
| GET | `/api/users/me` | Get own profile |
| PUT | `/api/users/me` | Update profile |
| PATCH | `/api/users/me/likes` | Like/unlike a song |
| GET | `/api/lyrics/:songId` | Get lyrics (cached) |
| POST | `/api/rooms` | Create a jam room |
| GET | `/api/rooms/:roomId` | Get room state |
| DELETE | `/api/rooms/:roomId` | Close room (owner only) |

#### [NEW] Socket.IO Events

**Client → Server:**
| Event | Payload | Action |
|-------|---------|--------|
| `join-room` | `{ roomId, userId }` | Join room, receive `sync-state` |
| `leave-room` | `{ roomId }` | Leave room |
| `play` | `{ roomId, currentTime }` | Resume playback |
| `pause` | `{ roomId, currentTime }` | Pause playback |
| `seek` | `{ roomId, currentTime }` | Seek to position |
| `next` | `{ roomId }` | Advance queue |
| `previous` | `{ roomId }` | Go back in queue |
| `song-change` | `{ roomId, songId, currentTime }` | Force song change |
| `queue-add` | `{ roomId, song }` | Add song to queue |
| `queue-remove` | `{ roomId, index }` | Remove song from queue |
| `queue-reorder` | `{ roomId, from, to }` | Reorder queue |
| `shuffle` | `{ roomId, enabled }` | Toggle shuffle |
| `repeat` | `{ roomId, mode }` | Set repeat mode |
| `heartbeat` | `{ roomId, currentTime }` | Drift correction data |

**Server → Client:**
| Event | Payload |
|-------|---------|
| `sync-state` | Full room state |
| `state-update` | Partial room state delta |
| `member-joined` | `{ user }` |
| `member-left` | `{ userId }` |
| `error` | `{ message }` |

#### [NEW] Room State (In-Memory)
```js
{
  roomId: string,
  ownerId: string,
  members: [{ uid, username, avatar }],
  currentSong: Song | null,
  currentTime: number,       // seconds
  isPlaying: boolean,
  queue: Song[],
  shuffle: boolean,
  repeat: "off" | "one" | "all",
  updatedBy: string,
  updatedAt: number          // timestamp ms
}
```

---

### Phase 3 – Frontend (Client)

#### Directory Structure
```
client/
├── src/
│   ├── api/
│   │   ├── axiosInstance.js      # Axios with auth interceptors
│   │   ├── songsApi.js
│   │   ├── playlistsApi.js
│   │   ├── usersApi.js
│   │   ├── adminApi.js
│   │   └── lyricsApi.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── player/
│   │   │   ├── MiniPlayer.jsx
│   │   │   ├── FullPlayer.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── VolumeControl.jsx
│   │   │   ├── QueuePanel.jsx
│   │   │   └── LyricsPanel.jsx
│   │   ├── room/
│   │   │   ├── RoomView.jsx
│   │   │   ├── MembersList.jsx
│   │   │   └── RoomControls.jsx
│   │   ├── songs/
│   │   │   ├── SongCard.jsx
│   │   │   ├── SongList.jsx
│   │   │   └── SongContextMenu.jsx
│   │   ├── playlist/
│   │   │   ├── PlaylistCard.jsx
│   │   │   └── PlaylistDetail.jsx
│   │   ├── admin/
│   │   │   ├── UploadForm.jsx
│   │   │   ├── SongTable.jsx
│   │   │   └── UserTable.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Avatar.jsx
│   │       └── Spinner.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Search.jsx
│   │   ├── Library.jsx
│   │   ├── PlaylistPage.jsx
│   │   ├── ArtistPage.jsx
│   │   ├── AlbumPage.jsx
│   │   ├── RoomPage.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Profile.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── UploadSong.jsx
│   │       ├── ManageSongs.jsx
│   │       ├── ManageUsers.jsx
│   │       └── Analytics.jsx
│   ├── store/
│   │   ├── authStore.js          # Zustand: user, token, role
│   │   ├── playerStore.js        # Zustand: local playback state
│   │   └── roomStore.js          # Zustand: collaborative room state
│   ├── hooks/
│   │   ├── useAudio.js           # HTML5 Audio API wrapper
│   │   ├── useSocket.js          # Socket.IO connection hook
│   │   ├── useRoom.js            # Room join/leave/sync logic
│   │   ├── useLyrics.js          # Lyrics fetch + scroll sync
│   │   └── useKeyboardShortcuts.js
│   ├── lib/
│   │   ├── firebase.js           # Firebase client init
│   │   └── socket.js             # Socket.IO client instance
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

#### [NEW] Pages & Routing

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Home (featured/trending) | Yes |
| `/search` | Search | Yes |
| `/library` | User Library | Yes |
| `/playlist/:id` | Playlist Detail | Yes |
| `/artist/:id` | Artist Page | Yes |
| `/album/:id` | Album Page | Yes |
| `/room/:roomId` | Jam Room | Yes |
| `/login` | Login | No |
| `/register` | Register | No |
| `/profile` | User Profile | Yes |
| `/admin` | Admin Dashboard | Admin only |
| `/admin/upload` | Upload Song | Admin only |
| `/admin/songs` | Manage Songs | Admin only |
| `/admin/users` | Manage Users | Admin only |

---

### Phase 4 – Firestore Database

#### Collections & Schema

**`users/{uid}`**
```json
{
  "uid": "string",
  "username": "string",
  "email": "string",
  "avatar": "string (URL)",
  "role": "user | admin",
  "likedSongs": ["songId"],
  "recentlyPlayed": [{ "songId": "string", "playedAt": "timestamp" }],
  "playlists": ["playlistId"],
  "createdAt": "timestamp"
}
```

**`songs/{songId}`**
```json
{
  "id": "string",
  "title": "string",
  "artist": "string",
  "artistId": "string",
  "album": "string",
  "albumId": "string",
  "duration": "number (seconds)",
  "genre": "string",
  "coverUrl": "string",
  "audioUrl": "string",
  "lyrics": "string | null",
  "lyricsSource": "lrclib | manual | null",
  "playCount": "number",
  "uploadedAt": "timestamp",
  "keywords": ["string"]
}
```

**`playlists/{playlistId}`**
```json
{
  "id": "string",
  "ownerId": "string",
  "title": "string",
  "cover": "string (URL)",
  "songs": ["songId"],
  "visibility": "public | private",
  "createdAt": "timestamp"
}
```

**`artists/{artistId}`**
```json
{
  "id": "string",
  "name": "string",
  "bio": "string",
  "coverUrl": "string",
  "songIds": ["string"]
}
```

**`albums/{albumId}`**
```json
{
  "id": "string",
  "title": "string",
  "artistId": "string",
  "coverUrl": "string",
  "releaseYear": "number",
  "songIds": ["string"]
}
```

> [!NOTE]
> Jam Rooms are stored in-memory on the server for low latency. Firestore is only used for analytics/history if needed.

---

### Phase 5 – Key Feature Implementation Details

#### Music Player (useAudio.js hook)
- Wraps `HTMLAudioElement` in a React hook
- Exposes: `play`, `pause`, `seek`, `setVolume`, `setPlaybackRate`
- Fires events: `onTimeUpdate`, `onEnded`, `onBuffering`
- Preloads next song when 30s remain in current track
- In solo mode: directly drives `playerStore`
- In room mode: delegates all control through Socket.IO

#### Drift Correction Algorithm
Every 5 seconds while in a room:
1. Client reads `audio.currentTime`
2. Compares to `roomState.currentTime + (Date.now() - roomState.updatedAt) / 1000`
3. If drift > 0.5s → seek to corrected time
4. If drift > 3s → re-sync completely from server

#### Synchronized Lyrics (useLyrics.js hook)
1. On song load: fetch `/api/lyrics/:songId`
2. Backend checks Firestore cache first, then LRCLIB API
3. Parse `.lrc` format into timestamped array
4. Use `requestAnimationFrame` to highlight current line
5. Auto-scroll lyrics panel to active line

#### Admin Upload Flow
1. Admin selects MP3 + cover image
2. Frontend sends multipart form to `/api/admin/songs`
3. Backend validates: file type (audio/mpeg, image/*), size limits (MP3 ≤ 50MB, image ≤ 5MB)
4. Cloudinary upload streams (not buffered in memory)
5. Returns `audioUrl` + `coverUrl`
6. Metadata saved to Firestore

---

### Phase 6 – Security Implementation

- **Firebase Auth tokens** verified on every protected API request
- **Socket authentication**: token sent in `auth` handshake, verified on `connection`
- **Admin middleware**: reads `role` from Firestore `users/{uid}`
- **Firestore rules**: users can only read/write their own documents
- **Input validation**: all API inputs validated with `express-validator`
- **File validation**: MIME type + extension checked server-side
- **Rate limiting**: `express-rate-limit` on auth and upload endpoints
- **CORS**: restricted to frontend origin in production

---

### Phase 7 – Environment Configuration

#### `server/.env.example`
```env
PORT=5000
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

#### `client/.env.example`
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Build Phases & Order

| Phase | Work |
|-------|------|
| **1** | Scaffolding: monorepo setup, Vite + Tailwind, Express server |
| **2** | Firebase Auth integration (login, register, JWT middleware) |
| **3** | Firestore CRUD: songs, playlists, users, artists, albums |
| **4** | Cloudinary upload pipeline + Admin panel |
| **5** | Music player: solo streaming, queue, shuffle, repeat |
| **6** | Real-time rooms: Socket.IO events, in-memory state, drift correction |
| **7** | Lyrics feature: LRCLIB fetch, Firestore cache, sync scroll |
| **8** | Search, trending, recently played, artist/album pages |
| **9** | UI polish: dark theme, animations, responsive design |
| **10** | Deployment: Render (backend) + Vercel (frontend) |

---

## Verification Plan

### Automated Tests
- `npm test` (Vitest for frontend unit tests)
- `npm test` (Jest for backend service/route tests)
- Socket.IO event integration tests using `socket.io-client` in test mode

### Manual Verification
- Open two browser tabs → join same room → verify one user's play/pause/seek updates the other in real time
- Seek drift correction: pause audio mid-track, manually adjust `audio.currentTime`, resume → verify auto-correction within 5s
- Admin upload: upload MP3 + cover, verify CDN URL returned, song appears in search
- Lyrics: play a song with LRCLIB data → verify line highlights in sync with audio
- Auth guard: attempt to access `/admin` as a non-admin user → verify redirect
- Mobile responsiveness: test on 375px viewport

