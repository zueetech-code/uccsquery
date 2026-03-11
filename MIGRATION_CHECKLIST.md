# Firebase to PostgreSQL Migration Checklist

## Phase 1: Setup & Infrastructure ✅ COMPLETE

- [x] Create PostgreSQL database schema (001-init-schema.sql)
- [x] Create database client wrapper (lib/db-client.ts)
- [x] Create database query helpers (lib/db-queries.ts)
- [x] Create JWT authentication (lib/auth.ts)
- [x] Create authentication API endpoints
  - [x] POST /api/auth/login
  - [x] POST /api/auth/register
  - [x] POST /api/auth/logout
- [x] Update environment variables (.env.local)
- [x] Remove Firebase dependencies (package.json)
- [x] Add JWT and bcrypt dependencies

## Phase 2: Core API Routes ✅ COMPLETE

- [x] Update /api/admin/users (GET, POST)
- [x] Update /api/admin/users/[uid] (PUT, DELETE)
- [x] Update /api/set-role
- [x] Update /api/pull/client-data
- [x] Update /api/clients/auto-execute
- [x] Update /api/clients/execute-online-status
- [x] Update /api/push/rcs

## Phase 3: Library Files ✅ COMPLETE

- [x] Remove Firebase imports from all lib files
- [x] Update lib/commandtimeout.ts
- [x] Update lib/agent-heartbeat.ts
- [x] Update lib/agent-heartbeat-agents.ts
- [x] Update types/index.ts interfaces
- [x] Delete lib/firebase-config.ts
- [x] Delete lib/firebase-client.ts
- [x] Delete lib/firebase-admin.ts

## Phase 4: Page & Component Updates ⏳ TODO

### Priority 1 - User Management
- [ ] Update app/login/page.tsx
  - [x] Basic structure done, component parts need API integration verification
- [ ] Update app/admin/users/page.tsx
  - [ ] Replace `adminDb.collection("users")` with API calls
  - [ ] Add user creation form
  - [ ] Add role management UI

### Priority 2 - Client Management
- [ ] Update app/admin/clients/page.tsx
  - [ ] Fetch clients from database
  - [ ] Add create client form
  - [ ] Add client status management

- [ ] Update components/clients-table.tsx
  - [ ] Fetch from API instead of Firestore
  - [ ] Add pagination

- [ ] Update components/create-client-dialog.tsx
  - [ ] POST to `/api/clients/create` endpoint
  - [ ] Handle form submission

- [ ] Update components/edit-client-dialog.tsx
  - [ ] PUT to update client API

### Priority 3 - Query Management
- [ ] Update app/admin/queries/page.tsx
  - [ ] Display all queries from database

- [ ] Update components/queries-table.tsx
  - [ ] Fetch queries from API

- [ ] Update components/create-query-dialog.tsx
  - [ ] POST to create query

### Priority 4 - Dashboard Pages
- [ ] Update app/admin/dashboard/page.tsx
  - [ ] Fetch dashboard data from API

- [ ] Update app/admin/multi-client-dashboard/page.tsx
  - [ ] Multi-client data fetching

- [ ] Update app/admin/ercs/dashboard/page.tsx
  - [ ] ERCS-specific dashboard

### Priority 5 - Data Management
- [ ] Update app/admin/fill-data/page.tsx
  - [ ] Replace Firebase data filling with PostgreSQL
  - [ ] Update batch operations

- [ ] Update app/admin/push-data/page.tsx
  - [ ] External API data pushing

- [ ] Update app/admin/pull-data/page.tsx (if exists)
  - [ ] Data pulling UI

### Priority 6 - Other Pages
- [ ] Update app/admin/agents/page.tsx
- [ ] Update app/admin/engineers/page.tsx
- [ ] Update app/admin/execute-query/page.tsx
- [ ] Update app/admin/logs/page.tsx
- [ ] Update app/admin/database-credentials/page.tsx
- [ ] Update app/admin/agent-reports/page.tsx

### Priority 7 - Other Components
- [ ] Update components/rcs-client-table.tsx
- [ ] Update components/assign-agent-dialog.tsx
- [ ] Update components/assign-clients-dialog.tsx
- [ ] Update components/db-configs-table.tsx
- [ ] Update components/admin-header.tsx
- [ ] Update components/admin-sidebar.tsx

### Priority 8 - Server Actions
- [ ] Update app/actions/save-db-config.ts

### Priority 9 - Other Files
- [ ] Update updateClients.js
- [ ] Update app/admin/layout.tsx

## Phase 5: Testing ⏳ TODO

- [ ] Test login with new local auth
- [ ] Test user creation and role assignment
- [ ] Test client CRUD operations
- [ ] Test query execution
- [ ] Test data pushing
- [ ] Test data pulling
- [ ] Test agent heartbeats
- [ ] Test command timeout worker
- [ ] Test online status execution
- [ ] Test auto-execute functionality

## Phase 6: Deployment ⏳ TODO

- [ ] Verify all environment variables set
- [ ] Run database migrations on production
- [ ] Update CI/CD pipelines (remove Firebase steps)
- [ ] Run full application test suite
- [ ] Monitor logs for any Firebase references
- [ ] Set up database backups

## Documentation ✅ COMPLETE

- [x] FIREBASE_TO_POSTGRESQL_MIGRATION.md - Migration overview
- [x] IMPLEMENTATION_GUIDE.md - Implementation patterns
- [x] API_ENDPOINTS.md - API documentation
- [x] MIGRATION_CHECKLIST.md - This file

## Files Changed Summary

### Created
- scripts/001-init-schema.sql
- scripts/setup-db.js
- lib/db-client.ts
- lib/auth.ts
- lib/db-queries.ts
- app/api/auth/login/route.ts
- app/api/auth/register/route.ts
- app/api/auth/logout/route.ts
- .env.local (example)
- .env.example

### Updated
- package.json (removed firebase, added bcryptjs, jsonwebtoken)
- lib/commandtimeout.ts
- lib/agent-heartbeat.ts
- lib/agent-heartbeat-agents.ts
- types/index.ts
- app/login/page.tsx
- app/api/admin/users/route.ts
- app/api/admin/users/[uid]/route.ts
- app/api/set-role/route.ts
- app/api/pull/client-data/route.ts
- app/api/clients/auto-execute/route.ts
- app/api/clients/execute-online-status/route.ts
- app/api/push/rcs/route.ts

### Deleted
- lib/firebase-config.ts
- lib/firebase-client.ts
- lib/firebase-admin.ts

## Next Steps

1. **Verify Database Connection**
   ```bash
   npm run db:setup
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Test Login**
   - Navigate to http://localhost:3000/login
   - Test with demo credentials

4. **Update Components** (Following Priority order above)
   - Replace Firebase calls with API calls
   - Test each component as you update it

5. **Run Full Test Suite**
   ```bash
   npm test
   ```

## Common Issues & Solutions

### Issue: "No database URL found"
**Solution:** Ensure DATABASE_URL is set in .env.local

### Issue: "User not found" on login
**Solution:** Create a test user using POST /api/auth/register

### Issue: "Connection refused"
**Solution:** Ensure PostgreSQL is running and database exists

### Issue: "JWT_SECRET not set"
**Solution:** Add JWT_SECRET to .env.local (any random string for dev)

## Support

For detailed API documentation, see: API_ENDPOINTS.md
For implementation patterns, see: IMPLEMENTATION_GUIDE.md
For setup instructions, see: FIREBASE_TO_POSTGRESQL_MIGRATION.md
