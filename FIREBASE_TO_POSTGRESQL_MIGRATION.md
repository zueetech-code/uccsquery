# Firebase to PostgreSQL Migration Guide

This document outlines the conversion from Firebase to a local PostgreSQL database for the UCCS Query application.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create or update `.env.local`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/uccsquery
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PULL_API_KEY=your-pull-api-key
```

### 3. Create PostgreSQL Database

```bash
createdb uccsquery
```

### 4. Run Database Migrations

The migration script creates all necessary tables:

```bash
npm run db:setup
```

Or manually:

```bash
psql -U postgres -d uccsquery -f scripts/001-init-schema.sql
```

## Database Schema

### Tables Created

1. **users** - Authentication and user management
2. **clients** - Client information and status
3. **queries** - Query definitions and configurations
4. **commands** - Command execution records
5. **agents** - Agent information
6. **engineers** - Engineer information
7. **agent_heartbeats** - Agent health monitoring
8. **reports** - Final reports and data
9. **configurations** - System configurations
10. **balances** - Cash balance tracking

## Files Changed

### Authentication
- `lib/auth.ts` - New JWT-based authentication
- `lib/db-client.ts` - Database connection wrapper
- `app/api/auth/login/route.ts` - New login endpoint
- `app/api/auth/register/route.ts` - New registration endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint

### API Routes Updated
- `app/api/admin/users/route.ts` - User management
- `app/api/admin/users/[uid]/route.ts` - User CRUD
- `app/api/pull/client-data/route.ts` - Data pulling
- `app/api/clients/auto-execute/route.ts` - Auto execution
- `app/api/clients/execute-online-status/route.ts` - Status execution
- `app/api/push/rcs/route.ts` - RCS data pushing

### Still Need Updating (Manual)

The following files still have Firebase references and need manual updates:

**Components:**
- `components/rcs-client-table.tsx`
- `components/queries-table.tsx`
- `components/create-query-dialog.tsx`
- `components/create-client-dialog.tsx`
- And others...

**Pages:**
- `app/admin/users/page.tsx`
- `app/admin/queries/page.tsx`
- `app/admin/fill-data/page.tsx`
- And others...

**Actions:**
- `app/actions/save-db-config.ts`
- And others...

## Migration Steps Completed

✅ Database schema created
✅ Authentication system migrated
✅ API routes updated (core endpoints)
✅ Dependencies updated (Firebase removed, JWT/bcrypt added)

## Migration Steps Remaining

Components and pages still using Firebase:
1. Replace `adminDb.collection().where()` with API calls or db-queries
2. Replace `collection().add()` with API POST requests
3. Update real-time listeners to API polling or webhooks
4. Update form submissions to use new API endpoints

## Example Migration Pattern

### Before (Firebase):
```typescript
const snap = await adminDb.collection("clients").where("status", "==", "active").get()
const clients = snap.docs.map(doc => doc.data())
```

### After (PostgreSQL):
```typescript
import { query } from "@/lib/db-client"
const clients = await query('SELECT * FROM clients WHERE status = $1', ['active'])
```

## Important Notes

- JWT tokens are stored in HTTP-only cookies for security
- Password hashing uses bcryptjs
- All database queries use parameterized statements to prevent SQL injection
- Environment variables must be set before running the application
- The PULL_API_KEY is used for the external data pulling API
