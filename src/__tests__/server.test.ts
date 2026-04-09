import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../index.js";
import { FacebookClient } from "../facebook-client.js";

function mockFetch(responseBody: object) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(responseBody),
  });
}

describe("MCP Server", () => {
  let client: Client;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    globalThis.fetch = mockFetch({ id: "1", name: "Test" });

    const fb = new FacebookClient({ accessToken: "test_token" });
    const server = createServer(fb);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("lists all expected tools", async () => {
    const { tools } = await client.listTools();
    const toolNames = tools.map((t) => t.name).sort();

    expect(toolNames).toEqual([
      "create_comment",
      "create_post",
      "delete_post",
      "get_comments",
      "get_likes",
      "get_page_details",
      "get_page_insights",
      "get_pages",
      "get_photos",
      "get_posts",
      "get_profile",
      "like_object",
      "unlike_object",
    ]);
  });

  it("get_profile tool returns formatted JSON", async () => {
    const profileData = { id: "123", name: "John Doe", email: "john@example.com" };
    globalThis.fetch = mockFetch(profileData);

    const result = await client.callTool({ name: "get_profile", arguments: {} });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");
    expect(JSON.parse(content[0].text)).toEqual(profileData);
  });

  it("get_profile tool accepts optional fields", async () => {
    const fetchMock = mockFetch({ id: "123" });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "get_profile",
      arguments: { fields: "id,name" },
    });

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("fields")).toBe("id,name");
  });

  it("get_posts tool fetches user posts when no page_id", async () => {
    const fetchMock = mockFetch({ data: [{ id: "post1" }] });
    globalThis.fetch = fetchMock;

    await client.callTool({ name: "get_posts", arguments: {} });

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/me/posts");
  });

  it("get_posts tool fetches page posts when page_id provided", async () => {
    const fetchMock = mockFetch({ data: [{ id: "post1" }] });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "get_posts",
      arguments: { page_id: "page456" },
    });

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/page456/posts");
  });

  it("create_post tool sends message via POST", async () => {
    const fetchMock = mockFetch({ id: "new_post" });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "create_post",
      arguments: { message: "Hello from MCP!" },
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/me/feed");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string).message).toBe("Hello from MCP!");
  });

  it("create_comment tool posts comment to correct object", async () => {
    const fetchMock = mockFetch({ id: "comment_id" });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "create_comment",
      arguments: { object_id: "post999", message: "Great!" },
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post999/comments");
    expect(JSON.parse(options.body as string).message).toBe("Great!");
  });

  it("delete_post tool sends DELETE request", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "delete_post",
      arguments: { post_id: "post_to_delete" },
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post_to_delete");
    expect(options.method).toBe("DELETE");
  });

  it("like_object tool sends POST to likes endpoint", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "like_object",
      arguments: { object_id: "post123" },
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post123/likes");
    expect(options.method).toBe("POST");
  });

  it("unlike_object tool sends DELETE to likes endpoint", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.callTool({
      name: "unlike_object",
      arguments: { object_id: "post123" },
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post123/likes");
    expect(options.method).toBe("DELETE");
  });

  it("tools return error content on API failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () =>
        Promise.resolve({
          error: { message: "Invalid access token" },
        }),
    });

    const result = await client.callTool({ name: "get_profile", arguments: {} });

    expect(result.isError).toBe(true);
  });
});
