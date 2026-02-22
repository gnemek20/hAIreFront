// ── React ──
import { useRef, useState } from "react";

// ── Internal Modules ──
import { ChatMessage } from "@/types/chatTypes";

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
  ) => void;
  sendInput: (
    value: string,
    logId?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => void;
  isRunning: boolean;
  inputRequested: boolean;
}

export function useAgentWebSocket(
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>
): AgentWSHook {
  const wsRef = useRef<WebSocket | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [inputRequested, setInputRequested] = useState(false);

  const handleWSMessage = (
    event: MessageEvent,
    logId?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => {
    const msg: WSMessage = JSON.parse(event.data);

    switch (msg.type) {
      case "output":
        if (logId && typeof msg.data === "string") {
          setChatHistory(prev =>
            prev.map(m =>
              m.id === logId ? { ...m, content: m.content + msg.data } : m
            )
          );
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

  const run = (
    userMessage: ChatMessage,
    slug: string,
    inputName: string,
    logId?: string,
    authCode?: string,
    onDone?: (finalContent?: object) => void,
    onLog?: (logContent: string) => void
  ) => {
    if (!slug || !inputName) return;

    const baseURL = process.env.NEXT_PUBLIC_AGENT_SERVER!.replace(/^https?:\/\//, "");
    const protocol = location.protocol === "https:" ? "wss" : "ws";
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

  return { run, sendInput, isRunning, inputRequested };
}