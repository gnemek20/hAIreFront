import { Agent, AgentDetail } from "@/types/agent";
import { ChatHistory } from "@/types/chat";

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
  const res = await fetch(input, {
    ...init,
    headers: {
      "ngrok-skip-browser-warning": "69420",
      ...init?.headers,
    },
  });

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

// ── [TEMP-FALLBACK] ngrok 서버 장애 시 fly.io로 폴백하는 헬퍼 ──
// TODO: ngrok 단일 서버 운영 확정 시 이 함수를 제거하고 agentApi 내부를 apiFetch 직접 호출로 복원
const AGENT_PRIMARY = process.env.NEXT_PUBLIC_AGENT_SERVER!;
const AGENT_FALLBACK = process.env.NEXT_PUBLIC_AGENT_SERVER_FALLBACK ?? "";

const agentFetchWithFallback = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  try {
    return await apiFetch<T>(`${AGENT_PRIMARY}${path}`, init);
  } catch (error) {
    if (!AGENT_FALLBACK) throw error;
    // 네트워크 에러(서버 응답 없음)일 때만 폴백. ApiError(서버가 응답한 에러)는 그대로 throw
    if (error instanceof ApiError) throw error;
    console.warn(`[TEMP-FALLBACK] ngrok unreachable, falling back to fly.io for ${path}`);
    return await apiFetch<T>(`${AGENT_FALLBACK}${path}`, init);
  }
};

// TODO: [TEMP-FALLBACK] WebSocket 폴백용 URL 선택 헬퍼
export const getAgentWsBaseURL = async (): Promise<string> => {
  try {
    await fetch(`${AGENT_PRIMARY}/health`, {
      headers: { "ngrok-skip-browser-warning": "69420" },
      signal: AbortSignal.timeout(5000),
    });
    return AGENT_PRIMARY;
  } catch {
    if (!AGENT_FALLBACK) return AGENT_PRIMARY;
    console.warn("[TEMP-FALLBACK] ngrok unreachable, WebSocket will use fly.io");
    return AGENT_FALLBACK;
  }
};
// ── [/TEMP-FALLBACK] ──

/** POST /api/deploy 응답 (Agent Server 레퍼런스 기준) */
export interface DeployResponse {
  status: "deployed";
  mode: "created" | "updated";
  base_slug: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  price: number;
  icon: string;
  path: string;
  docker_image: string;
  build_log: string;
}

export const agentApi = {
  /** GET /api/agents */
  getAgents: () =>
    agentFetchWithFallback<{ agents: (Agent & { docker_image?: boolean })[] }>(
      `/api/agents`
    ),

  /** GET /api/agents/:slug */
  getAgentDetail: (slug: string) =>
    agentFetchWithFallback<{ agent: Omit<AgentDetail, "slug">; docker_image: boolean; model_card: string }>(
      `/api/agents/${slug}`
    ),

  /** POST /api/deploy (multipart) */
  deploy: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return agentFetchWithFallback<DeployResponse>(
      `/api/deploy`,
      { method: "POST", body: formData }
    );
  },

  /** DELETE /api/agents/:slug */
  deleteAgent: (slug: string) =>
    agentFetchWithFallback<{ status: "deleted" }>(
      `/api/agents/${slug}`,
      { method: "DELETE" }
    ),

  /** POST /api/generate-yaml */
  generateYaml: (githubUrl: string) =>
    agentFetchWithFallback<{
      status: "success";
      yaml: string;
      analysis: string;
      source: "generated" | "existing";
      repo: string;
      branch: string;
      files_analyzed: number;
    }>(
      `/api/generate-yaml`,
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
    apiFetch<{ subscriptions: Agent["slug"][] }>(
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
    apiFetch<{ status: "success"; agents: Agent[] }>(
      `${process.env.NEXT_PUBLIC_USER_SERVER}/users/agents/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      }
    ),

  /** POST /users/agents */
  postUserAgent: (token: string, agent: Agent) =>
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
  deleteUserAgent: (token: string, agent: Agent) =>
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