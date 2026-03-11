# Quick Reference Guide

## 🚀 Get Started in 5 Minutes

```bash
# 1. Setup database
npm run db:setup

# 2. Start server
npm run dev

# 3. Login at http://localhost:3000/login
```

---

## 🔑 Quick API Examples

### Login
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  }),
  credentials: 'include'
})
const { user } = await response.json()
```

### Get All Clients
```typescript
const response = await fetch('/api/clients')
const { clients } = await response.json()
```

### Create Client
```typescript
const response = await fetch('/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'CLIENT123',
    client_name: 'XYZ Bank',
    email: 'contact@bank.com'
  })
})
```

### Query Database
```typescript
import { query } from '@/lib/db-client'

// Get data
const clients = await query(
  'SELECT * FROM clients WHERE status = $1',
  ['active']
)

// Get single record
import { queryOne } from '@/lib/db-client'
const client = await queryOne(
  'SELECT * FROM clients WHERE client_id = $1',
  ['CLIENT123']
)
```

---

## 📁 File Locations

| Need | Location |
|------|----------|
| DB Client | `lib/db-client.ts` |
| Auth Logic | `lib/auth.ts` |
| Queries | `lib/db-queries.ts` |
| API Routes | `app/api/` |
| Components | `components/` |
| Pages | `app/admin/` |
| Types | `types/index.ts` |

---

## 🔐 Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/uccsquery
JWT_SECRET=your-secret-key
PULL_API_KEY=your-api-key
NODE_ENV=development
```

---

## 💾 Database Tables

```
users
├── id (PK)
├── uid (unique)
├── email (unique)
├── password_hash
├── full_name
├── role
└── created_at

clients
├── id (PK)
├── client_id (unique)
├── client_name
├── email
├── status
├── online_status
└── created_at

commands
├── id (PK)
├── client_id (FK)
├── command_type
├── status
├── result
├── error
└── created_at

agents
├── id (PK)
├── agent_id (unique)
├── email
├── status
└── created_at

reports
├── id (PK)
├── client_id (FK)
├── report_type
├── report_data
└── created_at

(+ 5 more tables...)
```

---

## 🎯 Common Tasks

### Create User (Admin Only)
```typescript
POST /api/admin/users
{
  "email": "new@example.com",
  "password": "secure_password",
  "role": "agent",
  "fullName": "John Doe"
}
```

### Update User Role
```typescript
POST /api/set-role
{
  "uid": "user_id_here",
  "role": "admin"
}
```

### Get All Users
```typescript
GET /api/admin/users
```

### Delete User
```typescript
DELETE /api/admin/users/user_id_here
```

---

## 🐛 Debug Commands

```bash
# Check database connection
npm run db:setup

# Check if tables exist
psql -U postgres -d uccsquery -c "\dt"

# View logs
npm run dev

# Test API
curl -X GET http://localhost:3000/api/admin/users
```

---

## 📝 Component Migration Template

### Before (Firebase):
```typescript
import { collection, getDocs } from "firebase/firestore"

const snap = await getDocs(collection(db, "clients"))
const clients = snap.docs.map(d => d.data())
```

### After (PostgreSQL):
```typescript
const response = await fetch('/api/clients')
const { clients } = await response.json()
```

---

## 🔗 Important Links

- **Setup**: `FIREBASE_TO_POSTGRESQL_MIGRATION.md`
- **Patterns**: `IMPLEMENTATION_GUIDE.md`
- **APIs**: `API_ENDPOINTS.md`
- **Progress**: `MIGRATION_CHECKLIST.md`
- **Status**: `COMPLETION_STATUS.md`

---

## ⚡ Common Errors & Fixes

| Error | Solution |
|-------|----------|
| "No database URL" | Set DATABASE_URL in .env.local |
| "Connection refused" | Start PostgreSQL |
| "Database does not exist" | Run `npm run db:setup` |
| "User not found" | Create user via `/api/auth/register` |
| "Invalid token" | Login again with `/api/auth/login` |

---

## 🔄 Update Component Checklist

When updating a component:

- [ ] Remove Firebase imports
- [ ] Add fetch calls to new API endpoints
- [ ] Update useState for loading/error states
- [ ] Add useEffect for data loading
- [ ] Test with browser DevTools
- [ ] Verify all CRUD operations work

---

## 📚 TypeScript Interfaces

```typescript
import { Client, Agent, Command } from '@/types'

const client: Client = {
  id: 1,
  client_id: 'CLIENT123',
  client_name: 'Bank Name',
  email: 'email@bank.com',
  status: 'active',
  created_at: '2024-03-01',
  updated_at: '2024-03-01'
}

const command: Command = {
  id: 1,
  client_id: 1,
  command_type: 'query_type',
  status: 'pending',
  created_at: '2024-03-01'
}
```

---

## 🛠️ Development Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000/login

# 3. Make changes to components/pages

# 4. Browser auto-refreshes (HMR)

# 5. Test in browser DevTools

# 6. Commit changes

# 7. Push to repository
```

---

## 📊 Progress

```
Infrastructure  ████████████████████ 100% ✅
Auth System     ████████████████████ 100% ✅
Core APIs       ████████████████████ 100% ✅
Components      ░░░░░░░░░░░░░░░░░░░░  0% ⏳
Testing         ░░░░░░░░░░░░░░░░░░░░  0% ⏳
Deployment      ░░░░░░░░░░░░░░░░░░░░  0% ⏳

Overall:        ███████░░░░░░░░░░░░░ 40% 🔄
```

---

## ✅ Verification Checklist

- [ ] Database initialized with `npm run db:setup`
- [ ] Dev server running with `npm run dev`
- [ ] Can visit http://localhost:3000/login
- [ ] Can create user via `/api/auth/register`
- [ ] Can login with new user
- [ ] Can access admin dashboard
- [ ] API endpoints responding correctly

---

## 🎓 Next Steps

1. **Understand the basics** - Read README_MIGRATION.md
2. **Setup environment** - Run npm run db:setup
3. **Test core features** - Login and user management
4. **Update components** - Follow IMPLEMENTATION_GUIDE.md
5. **Test everything** - Verify all operations work
6. **Deploy** - Set environment variables and deploy

---

## 💡 Pro Tips

- Use React DevTools to inspect component state
- Use PostgreSQL client to query database directly
- Use browser Network tab to inspect API calls
- Set breakpoints in debugger for testing
- Use console.log for quick debugging
- Check .env.local is not committed to git

---

**Ready to start? Run `npm run db:setup` then `npm run dev`!**
