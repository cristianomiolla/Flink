# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Skunk** is a React-based tattoo artist marketplace application. The application uses a distinctive "brutalist" design with bold typography, high contrast colors (primarily red, black, and white), and angled/rotated elements.

## Key Technologies & Architecture

- **Frontend**: React 19.1 with TypeScript
- **Routing**: React Router DOM 7.8.2
- **Backend/Database**: Supabase (project-ref: shzouqqrxebzrqtkynqg)
- **Build Tool**: Vite 7.1.2
- **Styling**: Individual CSS files per component + centralized design tokens (src/styles/tokens.css)
- **Type System**: TypeScript 5.8.3 with strict configuration 
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins
- **MCP Integration**: Supabase MCP server configured for read-only access

## Development Commands

```bash
# Start development server (default port 5173)
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Supabase Integration

The project is configured with Supabase for backend services:
- **Project URL**: `https://shzouqqrxebzrqtkynqg.supabase.co`
- **Project ID**: `shzouqqrxebzrqtkynqg`
- **Personal Access Token**: `sbp_56085e56561c1523223215a793e993afe0ef1f2f`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoem91cXFyeGVienJxdGt5bnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDc3MjksImV4cCI6MjA3MTUyMzcyOX0.vWu0hP3sQqVQCXwG1SsGadCnzCVy3DCgdgbemxFogWQ`
- **Client Configuration**: Located in `src/lib/supabase.ts`
- **Environment Variables**: Configured in `.env.local`
- **MCP Server**: Configured for read-only database access through Claude Code

### Database Schema

#### Table: `profiles`
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT,
    profile_type TEXT NOT NULL DEFAULT 'client' CHECK (profile_type IN ('client', 'artist')),
    bio TEXT,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Table: `portfolio_items`
```sql
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    tags TEXT[],  -- Array of tags
    is_flash BOOLEAN DEFAULT false,
    price DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Indexes
```sql
-- Portfolio items indexes
CREATE INDEX idx_portfolio_user_id ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_created_at ON portfolio_items(created_at DESC);
CREATE INDEX idx_portfolio_is_flash ON portfolio_items(is_flash);
CREATE INDEX idx_portfolio_tags ON portfolio_items USING GIN(tags);

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_profile_type ON profiles(profile_type);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_active ON messages(deleted_at) WHERE deleted_at IS NULL;
```

#### RLS Policies
```sql
-- Profiles
CREATE POLICY "Public can view all profiles" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (true);

-- Portfolio items
CREATE POLICY "Public can view portfolio items" ON portfolio_items FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert portfolio items" ON portfolio_items FOR INSERT TO authenticated WITH CHECK (true);

-- Messages
CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

#### Table: `saved_tattoos`
```sql
CREATE TABLE saved_tattoos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, portfolio_item_id)
);
```

#### Table: `messages`
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL
);
```

#### Relationships
- `portfolio_items.user_id` → `profiles.user_id` (Foreign Key)
- `saved_tattoos.user_id` → `auth.users.id` (Foreign Key)
- `saved_tattoos.portfolio_item_id` → `portfolio_items.id` (Foreign Key)
- `messages.sender_id` → `auth.users.id` (Foreign Key)
- `messages.receiver_id` → `auth.users.id` (Foreign Key)
- Both portfolio and profile tables have RLS enabled with public read access
- Messages table has RLS enabled with user-specific read/write access
- Artists are identified by `profiles.profile_type = 'artist'`
- Saved items are ordered by `saved_tattoos.created_at` for chronological display
- Messages are ordered by `messages.created_at` for chronological conversations

### Supabase Client Usage
```typescript
import { supabase } from '@/lib/supabase'

// Portfolio items with artist profiles (usePortfolioSearch.ts)
const { data: portfolioData, error } = await supabase
  .from('portfolio_items')
  .select(`
    *,
    profiles!inner(
      user_id,
      full_name,
      username,
      profile_type,
      bio,
      location
    )
  `)
  .eq('profiles.profile_type', 'artist')
  .order('created_at', { ascending: false })
  .limit(50)

// Saved items ordered by save date (SavedItemsPage.tsx)
const { data: savedData, error: savedError } = await supabase
  .from('saved_tattoos')
  .select('portfolio_item_id, created_at')
  .in('portfolio_item_id', savedIds)
  .order('created_at', { ascending: false })
```

### Database Migration Guidelines

When making code changes that require database modifications:

