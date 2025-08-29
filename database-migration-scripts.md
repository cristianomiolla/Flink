# Database Context & Migration Scripts

## Current Database Structure

### Core Tables
- **profiles**: User profiles with artist/client roles
- **portfolio_items**: Portfolio items linked to artist profiles

### Database Connection & MCP Integration
- **Project ID**: `shzouqqrxebzrqtkynqg` 
- **URL**: `https://shzouqqrxebzrqtkynqg.supabase.co`
- **MCP Server**: Configured for read-only database access through Claude Code
- **Client Config**: Located in `src/lib/supabase.ts`

### Migration Scripts
- **`optimized-database.sql`**: Complete database recreation with optimized indexes and sample data
- Apply via Supabase SQL Editor: https://supabase.com/dashboard/project/shzouqqrxebzrqtkynqg