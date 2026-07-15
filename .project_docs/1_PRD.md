# Product Requirements Document (PRD) - WhatsApp System

## 1. Executive Summary
The WhatsApp System is a high-performance, real-time communication platform comprising a fully responsive, pixel-perfect React single-page application and a robust Express-based backend. It mimics the core UX of WhatsApp Web, prioritizing smooth transitions, instant real-time message delivery, robust offline/reconnection capabilities, and clean state management.

---

## 2. Core Functional Requirements

### 2.1 User Authentication & Presence
- **Sign In / Registration**: Secure, simplified user login using a unique nickname or phone-like identifier.
- **Session Persistence**: JWT-based or session-based persistence to automatically log users back in upon page refresh.
- **Real-Time Presence (Online/Offline)**: Live status indicator next to contacts showing whether they are currently connected.
- **Last Seen Status**: When offline, the contact detail header shows their last active timestamp.
- **Typing Indicators**: Visual feedback ("typing...") when a contact is actively writing a message.

### 2.2 Contact & Conversation Management
- **Contact Search & Add**: Users can search for other registered nicknames and instantly create a private conversation.
- **Active Chats List**: Left-hand sidebar displaying a list of conversations sorted by the most recent message, with badge indicators for unread messages.
- **Direct Messaging**: One-on-one private messaging with standard text input, emojis, and instant delivery.

### 2.3 Real-Time Messaging Engine
- **Instant Delivery**: Messages appear in real-time on both sides without manual polling.
- **Message Status Receipts**:
  - `Sent` (single checkmark)
  - `Delivered` (double checkmark, gray)
  - `Read` (double checkmark, blue)
- **Optimistic Rendering**: Local client registers messages immediately, displaying a pending status (e.g., clock icon) until confirmed by the server.

### 2.4 Media & Attachment Sharing
- **Interactive File Uploads**: Support for drag-and-drop or file selector uploads.
- **Images**: Rendered as rich media cards inside the chat bubble with fully functional lightbox expand views.
- **Audio Messages**: Simulated or recorded voice clips with inline audio player controls (play/pause, progress bar).

### 2.5 Status Updates (Stories)
- **Status Drawer / Feed**: Dedicated drawer or modal mimicking the mobile "Status" screen.
- **Creation**: Users can publish text statuses (with customizable solid background colors) or upload image statuses.
- **Expiration**: Statuses are short-lived and expire automatically after 24 hours (tracked on the backend).
- **View Tracker**: Displays who viewed the current user's status.

---

## 3. Non-Functional & UI/UX Requirements
- **High Fidelity UI**: Clean, modern WhatsApp Web design featuring dark/light aesthetic pairing (modern slate styling, elegant typography, exact spacing, and custom-styled checkmarks).
- **Smooth Animations**: Motion-based layout transitions using `motion/react` for drawer openings, message entries, and status transitions.
- **Mobile Responsiveness**: Adaptive dual-column layout (sidebar list + chat detail window) collapsing to single-column on mobile viewports.
- **High-Quality Audio Feedback**: Subtle audio tones for incoming/outgoing messages.