1. **Create SQL scripts** in the project root with descriptive names
2. **Test scripts** thoroughly before applying to production  
3. **Update this documentation** with new schema changes
4. **Apply scripts** via Supabase SQL Editor

**Migration Scripts Location**: See `database-migration-scripts.md` for examples and templates.

**Current Migration Scripts**:
- `rebuild-database-simple.sql` - Complete database recreation
- `database-migration-scripts.md` - Templates for common changes

## Design System & Styling

The application follows a **brutalist design aesthetic** with:
- **Colors**: Primarily red (#EF4343), black (#171717), and white
- **Typography**: Chakra Petch font family with bold, uppercase text
- **Design Tokens**: Centralized in `src/styles/tokens.css` with CSS custom properties
- **Layout**: Zero border radius for brutalist aesthetic, with shadow effects for depth
- **Components**: Individual CSS files per component importing from the design token system

## Application Architecture

The app follows a modular React architecture with authentication and state management:

### Core Architecture
- **Authentication**: Context-based with `AuthProvider` wrapping the entire app
- **Routing**: React Router DOM with BrowserRouter in main.tsx
- **State Management**: Custom hooks (`usePortfolioSearch`, `useAuth`, `useSavedTattoos`) for data fetching and state
- **Component Structure**: Separation between container components and presentational components
- **Data Flow**: Optimized Supabase JOIN queries for portfolio items with artist profile data
- **Authentication Flow**: Action buttons require authentication - redirect to AuthOverlay when not logged in

### Authentication System
- **AuthContext**: Provides user state, profile data, and auth functions (signIn, signUp, signOut)
- **AuthOverlay**: Modal component for login/registration, managed at page level
- **Protected Actions**: All action buttons (follow, contact, like, save) require authentication
- **Authentication Check**: Components check `user` state and trigger `onAuthRequired` callback when needed

### Key Data Flow & Components

- `App.tsx` - Wraps everything in AuthProvider, renders AppRoutes
- `AppRoutes.tsx` - Route definitions (/, /artist/:artistId, /saved)
- `MainPage.tsx` - Main container with search, category bar, portfolio/artist grids, and AuthOverlay
- `usePortfolioSearch.ts` - Central data management hook:
  - Single Supabase JOIN query fetches portfolio items + artist profiles
  - Client-side filtering with memoized results for performance
  - Manages view mode switching between portfolio and artist directory
  - Provides search/filter state and actions to components
- `SavedItemsPage.tsx` - Displays user's saved tattoos ordered by save date (saved_tattoos.created_at)
- `useSavedTattoos.ts` - Manages saved tattoo state and operations
- `ActionButton.tsx` - Reusable button component with authentication integration

### Component Hierarchy & Props Flow
- Action buttons (ActionButton) check authentication and trigger `onAuthRequired` 
- `onAuthRequired` callbacks flow from MainPage → Grid components → Card components → ActionButton
- Authentication state flows down via useAuth hook in individual components
- Modal components (PortfolioModal) also receive and use `onAuthRequired` for their action buttons

### Data Types & TypeScript Architecture

The app uses TypeScript interfaces defined in `src/types/portfolio.ts`:
- `DatabasePortfolioItem` - Raw Supabase portfolio item data structure
- `PortfolioItem` - Extended interface with artist information merged  
- `DatabaseProfile`/`ArtistProfile` - User profile types with artist specialization
- `ViewMode` - Union type for 'portfolio' | 'artists' view modes
- `TabType` - Union type for portfolio tabs (portfolio, servizi, flash, recensioni)
- `FlashFilter` - Union type for filtering flash vs realized tattoos ('all' | 'flash' | 'realizzati')

**Data Fetching Pattern**: Uses Supabase's JOIN capabilities via `!inner` syntax to fetch related data in single queries, then transforms the nested data structure to flat interfaces for component consumption.

## Important Notes

- **Authentication**: All action buttons (class="action-btn") require authentication - implement `requiresAuth` and `onAuthRequired` props
- **Supabase Integration**: Always use the Supabase MCP server for database operations when available
- **Design System**: Follow brutalist design principles with red/black/white color scheme and design tokens from `src/styles/tokens.css`
- **TypeScript**: Use strict typing - all interfaces are defined in `src/types/portfolio.ts`
- **Data Queries**: Use optimized Supabase JOIN queries, transform nested results to flat component interfaces
- **Saved Items**: Order by `saved_tattoos.created_at` (not `portfolio_items.created_at`) for chronological user experience