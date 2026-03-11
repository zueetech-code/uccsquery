# Firebase to PostgreSQL Implementation Guide

## Completed ✅

### Core Infrastructure
- [x] PostgreSQL database schema and migration script
- [x] Database client wrapper (`lib/db-client.ts`)
- [x] Database query helpers (`lib/db-queries.ts`)
- [x] JWT-based authentication system (`lib/auth.ts`)
- [x] Environment variables setup (`.env.local`, `.env.example`)

### API Endpoints
- [x] POST `/api/auth/login` - JWT login
- [x] POST `/api/auth/register` - User registration
- [x] POST `/api/auth/logout` - Logout
- [x] GET/POST `/api/admin/users` - User management
- [x] PUT/DELETE `/api/admin/users/[uid]` - User CRUD
- [x] POST `/api/set-role` - Set user role
- [x] POST `/api/pull/client-data` - Data pulling
- [x] GET `/api/clients/auto-execute` - Auto execution
- [x] GET `/api/clients/execute-online-status` - Status execution
- [x] POST `/api/push/rcs` - RCS data pushing

### Library Files
- [x] `lib/commandtimeout.ts` - Command timeout worker
- [x] `lib/agent-heartbeat.ts` - Agent heartbeat
- [x] `lib/agent-heartbeat-agents.ts` - Agent heartbeat agents
- [x] `types/index.ts` - Updated TypeScript interfaces

### Removed
- [x] `lib/firebase-config.ts`
- [x] `lib/firebase-client.ts`
- [x] `lib/firebase-admin.ts`

## Still Need Manual Updates 🔧

### Components Files
Location: `components/*.tsx`

**What to replace:**
- Firestore `collection()`, `where()`, `onSnapshot()` calls
- Use `fetch()` to call the new API endpoints instead
- Update real-time listeners to use polling with setInterval or React Query/SWR

**Example components:**
- `rcs-client-table.tsx` - Fetch clients from API
- `queries-table.tsx` - Fetch queries from API
- `create-query-dialog.tsx` - POST to create query
- `create-client-dialog.tsx` - POST to create client
- `clients-table.tsx` - Fetch and display clients
- `edit-client-dialog.tsx` - Update client via API
- `db-configs-table.tsx` - Manage database configs
- `assign-agent-dialog.tsx` - Assign agents via API

### Page Files
Location: `app/admin/**/*.tsx`

**Priority:**
1. `app/admin/users/page.tsx` - User management page
2. `app/admin/queries/page.tsx` - Query management page
3. `app/admin/clients/page.tsx` - Client management page
4. `app/admin/fill-data/page.tsx` - Data filling page
5. `app/admin/dashboard/page.tsx` - Main dashboard
6. `app/admin/multi-client-dashboard/page.tsx` - Multi-client dashboard
7. `app/admin/agents/page.tsx` - Agent management
8. `app/admin/engineers/page.tsx` - Engineer management
9. `app/admin/execute-query/page.tsx` - Query execution
10. `app/admin/logs/page.tsx` - Logs page
11. `app/admin/ercs/dashboard/page.tsx` - ERCS dashboard
12. `app/admin/database-credentials/page.tsx` - DB credentials
13. `app/admin/agent-reports/page.tsx` - Agent reports
14. `app/admin/push-data/page.tsx` - Push data page

### Action Files
Location: `app/actions/*.ts`

- `save-db-config.ts` - Database configuration saving

### Other Files
- `updateClients.js` - Client update script
- `app/admin/layout.tsx` - Admin layout (remove Firebase init)

## Migration Pattern Template

### Before (Firebase):
```typescript
"use client"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase-client"

export default function MyComponent() {
  const [clients, setClients] = useState([])

  useEffect(() => {
    const q = query(collection(db, "clients"), where("status", "==", "active"))
    getDocs(q).then(snap => {
      setClients(snap.docs.map(doc => doc.data()))
    })
  }, [])

  return <div>{/* render clients */}</div>
}
```

### After (PostgreSQL):
```typescript
"use client"
import { useEffect, useState } from "react"

export default function MyComponent() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        setClients(data.clients)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{/* render clients */}</div>
}
```

## Adding New API Endpoints

If you need to add new API endpoints:

### 1. Create route handler:
```typescript
// app/api/clients/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db-client"

export async function GET() {
  try {
    const clients = await query('SELECT * FROM clients WHERE status = $1', ['active'])
    return NextResponse.json({ clients })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

### 2. Use in components:
```typescript
const response = await fetch('/api/clients')
const { clients } = await response.json()
```

## Testing

After updating components and pages:

1. Start dev server: `npm run dev`
2. Test login at `/login`
3. Test user creation: Visit `/admin/users`
4. Test client operations: Visit `/admin/clients`
5. Verify all CRUD operations work

## Database Connection Issues?

If you get `No database URL found`:

1. Ensure `.env.local` exists with `DATABASE_URL`
2. PostgreSQL must be running
3. Database must exist: `createdb uccsquery`
4. Run migrations: `npm run db:setup`

## Performance Considerations

- Add indexes for frequently queried columns
- Use pagination for large result sets
- Implement caching with React Query/SWR
- Add loading states to prevent UI flashing
