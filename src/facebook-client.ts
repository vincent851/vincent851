const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

export interface FacebookClientConfig {
  accessToken: string;
}

export interface GraphAPIResponse {
  data?: unknown[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
    previous?: string;
  };
  [key: string]: unknown;
}

export class FacebookClient {
  private accessToken: string;

  constructor(config: FacebookClientConfig) {
    this.accessToken = config.accessToken;
  }

  private async request(
    endpoint: string,
    params: Record<string, string> = {},
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: Record<string, unknown>
  ): Promise<GraphAPIResponse> {
    const url = new URL(`${GRAPH_API_BASE}${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const options: RequestInit = { method };
    if (body && method === "POST") {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(
        `Facebook API error (${response.status}): ${(error as { error?: { message?: string } }).error?.message ?? response.statusText}`
      );
    }
    return response.json() as Promise<GraphAPIResponse>;
  }

  // User profile
  async getMe(fields: string = "id,name,email"): Promise<GraphAPIResponse> {
    return this.request("/me", { fields });
  }

  // Pages
  async getPages(): Promise<GraphAPIResponse> {
    return this.request("/me/accounts", {
      fields: "id,name,access_token,category,fan_count",
    });
  }

  async getPageDetails(
    pageId: string,
    fields: string = "id,name,about,category,fan_count,website,phone,emails,location"
  ): Promise<GraphAPIResponse> {
    return this.request(`/${pageId}`, { fields });
  }

  // Posts
  async getUserPosts(
    limit: string = "10",
    fields: string = "id,message,created_time,permalink_url,type,shares,likes.summary(true),comments.summary(true)"
  ): Promise<GraphAPIResponse> {
    return this.request("/me/posts", { fields, limit });
  }

  async getPagePosts(
    pageId: string,
    limit: string = "10",
    fields: string = "id,message,created_time,permalink_url,type,shares,likes.summary(true),comments.summary(true)"
  ): Promise<GraphAPIResponse> {
    return this.request(`/${pageId}/posts`, { fields, limit });
  }

  async createPost(
    message: string,
    targetId: string = "me",
    link?: string
  ): Promise<GraphAPIResponse> {
    const body: Record<string, unknown> = { message };
    if (link) body.link = link;
    return this.request(`/${targetId}/feed`, {}, "POST", body);
  }

  async deletePost(postId: string): Promise<GraphAPIResponse> {
    return this.request(`/${postId}`, {}, "DELETE");
  }

  // Comments
  async getComments(
    objectId: string,
    limit: string = "25",
    fields: string = "id,message,from,created_time,like_count,comment_count"
  ): Promise<GraphAPIResponse> {
    return this.request(`/${objectId}/comments`, { fields, limit });
  }

  async createComment(
    objectId: string,
    message: string
  ): Promise<GraphAPIResponse> {
    return this.request(`/${objectId}/comments`, {}, "POST", { message });
  }

  // Likes
  async getLikes(
    objectId: string,
    limit: string = "25"
  ): Promise<GraphAPIResponse> {
    return this.request(`/${objectId}/likes`, {
      fields: "id,name",
      limit,
    });
  }

  async createLike(objectId: string): Promise<GraphAPIResponse> {
    return this.request(`/${objectId}/likes`, {}, "POST");
  }

  async deleteLike(objectId: string): Promise<GraphAPIResponse> {
    return this.request(`/${objectId}/likes`, {}, "DELETE");
  }

  // Photos
  async getPhotos(
    targetId: string = "me",
    limit: string = "10",
    fields: string = "id,name,picture,source,created_time,album"
  ): Promise<GraphAPIResponse> {
    return this.request(`/${targetId}/photos`, { fields, limit, type: "uploaded" });
  }

  // Page insights
  async getPageInsights(
    pageId: string,
    metric: string = "page_impressions,page_engaged_users,page_fan_adds",
    period: string = "day"
  ): Promise<GraphAPIResponse> {
    return this.request(`/${pageId}/insights`, { metric, period });
  }
}
