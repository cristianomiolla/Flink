# Security Guidelines

## Environment Variables

This project uses environment variables to store sensitive configuration. Never commit actual credentials to the repository.

### Required Environment Variables

Create a `.env.local` file in the project root with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### MCP Configuration

For Claude Code integration, create a `.mcp.json` file based on `.mcp.json.template`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

## Privacy & Data Protection

- No user data is logged to console in production
- All error messages are sanitized to avoid exposing sensitive information
- User emails are only used for authentication and avatar initials
- Full names are only stored and displayed where explicitly needed

## Files Ignored by Git

The following files containing secrets are automatically ignored:

- `.env*` (all environment files)
- `.mcp.json` (MCP server configuration)
- `*.local` (local configuration files)

## Security Best Practices

1. Never commit credentials or API keys
2. Use environment variables for all sensitive configuration
3. Sanitize all error messages before logging
4. Validate all user inputs
5. Use HTTPS for all external requests
6. Keep dependencies updated