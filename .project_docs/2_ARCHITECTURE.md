# System Architecture & Technical Design - WhatsApp System

## 1. Architectural Overview
The system follows a modular, single-container full-stack application architecture deployed to Cloud Run. Both HTTP REST requests, static assets, and WebSocket connections are unified on port `3000` via a single Node.js/Express server.

```
+-----------------------------------------------------------+
|                      CLIENT-SIDE (React)                  |
|  +------------------+  +-----------------+  +----------+  |
|  |   Auth Context   |  |   Chat Context  |  | UI/Views |  |
|  +--------+---------+  +--------+--------+  +----+-----+  |
+-----------|---------------------|----------------|--------+
            | HTTP / Auth         | WebSockets     |
            v                     v                v
+-----------------------------------------------------------+
|                      SERVER-SIDE (Express)                |
|  +------------------+  +-----------------+  +----------+  |
|  | Express Router   |  | WebSocket Server|  | JSON DB  |  |
|  | (/api/*)         |  | Handler         |  | Storage  |  |
|  +------------------+  +-----------------+  +----------+  |
+-----------------------------------------------------------+
```

---

## 2. Database Schema (JSON Storage Design)
To guarantee data durability without relying on heavy external database modules, a robust, transactional, file-backed JSON database state is implemented inside `src/db/db-store.json`. The server performs synchronized reads and writes on mutations.

### 2.1 Users Schema
```json
{
  "id": "string (UUID)",
  "username": "string (Unique Nickname)",
  "passwordHash": "string",
  "avatarUrl": "string (URL or Base64)",
  "statusText": "string",
  "isOnline": "boolean",
  "lastSeenAt": "string (ISO Timestamp)"
}
```

### 2.2 Conversations Schema
```json
{
  "id": "string (UUID)",
  "participantIds": ["string (UUID)"],
  "createdAt": "string (ISO Timestamp)",
  "updatedAt": "string (ISO Timestamp)"
}
```

### 2.3 Messages Schema
```json
{
  "id": "string (UUID)",
  "conversationId": "string (UUID)",
  "senderId": "string (UUID)",
  "recipientId": "string (UUID)",
  "content": "string",
  "type": "text | image | audio",
  "mediaUrl": "string (optional)",
  "status": "sent | delivered | read",
  "timestamp": "string (ISO Timestamp)"
}
```

### 2.4 Statuses (Stories) Schema
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "username": "string",
  "avatarUrl": "string",
  "type": "text | image",
  "content": "string (text message or image URL)",
  "bgColor": "string (Hex, only for text type)",
  "createdAt": "string (ISO Timestamp)",
  "viewers": ["string (User UUIDs)"]
}
```

---

## 3. Real-Time WebSocket Event Lifecycle
WebSocket communication is orchestrated using Node's standard `ws` package integrated into the Express server.

### 3.1 Client connection & Authentication
Upon connection, the client sends an initial `auth` payload containing their user session/JWT or user ID.

```json
{
  "event": "auth",
  "payload": { "userId": "user-uuid" }
}
```

Upon verification, the server marks the user as `isOnline: true`, registers their WebSocket connection handler in an in-memory map, and broadcasts their online status to other active users.

### 3.2 Key Broadcast Events

| Event Name | Sender | Description |
|---|---|---|
| `presence:status` | Server | Broadcasts user online/offline status to contacts. |
| `typing:start` | Client -> Server -> Recipient | Indicates the user is actively writing a message. |
| `typing:stop` | Client -> Server -> Recipient | Indicates the user has stopped writing. |
| `message:send` | Client | Outgoing message with recipient ID and content. |
| `message:new` | Server | Incoming real-time message routed to the recipient. |
| `message:receipt` | Client <-> Server <-> Client | Delivers message status updates (`delivered`, `read`). |

### 3.3 Reconnection Lifecycle
1. **Connection Closed**: Client detects disconnection, attempts back-off retry connections (e.g., exponential back-off).
2. **Re-connection Established**: Client sends an `auth` event again.
3. **Synchronization Fetch**: Client requests a REST sync of messages since their last recorded local message timestamp. This ensures zero data loss during silent drops.
