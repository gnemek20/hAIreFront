import { AgentType, AgentDetailType } from "@/types/agentTypes";
import { ChatHistory } from "@/types/chatTypes";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor (message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
};

export const apiFetch = async <T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => {
  const res = await fetch(input, init);

  let data: any = null;
  try {
    data = await res.json();
  }
  catch {}

  if (!res.ok) {
    let message = "Request failed";

    if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((d: any) => d.msg ?? JSON.stringify(d))
        .join(", ");
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    }

    throw new ApiError(message, res.status, data);
  }

  return data as T;
};

// ── Agent Server APIs ──

export const agentApi = {
  /** GET /api/agents */
  getAgents: () =>
    apiFetch<{ agents: AgentType[] }>(
      `${process.env.NEXT_PUBLIC_AGENT_SERVER}/api/agents`
    ),

  /** GET /api/agents/:slug */
  getAgentDetail: (slug: string) =>
    apiFetch<{ agent: Omit<AgentDetailType, "slug">; model_card: string }>(
      `${process.env.NEXT_PUBLIC_AGENT_SERVER}/api/agents/${slug}`
    ),

  /** POST /api/deploy (multipart) */
  deploy: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ status: "deployed" } & AgentType>(
      `${process.env.NEXT_PUBLIC_AGENT_SERVER}/api/deploy`,
      { method: "POST", body: formData }
    );
  },

  /** DELETE /api/agents/:slug */
  deleteAgent: (slug: string) =>
    apiFetch<{ status: "deleted" }>(
      `${process.env.NEXT_PUBLIC_AGENT_SERVER}/api/agents/${slug}`,
      { method: "DELETE" }
    ),

  /** POST /api/generate-yaml */
  generateYaml: (githubUrl: string) =>
    apiFetch<{
      status: "success";
      yaml: string;
      analysis: string;
      source: "generated" | "existing";
      repo: string;
      branch: string;
      files_analyzed: number;
    }>(
      `${process.env.NEXT_PUBLIC_AGENT_SERVER}/api/generate-yaml`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: githubUrl }),
      }
    ),
};

// ── User Server APIs ──

export const userApi = {
  /** POST /signin */
  signIn: (id: string, pwd: string) =>
    apiFetch<{ access_token: string; username: string }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/signin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pwd }),
      }
    ),

  /** POST /signup */
  signUp: (id: string, pwd: string, username: string) =>
    apiFetch<unknown>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pwd, username }),
      }
    ),

  /** POST /users/subscriptions/list */
  getSubscriptions: (token: string) =>
    apiFetch<{ subscriptions: AgentType["slug"][] }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/subscriptions/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      }
    ),

  /** POST /users/subscriptions */
  subscribe: (token: string, slugs: string[]) =>
    apiFetch<{ status: string }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/subscriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, subscriptions: slugs }),
      }
    ),

  /** DELETE /users/subscriptions */
  unsubscribe: (token: string, slug: string) =>
    apiFetch<{ status: "success" }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/subscriptions`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, slug }),
      }
    ),

  /** POST /users/agents/list */
  getUserAgents: (token: string) =>
    apiFetch<{ status: "success"; agents: AgentType[] }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/agents/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      }
    ),

  /** POST /users/agents */
  postUserAgent: (token: string, agent: AgentType) =>
    apiFetch<
      | { status: "success"; inserted: true; agend_id: string }
      | { status: "success"; inserted: false; message: string }
    >(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/agents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, agent }),
      }
    ),

  /** DELETE /users/agents */
  deleteUserAgent: (token: string, agent: AgentType) =>
    apiFetch<{ status: string }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/agents`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, agent }),
      }
    ),

  /** POST /users/chat/history */
  getChatHistory: (token: string, slug: string) =>
    apiFetch<{ status: string; chat_history: ChatHistory }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/chat/history`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, slug }),
      }
    ),

  /** POST /users/chat/save */
  saveChatHistory: (token: string, slug: string, chatHistory: ChatHistory) =>
    apiFetch<{ status: string; detail?: string }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/chat/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, slug, chat_history: chatHistory }),
      }
    ),
};