# Nexus Platform — Frontend

React + TypeScript frontend for **Nexus**, an Investor & Entrepreneur collaboration
platform. Built as part of a Full Stack Development Internship (Developers Hub).

**Live app:** https://nexus-five-tau.vercel.app
**Live API (backend):** https://web-production-f80ee.up.railway.app/api/auth/ping/

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- Axios (API calls with JWT auto-refresh)
- react-dropzone (file uploads)
- Native WebRTC + WebSocket (video calling)
- Deployed on Vercel

## Features (Week 1 + 2)

- Register/login with role selection (investor / entrepreneur)
- Role-based dashboards
- Meeting scheduling — request, accept, reject, cancel
- Video calling — join a call tied to an accepted meeting, mute/camera toggle
- Document Processing Chamber — upload, preview, e-signature (canvas signature pad)

## Project Structure
src/
├── api/              # Axios calls to the Django backend (auth, meetings, documents, users)
├── context/           # AuthContext — real backend auth, JWT token handling
├── pages/
│   ├── auth/            # Login, Register
│   ├── meetings/          # Schedule/accept/reject meetings
│   ├── call/               # WebRTC video call room
│   ├── documents/           # Upload/preview/sign documents
│   └── dashboard/             # Role-based dashboards
├── components/         # Shared UI (Sidebar, Navbar, Card, Button, etc.)
└── types/              # Shared TypeScript types

## Local Setup

```bash
npm install
```

Create a `.env` file in the project root with:

VITE_API_URL=http://127.0.0.1:8000/api

```bash
npm run dev
```

## Deployment
- **Frontend:** Vercel (auto-deploys on push to `main`)
- **Backend:** Railway

## Known Limitations
- Video calling uses a STUN server only (no TURN server) — works on most networks
- Uploaded documents may not persist across backend redeploys (Railway free tier, ephemeral storage)

## Documentation
- `NOTES.md` — running log of API requirements and weekly progress

