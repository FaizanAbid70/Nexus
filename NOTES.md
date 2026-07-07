# Nexus Platform — Development Notes

## API Requirements (from frontend page audit — Week 1)

- Login page → POST /api/auth/login/
- Register page → POST /api/auth/register/
- Dashboard (Investor) → GET /api/auth/profile/me/, GET /api/meetings/
- Dashboard (Entrepreneur) → GET /api/auth/profile/me/, GET /api/meetings/
- Meeting/Calendar page → GET/POST /api/meetings/
- Document Chamber → GET/POST /api/documents/
- Payment section → GET/POST /api/transactions/ (Week 3 — not built yet)

---

## Week 1 — Auth & Profiles → DONE

- POST /api/auth/register/ — accepts name, email, password, role
- POST /api/auth/login/ — accepts email, password
- GET/PUT /api/auth/profile/me/
- GET /api/auth/profile/<id>/ — public profile view (email hidden)
- JWT-based auth (access + refresh tokens)
- Role-based access: investor vs entrepreneur
- Custom User model: name, bio, profile_picture, preferences, startup_history, investment_history

---

## Week 2 — Meetings, Video Calls, Documents → DONE

See backend/CHANGES_WEEK2.md for full technical details.

**Milestone 3 — Meeting Scheduling**
- GET/POST /api/meetings/ — list mine, or schedule a new one
- GET/DELETE /api/meetings/<id>/
- POST /api/meetings/<id>/accept/
- POST /api/meetings/<id>/reject/
- POST /api/meetings/<id>/cancel/
- Conflict detection built in (can't double-book a time slot)

**Milestone 4 — Video Calling (Basic)**
- WebSocket signaling: ws://.../ws/call/<room_name>/?token=<jwt>
- WebRTC peer-to-peer video/audio, join via a meeting's auto-generated room
- Toggle mic/camera, end call

**Milestone 5 — Document Processing Chamber**
- GET/POST /api/documents/ — upload & list (multipart/form-data)
- GET/DELETE /api/documents/<id>/
- POST /api/documents/<id>/sign/ — attaches e-signature image, marks as signed
- In-browser PDF/image preview
- File storage: local /media/ in dev

**Frontend additions**
- src/api/ — client.ts, auth.ts, meetings.ts, documents.ts, users.ts
- AuthContext.tsx rewritten to use real backend (was mock localStorage data)
- New pages: MeetingsPage, VideoCallPage
- DocumentsPage rebuilt with upload/preview/e-signature (canvas signature pad)
- GET /api/auth/users/?role=investor|entrepreneur — added to support picking meeting participants



