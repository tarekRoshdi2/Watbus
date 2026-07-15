# Technology Stack & Skills Mandates - WhatsApp System

## 1. Approved Technology Stack

### 1.1 Client-Side (Frontend)
- **Framework**: React 19.0.1
- **Bundler / Dev Server**: Vite 6.2.3
- **Styling**: Tailwind CSS v4.1.14 (utilizing standard `@import "tailwindcss";` in global CSS)
- **Animations**: `motion` (from `motion/react`) for layout and modal animations.
- **Icons**: `lucide-react` (version ^0.546.0).
- **Audio Effects**: Built-in Web Audio API or custom standard `<audio>` elements for sound cues.

### 1.2 Server-Side (Backend)
- **Runtime Environment**: Node.js
- **Server Framework**: Express 4.21.2
- **Real-Time Layer**: Standard Node WS WebSocket (`ws`) (Requires installation).
- **Execution Engine**: `tsx` (TypeScript Execute) for developer live execution on port `3000`.
- **Bundler**: `esbuild` for production-ready bundle output in `dist/server.cjs`.

---

## 2. Coding Standards & Mandates

### 2.1 TypeScript & Type Safety
- **Strict Typing**: Absolutely NO `any`. Use `unknown` or specific interfaces for incoming WebSocket payloads.
- **Utility Declarations**: Define shared data structures and types early in `src/types.ts`.
- **Strict Enums**: Use standard typescript `enum` blocks instead of `const enum` for seamless bundle compatibility.
- **Top-Level Imports**: Place all module import statements at the very top of each file. Avoid conditional or dynamic imports unless absolutely necessary.

### 2.2 React & Architectural Best Practices
- **Functional Components Only**: Use hooks and functional components exclusively. Do not create class components.
- **Hooks & Rendering Safety**:
  - Guard `useEffect` loops with stable dependency arrays.
  - Never trigger infinite re-renders by setting raw objects or local state directly in component render pipelines.
- **Modularity over Bloat**: Do not pack all frontend components inside `App.tsx`. Create structured sub-components in `src/components/` (e.g., `ChatArea.tsx`, `Sidebar.tsx`, `StatusFeed.tsx`, `AuthView.tsx`, `MediaLightbox.tsx`).

### 2.3 Visual Polish & CSS Guidelines
- **Tailwind-Only**: Use inline utility classes. Do not use custom inline `style` tags or external CSS files.
- **Aesthetic Direction**: Classic light theme paired with modern emerald/teal offsets. Crisp typography (Inter display styles and JetBrains Mono for status counters). High contrast design with comfortable padding.
- **Responsive Layout**: Support horizontal layouts on desktop and transform to a clean single column drawer-based layout on mobile viewports.
