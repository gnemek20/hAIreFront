// ── React ──
import { useRef, useState } from "react";

// ── Internal Modules ──
import { ChatMessage } from "@/types/chat";
import { getAgentWsBaseURL } from "@/utils/api";

interface WSMessage {
  type: "output" | "input_request" | "result" | "error" | "done";
  data?: unknown;
  traceback?: string;
}

interface AgentWSHook {
  run: (
    userMessage: ChatMessage,
    slug: string,
    inputName: string,
    logId?: string,
    authCode?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => Promise<void>;
  sendInput: (
    value: string,
    logId?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => void;
  cancel: () => void;
  isRunning: boolean;
  inputRequested: boolean;
}

export function useAgentWebSocket(
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>
): AgentWSHook {
  const wsRef = useRef<WebSocket | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [inputRequested, setInputRequested] = useState(false);

  /** 현재 WebSocket 연결을 정리하고 상태를 초기화한다. */
  const cancel = () => {
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRunning(false);
    setInputRequested(false);
  };

  const handleWSMessage = (
    event: MessageEvent,
    logId?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => {
    const msg: WSMessage = JSON.parse(event.data);

    switch (msg.type) {
      case "output":
        if (typeof msg.data === "string") {
          if (onLog) onLog(msg.data);
        }
        break;

      case "input_request":
        setInputRequested(true);
        break;

      case "result":
        if (onDone) {
          let finalContent: object | undefined;

          if (typeof msg.data === "string") {
            try {
              finalContent = JSON.parse(msg.data);
            } catch {
              finalContent = { value: msg.data };
            }
          } else if (typeof msg.data === "object" && msg.data !== null) {
            finalContent = msg.data;
          }

          onDone(finalContent);
        }
        break;

      case "done":
        setIsRunning(false);
        wsRef.current?.close();
        break;

      case "error":
        console.error(msg.data || msg.traceback);
        setIsRunning(false);
        wsRef.current?.close();
        if (onDone) onDone();
        break;
    }
  };

  const run = async (
    userMessage: ChatMessage,
    slug: string,
    inputName: string,
    logId?: string,
    authCode?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => {
    if (!slug || !inputName) return;

    // [TEMP-FALLBACK] ngrok 서버 연결 불가 시 fly.io로 폴백
    const agentServer = await getAgentWsBaseURL();
    const baseURL = agentServer.replace(/^https?:\/\//, "");
    const protocol = agentServer.startsWith("https") ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${baseURL}/ws/agents/${slug}/run`);
    wsRef.current = ws;

    setIsRunning(true);
    setInputRequested(false);

    ws.onopen = () => {
      const inputs: Record<string, string> = { [inputName]: userMessage.content };
      if (authCode) {
        inputs["auth_code"] = authCode;
      }
      ws.send(JSON.stringify({ type: "start", inputs }));
    };

    ws.onmessage = (event) =>
      handleWSMessage(event, logId, onDone, onLog);

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsRunning(false);
      ws.close();
      if (onDone) onDone();
    };

    ws.onclose = () => {
      setIsRunning(false);
    };
  };

  const sendInput = (
    value: string,
    logId?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => {
    if (!wsRef.current) return;

    setInputRequested(false);
    setIsRunning(true);

    wsRef.current.send(
      JSON.stringify({ type: "input_response", data: value })
    );

    wsRef.current.onmessage = (event) =>
      handleWSMessage(event, logId, onDone, onLog);
  };

  return { run, sendInput, cancel, isRunning, inputRequested };
}