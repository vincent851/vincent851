import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FacebookClient } from "../facebook-client.js";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function mockFetch(responseBody: object, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Bad Request",
    json: () => Promise.resolve(responseBody),
  });
}

describe("FacebookClient", () => {
  let client: FacebookClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new FacebookClient({ accessToken: "test_token_123" });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── URL construction & auth ──────────────────────────────────────────

  it("includes access_token in every request", async () => {
    const fetchMock = mockFetch({ id: "1", name: "Test" });
    globalThis.fetch = fetchMock;

    await client.getMe();

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("access_token")).toBe("test_token_123");
  });

  it("builds correct base URL for Graph API", async () => {
    const fetchMock = mockFetch({ id: "1" });
    globalThis.fetch = fetchMock;

    await client.getMe();

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe(`${GRAPH_API_BASE}/me`);
  });

  // ── GET requests ─────────────────────────────────────────────────────

  it("getMe passes fields parameter", async () => {
    const fetchMock = mockFetch({ id: "1", name: "Test" });
    globalThis.fetch = fetchMock;

    await client.getMe("id,name,birthday");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("fields")).toBe("id,name,birthday");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("getMe uses default fields when none provided", async () => {
    const fetchMock = mockFetch({ id: "1" });
    globalThis.fetch = fetchMock;

    await client.getMe();

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("fields")).toBe("id,name,email");
  });

  it("getPages calls /me/accounts", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getPages();

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/me/accounts");
  });

  it("getPageDetails calls /{pageId}", async () => {
    const fetchMock = mockFetch({ id: "page123", name: "My Page" });
    globalThis.fetch = fetchMock;

    await client.getPageDetails("page123");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/page123");
  });

  it("getUserPosts calls /me/posts with limit", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getUserPosts("5");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/me/posts");
    expect(calledUrl.searchParams.get("limit")).toBe("5");
  });

  it("getPagePosts calls /{pageId}/posts", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getPagePosts("page456", "3");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/page456/posts");
    expect(calledUrl.searchParams.get("limit")).toBe("3");
  });

  it("getComments calls /{objectId}/comments", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getComments("post789", "10");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/post789/comments");
    expect(calledUrl.searchParams.get("limit")).toBe("10");
  });

  it("getLikes calls /{objectId}/likes", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getLikes("post789");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/post789/likes");
  });

  it("getPhotos calls /{targetId}/photos with type=uploaded", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getPhotos("me", "5");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/me/photos");
    expect(calledUrl.searchParams.get("type")).toBe("uploaded");
  });

  it("getPageInsights calls /{pageId}/insights with metric and period", async () => {
    const fetchMock = mockFetch({ data: [] });
    globalThis.fetch = fetchMock;

    await client.getPageInsights("page123", "page_impressions", "week");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/page123/insights");
    expect(calledUrl.searchParams.get("metric")).toBe("page_impressions");
    expect(calledUrl.searchParams.get("period")).toBe("week");
  });

  // ── POST requests ────────────────────────────────────────────────────

  it("createPost sends POST with message body", async () => {
    const fetchMock = mockFetch({ id: "new_post_id" });
    globalThis.fetch = fetchMock;

    await client.createPost("Hello world!");

    const [url, options] = fetchMock.mock.calls[0];
    const calledUrl = new URL(url as string);
    expect(calledUrl.pathname).toBe("/v21.0/me/feed");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ message: "Hello world!" });
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("createPost includes link when provided", async () => {
    const fetchMock = mockFetch({ id: "new_post_id" });
    globalThis.fetch = fetchMock;

    await client.createPost("Check this out", "me", "https://example.com");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({ message: "Check this out", link: "https://example.com" });
  });

  it("createPost targets a specific page when targetId given", async () => {
    const fetchMock = mockFetch({ id: "post_id" });
    globalThis.fetch = fetchMock;

    await client.createPost("Page post", "page123");

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/v21.0/page123/feed");
  });

  it("createComment sends POST to /{objectId}/comments", async () => {
    const fetchMock = mockFetch({ id: "comment_id" });
    globalThis.fetch = fetchMock;

    await client.createComment("post123", "Nice post!");

    const [url, options] = fetchMock.mock.calls[0];
    const calledUrl = new URL(url as string);
    expect(calledUrl.pathname).toBe("/v21.0/post123/comments");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ message: "Nice post!" });
  });

  it("createLike sends POST to /{objectId}/likes", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.createLike("post123");

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post123/likes");
    expect(options.method).toBe("POST");
  });

  // ── DELETE requests ──────────────────────────────────────────────────

  it("deletePost sends DELETE to /{postId}", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.deletePost("post_to_delete");

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post_to_delete");
    expect(options.method).toBe("DELETE");
  });

  it("deleteLike sends DELETE to /{objectId}/likes", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.deleteLike("post123");

    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url as string).pathname).toBe("/v21.0/post123/likes");
    expect(options.method).toBe("DELETE");
  });

  // ── Error handling ───────────────────────────────────────────────────

  it("throws on API error with message from response", async () => {
    const fetchMock = mockFetch(
      { error: { message: "Invalid OAuth access token.", type: "OAuthException" } },
      400
    );
    globalThis.fetch = fetchMock;

    await expect(client.getMe()).rejects.toThrow(
      "Facebook API error (400): Invalid OAuth access token."
    );
  });

  it("throws with statusText when error response is not JSON-parseable", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(client.getMe()).rejects.toThrow(
      "Facebook API error (500): Internal Server Error"
    );
  });

  it("returns parsed JSON on success", async () => {
    const expected = { id: "123", name: "Test User" };
    globalThis.fetch = mockFetch(expected);

    const result = await client.getMe();
    expect(result).toEqual(expected);
  });

  // ── No body on non-POST ──────────────────────────────────────────────

  it("does not send body on DELETE requests", async () => {
    const fetchMock = mockFetch({ success: true });
    globalThis.fetch = fetchMock;

    await client.deletePost("post123");

    const options = fetchMock.mock.calls[0][1];
    expect(options.body).toBeUndefined();
    expect(options.headers).toBeUndefined();
  });
});
