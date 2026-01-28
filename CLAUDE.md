# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, Claude generates React code in real-time, and a split-screen preview shows the result. Users can iterate through chat, edit code directly, and persist projects when authenticated.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: Prisma + SQLite
- **AI**: Anthropic Claude API via Vercel AI SDK
- **Editor**: Monaco Editor
- **UI**: Radix UI primitives

## Commands

```bash
# Setup (first time)
npm run setup                  # Install deps + Prisma setup + migrations

# Development
npm run dev                    # Start dev server with Turbopack

# Production
npm run build                  # Production build
npm run start                  # Start production server

# Code Quality
npm run lint                   # ESLint check
npm run test                   # Run vitest tests

# Database
npm run db:reset               # Reset SQLite database (destructive)
```

## Architecture

```
Chat Interface (Left) ─── /api/chat ───▶ Claude AI
       │                                    │
       │                               Uses tools:
       │                               - str_replace_editor
       │                               - file_manager
       │                                    │
       ▼                                    ▼
Virtual File System (in-memory) ◀────── Tool calls
       │
       ▼
Preview Frame (Right) ◀── Babel transform ── Import map generation
```

**Key Flow**:
1. User message → `/api/chat` endpoint
2. Claude receives virtual FS state + chat history
3. Claude calls tools (str_replace_editor, file_manager) to manipulate files
4. Changes streamed back, applied to virtual FS in real-time
5. Preview iframe auto-updates via Babel JSX transformation
6. Authenticated users' projects saved to SQLite

## Key Directories

- `/src/app/` - Next.js pages and API routes
- `/src/lib/` - Core business logic
  - `file-system.ts` - VirtualFileSystem class (in-memory, no disk writes)
  - `contexts/` - React Context providers (chat-context, file-system-context)
  - `tools/` - AI tools (str-replace.ts, file-manager.ts)
  - `transform/` - Babel JSX transformation + import map generation
  - `prompts/` - System prompts for AI generation
- `/src/actions/` - Server Actions (auth, project CRUD)
- `/src/components/` - React components
  - `ui/` - Radix UI + Tailwind styled primitives
  - `chat/` - Chat interface components
  - `editor/` - Monaco editor + file tree
  - `preview/` - Live preview iframe
- `/prisma/` - Database schema and SQLite file

## Important Patterns

**Virtual File System**: All files stored in memory as Map<string, FileNode>. No disk writes. Serializable for persistence.

**AI Tool System**: Claude calls `str_replace_editor` (view/create/edit files) and `file_manager` (rename/delete). Tools operate on VirtualFileSystem instance.

**Code Transformation**: Babel transforms JSX → ES modules, generates blob URLs for local imports, external packages use esm.sh CDN.

**Context Providers**: `ChatProvider` manages messages + AI streaming. `FileSystemProvider` manages virtual FS + processes tool calls.

**Server vs Client**: Use `"use server"` for Server Actions, `"use client"` for interactive components. Server-only imports marked with `import "server-only"`.

## Key Files

| File                                        | Purpose                  |
|---------------------------------------------|--------------------------|
| `/src/app/api/chat/route.ts`                | LLM streaming endpoint   |
| `/src/lib/file-system.ts`                   | Virtual filesystem class |
| `/src/lib/contexts/file-system-context.tsx` | FS state + tool handlers |
| `/src/lib/transform/jsx-transformer.ts`     | Babel + import map       |
| `/src/lib/prompts/generation.tsx`           | AI generation prompt     |
| `/src/app/main-content.tsx`                 | Main layout              |
| `/src/components/preview/PreviewFrame.tsx`  | Live preview iframe      |
| `/prisma/schema.prisma`                     | Database schema (User, Project models) |
| `/vitest.config.mts`                        | Vitest test configuration              |

## Conventions

- Use `@/` path alias for imports (e.g., `@/lib/file-system`)
- Tailwind CSS for all styling (no CSS modules)
- Use `clsx` for conditional class names
- UI components from Radix, styled with Tailwind in `/src/components/ui/`
- Mock provider fallback when `ANTHROPIC_API_KEY` not set
- Use comments sparingly; only comment complex code
- **After significant changes**: Always run `npm run lint` and `npm run test` to verify code quality

## Known Limitations

- Virtual FS: No disk persistence (by design)
- Preview iframe: Restricted sandbox
- CSS imports: Stripped (not executed in preview)
- Third-party packages: Limited to esm.sh CDN availability
- Anonymous work: Lost on page refresh (sessionStorage only)
