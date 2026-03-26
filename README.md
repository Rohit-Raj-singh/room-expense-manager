# Room Expense Manager (Splitwise-like)

Multi-group expense management with strict per-group isolation, JWT authentication, and real-time dashboard updates via Socket.io.

## Core Business Rules (enforced)

1. One admin can create multiple groups.
2. One member can join multiple groups.
3. Expenses are strictly separated per group.
4. A member’s expenses in one group never appear in another group.
5. Only members of a group can add/edit/delete that group’s expenses.
6. Each group maintains its own independent expense history + analytics.

## Tech Stack

**Frontend**: React (Vite), Tailwind CSS, React Router, Axios, Context API, Socket.io client, Chart.js  
**Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Socket.io, MVC-style layout

## Folder Structure

- `backend/` - Express app (JWT + Socket.io)
- `frontend/app/` - React app (Vite + Tailwind)

## Prerequisites

- Node.js 18+
- MongoDB Atlas account

## Environment Variables

### Backend (`backend/.env`)

Create `room-expense-manager/backend/.env`:

```bash
NODE_ENV=development
PORT=3000

# MongoDB connection string (MongoDB Atlas)
MONGODB_URI=...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# CORS (must include your frontend origin)
CORS_ORIGIN=http://localhost:5173

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

### Frontend (`frontend/app/.env`)

Create `room-expense-manager/frontend/app/.env` for deployments:

```bash
# Backend origin (example: https://your-backend.onrender.com)
VITE_API_URL=

# Socket.io origin (usually same as backend origin)
VITE_SOCKET_URL=
```

For local dev with Vite proxy, you can leave these blank.

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend/app
npm install
npm run dev
```

Open the frontend in your browser (Vite default URL).

## Real-time Updates (Socket.io)

When an expense is added/edited/deleted, the backend emits:

- event: `expenseUpdated`
- payload: `{ groupId }`

Socket rooms are joined per-group (`group_<groupId>`). The dashboard only refreshes when the update matches the currently selected group.

## API Overview

All expense/analytics queries require the caller to be a member of the requested group. Mutations enforce:

- the expense belongs to the provided `groupId`
- the caller is a member of that group
- the `member` on the expense is also a member of the group

### Auth

- `POST /api/register`
- `POST /api/login`
- `GET /api/me` (protected)

### Group Management (admin-only for member changes)

- `POST /api/group/create`
- `GET /api/group/list`
- `POST /api/group/add-member`
- `POST /api/group/remove-member`
- `DELETE /api/group/:groupId`

### Dashboard Data

- `GET /api/group/summary?groupId=<id>` (protected)
- `GET /api/settlement/:groupId` (protected, member-only)

### Expenses

- `POST /api/expense/add`
- `GET /api/expense/list?groupId=<id>`
- `PUT /api/expense/:expenseId`
- `DELETE /api/expense/:expenseId?groupId=<id>`

### Analytics

- `GET /api/analytics/monthly?groupId=<id>`
- `GET /api/analytics/member-wise?groupId=<id>`

### Settlement Response Shape

`GET /api/settlement/:groupId` returns:

```json
{
  "totalExpense": 1200,
  "perPersonShare": 400,
  "balances": [
    {
      "memberId": "66f...a1",
      "name": "Rohit",
      "spent": 700,
      "balance": 300
    }
  ],
  "settlements": [
    {
      "from": "Amit",
      "to": "Rohit",
      "amount": 300
    }
  ]
}
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Add a Database User (username/password).
3. Whitelist your IP in **Network Access** (MongoDB Atlas) for local testing.
4. Use the cluster connection string as `MONGODB_URI` in backend `.env`.

## Deployment

### Deploy Backend on Render

1. Create a Render **Web Service**.
2. Point it to this repo and choose `backend/` as the root.
3. Build command:
   - `npm install`
4. Start command:
   - `npm start`
5. Environment variables:
   - `PORT=3000` (or Render’s assigned port if you prefer; update start accordingly)
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `JWT_EXPIRES_IN=7d`
   - `CORS_ORIGIN=<your-vercel-domain>`
   - `BCRYPT_SALT_ROUNDS=10`
6. Ensure Socket.io works through Render (no special config needed for standard WebSockets).

### Deploy Frontend on Vercel

1. Create a Vercel project from the same repo.
2. Set the **Root Directory** to `frontend/app`.
3. Build command:
   - `npm install`
   - `npm run build`
4. Output directory:
   - `dist`
5. Environment variables in Vercel:
   - `VITE_API_URL=<backend-origin>` (example: `https://backend-xyz.onrender.com`)
   - `VITE_SOCKET_URL=<backend-origin>`

## Deployment Verification Checklist

After deploying backend + frontend, verify these flows end-to-end:

1. Register + login works.
2. Create two groups with same users.
3. Add expenses in group A only.
4. Open group B dashboard and confirm those expenses do not appear.
5. Open `GET /api/settlement/:groupId` for group A and verify totals/balances/settlements.
6. Confirm non-member receives `403` on settlement endpoint.
7. Add/edit/delete expense and verify realtime dashboard refresh for that group.
8. Reload direct route `/dashboard/:groupId` in production and confirm app still loads.

## Notes

- Passwords are hashed with bcrypt.
- JWT authentication is enforced on all protected routes.
- Strict per-group isolation is implemented at the query layer (every expense/analytics operation filters by `groupId/group` and verifies membership/admin rules).

