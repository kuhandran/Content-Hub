# Chat History API Documentation

## Setup Instructions

### 1. Create Vercel Postgres Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new PostgreSQL database in Storage
3. Copy the connection strings to `.env.local`:
   - `POSTGRES_PRISMA_URL` (with connection pooling)
   - `POSTGRES_URL_NON_POOLING` (for migrations)

### 2. Push Schema to Database
```bash
npm run prisma:push
```

### 3. Verify Connection
```bash
npm run prisma:studio
```

---

## API Endpoints

### 1. Get Chat History
```
GET /api/v1/chat/history?userId={userId}&lang={lang}&limit={limit}&offset={offset}
```

**Parameters:**
- `userId` (required): User identifier
- `lang` (optional): Language code, defaults to 'en'
- `limit` (optional): Max messages to return, defaults to 50
- `offset` (optional): Pagination offset, defaults to 0

**Example:**
```bash
curl "http://localhost:3000/api/v1/chat/history?userId=user123&lang=en&limit=20"
```

**Response:**
```json
{
  "userId": "user123",
  "language": "en",
  "messages": [
    {
      "id": "msg-1",
      "userId": "user123",
      "language": "en",
      "role": "user",
      "content": "Hello, how are you?",
      "metadata": null,
      "createdAt": "2026-01-06T10:30:00.000Z",
      "updatedAt": "2026-01-06T10:30:00.000Z"
    },
    {
      "id": "msg-2",
      "userId": "user123",
      "language": "en",
      "role": "assistant",
      "content": "I'm doing great! How can I help?",
      "metadata": null,
      "createdAt": "2026-01-06T10:30:05.000Z",
      "updatedAt": "2026-01-06T10:30:05.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Add Message to Chat History
```
POST /api/v1/chat/history
```

**Request Body:**
```json
{
  "userId": "user123",
  "role": "user",
  "content": "What is your name?",
  "lang": "en",
  "metadata": {
    "source": "web",
    "sentiment": "neutral"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "msg-123",
  "userId": "user123",
  "language": "en",
  "role": "user",
  "content": "What is your name?",
  "metadata": {
    "source": "web",
    "sentiment": "neutral"
  },
  "createdAt": "2026-01-06T10:35:00.000Z",
  "updatedAt": "2026-01-06T10:35:00.000Z"
}
```

---

### 3. Get Chat Sessions
```
GET /api/v1/chat/sessions?userId={userId}&lang={lang}
```

**Parameters:**
- `userId` (required): User identifier
- `lang` (optional): Language code, defaults to 'en'

**Example:**
```bash
curl "http://localhost:3000/api/v1/chat/sessions?userId=user123"
```

**Response:**
```json
{
  "userId": "user123",
  "language": "en",
  "sessions": [
    {
      "id": "session-1",
      "userId": "user123",
      "language": "en",
      "title": "Project Discussion",
      "metadata": null,
      "createdAt": "2026-01-05T14:20:00.000Z",
      "updatedAt": "2026-01-06T10:40:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4. Create Chat Session
```
POST /api/v1/chat/sessions
```

**Request Body:**
```json
{
  "userId": "user123",
  "lang": "en",
  "title": "My Chat Session",
  "metadata": {
    "type": "general"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "session-abc123",
  "userId": "user123",
  "language": "en",
  "title": "My Chat Session",
  "metadata": {
    "type": "general"
  },
  "createdAt": "2026-01-06T10:45:00.000Z",
  "updatedAt": "2026-01-06T10:45:00.000Z"
}
```

---

### 5. Get Chat Preferences
```
GET /api/v1/chat/preferences?userId={userId}
```

**Parameters:**
- `userId` (required): User identifier

**Example:**
```bash
curl "http://localhost:3000/api/v1/chat/preferences?userId=user123"
```

**Response:**
```json
{
  "id": "pref-1",
  "userId": "user123",
  "language": "en",
  "theme": "dark",
  "settings": {
    "autoSave": true,
    "notifications": true
  },
  "createdAt": "2026-01-06T10:00:00.000Z",
  "updatedAt": "2026-01-06T10:00:00.000Z"
}
```

---

### 6. Update Chat Preferences
```
POST /api/v1/chat/preferences
```

**Request Body:**
```json
{
  "userId": "user123",
  "language": "es",
  "theme": "dark",
  "settings": {
    "autoSave": true,
    "notifications": false
  }
}
```

**Response (201 Created):**
```json
{
  "id": "pref-1",
  "userId": "user123",
  "language": "es",
  "theme": "dark",
  "settings": {
    "autoSave": true,
    "notifications": false
  },
  "createdAt": "2026-01-06T10:00:00.000Z",
  "updatedAt": "2026-01-06T10:50:00.000Z"
}
```

---

## JavaScript/React Examples

### Fetch Chat History
```javascript
async function getChatHistory(userId, lang = 'en') {
  const response = await fetch(
    `/api/v1/chat/history?userId=${userId}&lang=${lang}&limit=50`
  )
  return response.json()
}

// Usage
const history = await getChatHistory('user123', 'en')
console.log(history.messages)
```

### Save a Message
```javascript
async function saveMessage(userId, role, content, lang = 'en') {
  const response = await fetch('/api/v1/chat/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role, content, lang })
  })
  return response.json()
}

// Usage
await saveMessage('user123', 'user', 'Hello!', 'en')
```

### React Hook
```jsx
import { useEffect, useState } from 'react'

function useChatHistory(userId, lang = 'en') {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/chat/history?userId=${userId}&lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages)
        setLoading(false)
      })
  }, [userId, lang])

  const addMessage = async (role, content) => {
    const res = await fetch('/api/v1/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, content, lang })
    })
    const newMessage = await res.json()
    setMessages([...messages, newMessage])
  }

  return { messages, loading, addMessage }
}

// Usage in component
export default function ChatWindow() {
  const { messages, loading, addMessage } = useChatHistory('user123')

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id} className={msg.role}>
          {msg.content}
        </div>
      ))}
      <button onClick={() => addMessage('user', 'New message')}>
        Send
      </button>
    </div>
  )
}
```

---

## Database Schema

### ChatMessage
```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  userId    String   @db.VarChar(255)
  language  String   @default("en") @db.VarChar(10)
  role      String   @db.VarChar(20) // "user" or "assistant"
  content   String   @db.Text
  metadata  Json?    // Additional data
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([language])
  @@index([createdAt])
  @@index([userId, language, createdAt])
}
```

### ChatSession
```prisma
model ChatSession {
  id        String   @id @default(cuid())
  userId    String   @db.VarChar(255)
  language  String   @default("en") @db.VarChar(10)
  title     String?  @db.VarChar(255)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([language])
  @@index([createdAt])
  @@index([userId, language])
}
```

### ChatPreference
```prisma
model ChatPreference {
  id        String   @id @default(cuid())
  userId    String   @unique @db.VarChar(255)
  language  String   @default("en") @db.VarChar(10)
  theme     String?  @db.VarChar(50)
  settings  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Deployment to Vercel

1. **Connect Database**
   - Vercel will automatically detect `.env.local` changes
   - Push to GitHub to trigger deployment

2. **Run Migrations**
   ```bash
   npm run prisma:push
   ```

3. **Environment Variables**
   - Add `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` to Vercel project settings

---

## Performance Tips

- **Indexing**: All frequent queries are indexed (userId, language, createdAt)
- **Pagination**: Use `limit` and `offset` for large datasets
- **Cleanup**: Archive old messages periodically using:
  ```sql
  DELETE FROM "ChatMessage" WHERE "createdAt" < NOW() - INTERVAL '90 days'
  ```

---
