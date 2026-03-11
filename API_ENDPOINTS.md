# Available API Endpoints

## Authentication

### POST `/api/auth/login`
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Returns: `{ token: "jwt_token", user: { uid, email, role } }`

### POST `/api/auth/register`
Register new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```
Returns: `{ success: true, user: { uid, email } }`

### POST `/api/auth/logout`
Logout current user
Returns: `{ success: true }`

---

## User Management

### GET `/api/admin/users`
Get all users (admin only)
Returns: `{ users: [...] }`

### POST `/api/admin/users`
Create new user (admin only)
```json
{
  "email": "user@example.com",
  "password": "password",
  "role": "admin|engineer|agent",
  "fullName": "John Doe"
}
```

### PUT `/api/admin/users/[uid]`
Update user (admin only)
```json
{
  "email": "new@example.com",
  "role": "engineer",
  "fullName": "Jane Doe"
}
```

### DELETE `/api/admin/users/[uid]`
Delete user (admin only)

---

## Role Management

### POST `/api/set-role`
Set user role (admin only)
```json
{
  "uid": "user_id",
  "role": "admin|engineer|agent"
}
```
Returns: `{ success: true }`

---

## Client Data

### POST `/api/pull/client-data`
Pull client data (requires API key)
```json
{
  "clientId": "client_123",
  "fromDate": "2024-03-01"
}
```
Headers: `x-api-key: PULL_API_KEY`

### GET `/api/clients/auto-execute`
Auto-execute pending commands
Returns: `{ created: 5 }`

### GET `/api/clients/execute-online-status`
Execute commands for online clients
Returns: `{ processedClients: 10 }`

---

## Data Pushing

### POST `/api/push/rcs`
Push RCS data to external API (requires API key)
```json
{
  "clientNames": ["client1", "client2"],
  "fromDate": "2024-03-01"
}
```
Headers: `x-api-key: PUSH_API_KEY`

---

## Database Query Helpers

### Using db-client directly

```typescript
import { query, queryOne, insert, update, deleteRecord, findByColumn } from '@/lib/db-client'

// Query multiple rows
const clients = await query('SELECT * FROM clients WHERE status = $1', ['active'])

// Query single row
const client = await queryOne('SELECT * FROM clients WHERE id = $1', [1])

// Insert
const newUser = await insert('users', {
  email: 'user@example.com',
  full_name: 'John',
  role: 'agent'
})

// Update
await update('users', userId, { role: 'admin' })

// Delete
await deleteRecord('users', userId)

// Find by column
const user = await findByColumn('users', 'email', 'user@example.com')
```

---

## Using db-queries helpers

```typescript
import {
  getClientByClientId,
  getAllClients,
  getCommandsByClientId,
  getLatestReportByClientId,
  createCommand,
  // ... more helpers
} from '@/lib/db-queries'

const client = await getClientByClientId('client_123')
const allClients = await getAllClients()
const commands = await getCommandsByClientId('client_123')
```

---

## Error Handling

All API endpoints return errors in this format:
```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

---

## Authentication with API

### JWT Token Storage
Tokens are stored in HTTP-only cookies. Include credentials:

```typescript
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

### Required Roles
- **admin**: Full system access
- **engineer**: Can manage database configs and clients
- **agent**: Can execute queries
- **ercs**: Special role for ERCS dashboard
