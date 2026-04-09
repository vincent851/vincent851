#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FacebookClient } from "./facebook-client.js";

export function createServer(fb: FacebookClient): McpServer {
  const server = new McpServer({
    name: "facebook",
    version: "1.0.0",
  });

  registerTools(server, fb);
  return server;
}

function registerTools(server: McpServer, fb: FacebookClient): void {

server.tool(
  "get_profile",
  "Get the authenticated user's Facebook profile information",
  {
    fields: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of fields (default: id,name,email)"
      ),
  },
  async ({ fields }) => {
    const result = await fb.getMe(fields);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_pages",
  "Get Facebook Pages managed by the authenticated user",
  {},
  async () => {
    const result = await fb.getPages();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_page_details",
  "Get detailed information about a specific Facebook Page",
  {
    page_id: z.string().describe("The Facebook Page ID"),
    fields: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of fields (default: id,name,about,category,fan_count,website,phone,emails,location)"
      ),
  },
  async ({ page_id, fields }) => {
    const result = await fb.getPageDetails(page_id, fields);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_posts",
  "Get posts from the user's timeline or a specific Page",
  {
    page_id: z
      .string()
      .optional()
      .describe("Page ID to get posts from (omit for user's own posts)"),
    limit: z
      .string()
      .optional()
      .describe("Maximum number of posts to return (default: 10)"),
  },
  async ({ page_id, limit }) => {
    const result = page_id
      ? await fb.getPagePosts(page_id, limit)
      : await fb.getUserPosts(limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "create_post",
  "Create a new post on the user's timeline or a Page",
  {
    message: z.string().describe("The post content/message"),
    target_id: z
      .string()
      .optional()
      .describe("Page ID to post to (omit for user's own timeline)"),
    link: z.string().optional().describe("URL to attach to the post"),
  },
  async ({ message, target_id, link }) => {
    const result = await fb.createPost(message, target_id, link);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "delete_post",
  "Delete a specific post",
  {
    post_id: z.string().describe("The ID of the post to delete"),
  },
  async ({ post_id }) => {
    const result = await fb.deletePost(post_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_comments",
  "Get comments on a post or other object",
  {
    object_id: z
      .string()
      .describe("The ID of the post or object to get comments for"),
    limit: z
      .string()
      .optional()
      .describe("Maximum number of comments to return (default: 25)"),
  },
  async ({ object_id, limit }) => {
    const result = await fb.getComments(object_id, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "create_comment",
  "Add a comment to a post or other object",
  {
    object_id: z
      .string()
      .describe("The ID of the post or object to comment on"),
    message: z.string().describe("The comment text"),
  },
  async ({ object_id, message }) => {
    const result = await fb.createComment(object_id, message);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_likes",
  "Get likes on a post or other object",
  {
    object_id: z
      .string()
      .describe("The ID of the post or object to get likes for"),
    limit: z
      .string()
      .optional()
      .describe("Maximum number of likes to return (default: 25)"),
  },
  async ({ object_id, limit }) => {
    const result = await fb.getLikes(object_id, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "like_object",
  "Like a post, comment, or other object",
  {
    object_id: z.string().describe("The ID of the object to like"),
  },
  async ({ object_id }) => {
    const result = await fb.createLike(object_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "unlike_object",
  "Remove a like from a post, comment, or other object",
  {
    object_id: z.string().describe("The ID of the object to unlike"),
  },
  async ({ object_id }) => {
    const result = await fb.deleteLike(object_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_photos",
  "Get photos uploaded by the user or a Page",
  {
    target_id: z
      .string()
      .optional()
      .describe("Page ID to get photos from (omit for user's own photos)"),
    limit: z
      .string()
      .optional()
      .describe("Maximum number of photos to return (default: 10)"),
  },
  async ({ target_id, limit }) => {
    const result = await fb.getPhotos(target_id, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_page_insights",
  "Get analytics/insights for a Facebook Page (requires Page access token)",
  {
    page_id: z.string().describe("The Facebook Page ID"),
    metric: z
      .string()
      .optional()
      .describe(
        "Comma-separated metrics (default: page_impressions,page_engaged_users,page_fan_adds)"
      ),
    period: z
      .string()
      .optional()
      .describe("Aggregation period: day, week, days_28 (default: day)"),
  },
  async ({ page_id, metric, period }) => {
    const result = await fb.getPageInsights(page_id, metric, period);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

} // end registerTools

// ── Start ───────────────────────────────────────────────────────────────

async function main() {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!accessToken) {
    console.error(
      "Error: FACEBOOK_ACCESS_TOKEN environment variable is required.\n" +
        "Get a token from https://developers.facebook.com/tools/explorer/"
    );
    process.exit(1);
  }

  const fb = new FacebookClient({ accessToken });
  const server = createServer(fb);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Facebook MCP server running on stdio");
}

const isMainModule =
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
