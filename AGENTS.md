# AGENTS.md - Bolão Copa 2026

This file provides guidance for agentic coding agents working in this repository.

## Project Overview

- **Type**: React + TypeScript + Vite + Tailwind CSS web application (PWA)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Purpose**: Football betting pool for Copa 2026 World Cup
- **Target**: Mobile-first PWA (iOS/Safari and Android)

## Build / Lint / Test Commands

### Development
```bash
npm run dev          # Start Vite dev server
```

### Build
```bash
npm run build        # TypeScript check + Vite build
```

### Linting
```bash
npm run lint         # Run ESLint on entire codebase
```

### Preview
```bash
npm run preview      # Preview production build locally
```

### Testing
No test framework is currently configured. When adding tests, use:
```bash
# For Vitest
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:run     # Run tests once (CI mode)
```

### Type Checking
```bash
tsc -b               # TypeScript build/check (included in build)
```

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Code Style Guidelines

### General

- Use TypeScript with strict mode enabled
- Prefer functional components and hooks over class components
- Keep components small and focused (single responsibility)
- Use descriptive variable and function names in Portuguese or English (be consistent)

### Imports

- Use absolute imports from root (e.g., `src/pages/Home` instead of `../pages/Home`)
- Group imports in this order:
  1. React / External libraries
  2. Internal absolute imports (src/*)
  3. Relative imports
- Example:
```tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import Home from '@/pages/Home';
```

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings in JS/TS
- Add trailing commas in multiline arrays and objects
- Maximum line length: 100 characters (soft limit)
- Use Prettier for formatting (integrated via ESLint)

### Types

- Always define explicit types for props, state, and function parameters
- Use `type` for object types, `interface` for component props
- Avoid `any` - use `unknown` when type is truly unknown
- Example:
```tsx
type UserData = {
  id: string;
  name: string;
  points: number;
};

interface UserCardProps {
  user: UserData;
  isCurrentUser: boolean;
}
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserCard`, `BottomNav`)
- **Hooks**: camelCase starting with `use` (e.g., `useAuth`, `useFetch`)
- **Types/Interfaces**: PascalCase (e.g., `AuthContextType`)
- **Files**: kebab-case for components (e.g., `user-card.tsx`), camelCase for utilities
- **CSS Classes**: Tailwind utility classes (see below)

### Tailwind CSS

- Use the custom color palette defined in `tailwind.config.js`:
  - Primary: `bola-green` (#0A7C4E)
  - Secondary: `bola-gold` (#9A6D08)
  - Danger: `bola-red` (#C0392B)
  - Background: `bola-bg` (#F5F3EE)
  - Muted text: `bola-muted` (#7A7768)
- Use `font-display` for headings (Bebas Neue)
- Use `font-mono` for numbers/stats
- Use `font-sans` for body text (DM Sans)
- Mobile-first: design for 375px first, then scale up
- Max width for main content: `max-w-md` (428px)

### Component Structure

Follow this pattern for components:
```tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SomeType } from '@/types';

interface ComponentProps {
  title: string;
  onSubmit: (data: SomeType) => void;
}

export default function Component({ title, onSubmit }: ComponentProps) {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // effect logic
  }, []);

  const handleAction = async () => {
    // handler logic
  };

  return (
    <div className="flex flex-col gap-4">
      {/* JSX */}
    </div>
  );
}
```

### Error Handling

- Use `console.error` for logging errors in development
- Handle Supabase errors explicitly:
```tsx
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error('Error fetching data:', error);
  return;
}
```

### React Hooks

- Always include all dependencies in dependency arrays
- Prefer `useCallback` for event handlers passed to child components
- Prefer `useMemo` for expensive calculations
- Use `useEffect` cleanup functions for subscriptions

### Supabase Patterns

- Use typed queries with TypeScript
- Example with joins:
```tsx
const { data } = await supabase
  .from('leaderboard')
  .select(`
    user_id,
    points,
    user:user_id ( name, avatar_url )
  `)
  .order('points', { ascending: false });
```

### File Organization

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utilities (supabase client, etc.)
├── pages/          # Route pages
├── layout/         # Layout components (BottomNav, etc.)
├── types/          # Shared TypeScript types
└── main.tsx        # Entry point
```

### Git Conventions

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- Create feature branches for new features
- Run `npm run lint` before committing
- Never commit secrets or `.env` files

### Browser Support

- Target modern browsers (last 2 versions)
- Support iOS Safari 14+ and Chrome for Android
- Use PWA features for offline support

## Cursor / Copilot Rules

No existing Cursor or Copilot rules found in `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md`.
