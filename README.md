# MCP Facebook Server

An MCP (Model Context Protocol) server that connects to the Facebook Graph API, allowing AI assistants to interact with Facebook on your behalf.

## Setup

### 1. Get a Facebook Access Token

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Create or select a Facebook App
3. Generate an access token with the permissions you need:
   - `public_profile`, `email` — for basic profile info
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` — for Page management
   - `pages_read_user_content` — for reading Page content
   - `publish_to_groups` — for posting to groups

### 2. Install & Build

```bash
npm install
npm run build
```

### 3. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "facebook": {
      "command": "node",
      "args": ["/path/to/mcp-facebook-server/dist/index.js"],
      "env": {
        "FACEBOOK_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Get the authenticated user's profile |
| `get_pages` | List Pages you manage |
| `get_page_details` | Get details of a specific Page |
| `get_posts` | Get posts from your timeline or a Page |
| `create_post` | Create a new post |
| `delete_post` | Delete a post |
| `get_comments` | Get comments on a post |
| `create_comment` | Comment on a post |
| `get_likes` | Get likes on a post |
| `like_object` | Like a post or comment |
| `unlike_object` | Remove a like |
| `get_photos` | Get uploaded photos |
| `get_page_insights` | Get Page analytics |
