import React, { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useUser } from "@/contexts/UserContext";
import { useAgentWebSocket } from "@/hooks/useAgentWebSocket";
import { AgentDetailType, AgentType } from "@/types/agentTypes";
import { ChatHistory, ChatMessage } from "@/types/chatTypes";
import { agentApi, userApi } from "@/utils/api";
import { navigateHandler } from "@/utils/navigate";
import { renderAgentMarkdown } from "@/utils/renderAgentMarkdown";
import katexSchema from "@/katexSchema";
import styles from "@/styles/pages/chat.module.css";

const ICON_CHAT = {
  src: require("@/public/assets/chat-bubble.svg"),
  alt: "chat"
};

const ICON_LOCK = {
  src: require("@/public/assets/lock.svg"),
  alt: "lock"
};

const ICON_HYPERLINK = {
  src: require("@/public/assets/hyperlink.svg"),
  alt: "hyperlink"
};

const ICON_SEND = {
  src: require("@/public/assets/send.svg"),
  alt: "send"
};

const Chat = () => {
  // ── Hooks ──
  const router = useRouter();
  const user = useUser();
  const subscriptions = useSubscriptions();

  // ── Refs ──
  const chatboxRef = useRef<HTMLDivElement>(null);
  const logboxRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importHistoryRef = useRef<boolean>(false);
  const shouldPostRef = useRef<boolean>(false);
  
  // ── State ──
  const [agentDetails, setAgentDetails] = useState<AgentDetailType[]>([]);
  
  const [activeRoom, setActiveRoom] = useState<AgentType["slug"] | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentDetailType | null>(null);
  
  const [messageInput, setMessageInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistory>([]);
  
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const [oauthCode, setOauthCode] = useState<string>("");
  const [showOAuthGuard, setShowOAuthGuard] = useState<boolean>(false);
  const [isRoomsLoading, setIsRoomsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // ── Socket ──
  const socket = useAgentWebSocket(setChatHistory);
  
  // ── Helpers ──
  const resetChat = () => {
    setMessageInput("");
    setChatHistory([]);
  };

  // ── Data Fetching ──
  const fetchChatHistory = async () => {
    if (user.token === "" || !activeRoom) return;

    importHistoryRef.current = true;
    setIsHistoryLoading(true);

    try {
      const data = await userApi.getChatHistory(user.token, activeRoom);

      if (data.status === "success") {
        setChatHistory(data.chat_history);
      }
    } catch (error) {
      window.alert("History error");
      router.reload();
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const saveChatHistory = async () => {
    if (user.token === "") return;

    try {
      const data = await userApi.saveChatHistory(user.token, activeRoom!, chatHistory);

      if (data.status !== "success") {
        console.error("error:", data.detail);
      }
    } catch (error) {
      window.alert("Save error");
      router.reload();
    } finally {
      shouldPostRef.current = false;
    }
  };

  const fetchAgentDetails = async (slugs: AgentType["slug"][]) => {
    let results: AgentDetailType[] = [];
    for (const slug of slugs) {
      try {
        const data = await agentApi.getAgentDetail(slug);

        results.push({
          slug,
          ...data.agent
        });
      } catch (error) {
        window.alert("Get agent error");
        router.reload();
      }
    }

    setAgentDetails(results);
    setIsRoomsLoading(false);
  };

  const autoResizeTextarea = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const lineHeight = 20;
    const maxLines = 5;

    let mirror = document.getElementById("textarea-mirror") as HTMLDivElement;
    if (!mirror) {
      mirror = document.createElement("div");
      mirror.id = "textarea-mirror";
      document.body.appendChild(mirror);

      Object.assign(mirror.style, {
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        visibility: "hidden",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
      });
    }

    const style = window.getComputedStyle(textarea);
    mirror.style.width = style.width;
    mirror.style.fontSize = style.fontSize;
    mirror.style.fontFamily = style.fontFamily;
    mirror.style.fontWeight = style.fontWeight;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;

    mirror.textContent = textarea.value || " ";

    const contentHeight = mirror.scrollHeight;
    const wrappedLines = Math.max(0, Math.round(contentHeight / lineHeight) - 1);

    const lines = textarea.value.split("\n").length || 1;
    const newHeight = Math.max(lines, wrappedLines) * lineHeight;

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = lines > maxLines ? "auto" : "hidden";
  };

  // ── Handlers ──
  const handleSelectRoom = (target: AgentType["slug"], event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/chat?room=${target}`, "_blank");
      return;
    }

    resetChat();
    setActiveRoom(target);
    router.push({
      pathname: router.pathname,
      query: { room: target }
    }, undefined, { shallow: true });
  };

  const handleBackToRooms = (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      window.open("/chat", "_blank");
      return;
    }

    resetChat();
    setActiveRoom(null);
    router.push({
      pathname: router.pathname,
    }, undefined, { shallow: true });
  };

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const target = event.target;
    const value = target.value;

    setMessageInput(value);
    autoResizeTextarea();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const key = event.key;
    if (key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (socket.inputRequested) handleInputResponse();
      else handleSubmit();
    }
  }

  const handleSubmit = () => {
    if (!messageInput || !activeRoom || !activeAgent) return;
    setIsWaiting(true);

    const inputName = activeAgent.inputs[0]?.name ?? null;
    if (!inputName) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      slug: activeRoom,
      sender: "user",
      content: messageInput,
      timestamp: Date.now()
    };
    setChatHistory((prev) => [...prev, userMessage]);

    const logId = "log_" + userMessage.id;
    setChatHistory(prev => [
      ...prev,
      {
        id: logId,
        slug: activeRoom,
        sender: "log",
        content: "",
        timestamp: Date.now(),
        status: "processing"
      }
    ]);

    socket.run(userMessage, activeRoom, inputName, logId, oauthCode || undefined,
      (finalContent?: object) => {
        if (!finalContent) return;
        shouldPostRef.current = true;

        const markdown = renderAgentMarkdown(
          finalContent,
          activeRoom as "smart-sourcer" | "email-ghostwriter"
        );

        const agentMessage: ChatMessage = {
          id: String(Date.now()),
          slug: activeRoom,
          sender: "agent",
          content: markdown,
          timestamp: Date.now()
        };

        setChatHistory(prev => [
          ...prev.map(msg =>
            msg.id === logId ? { ...msg, status: "done" as const } : msg
          ),
          agentMessage
        ]);

        setIsWaiting(false);
      },
      (logChunk: string) => {
        setChatHistory(prev => 
          prev.map(msg => {
            if (msg.id === logId) {
              const updated = { ...msg, content: msg.content + logChunk };
              return updated;
            }
            return msg;
          })
        );
      },
    );

    setMessageInput("");
  };

  const handleInputResponse = () => {
    if (!messageInput || !activeRoom || isWaiting) return;
    setIsWaiting(true);

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      slug: activeRoom,
      sender: "user",
      content: messageInput,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMessage]);

    const logId = "log_" + userMessage.id;
    setChatHistory(prev => [
      ...prev,
      {
        id: logId,
        slug: activeRoom,
        sender: "log",
        content: "",
        timestamp: Date.now()
      }
    ]);

    socket.sendInput(messageInput, logId,
      (finalContent?: object) => {
        if (!finalContent) return;

        const agentMessage: ChatMessage = {
          id: String(Date.now()),
          slug: activeRoom,
          sender: "agent",
          content: JSON.stringify(finalContent, null, 2),
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, agentMessage]);
        setIsWaiting(false);
      },
      (logChunk: string) => {
        setChatHistory(prev =>
          prev.map(msg => {
            if (msg.id === logId) {
              const updated = { ...msg, content: msg.content + logChunk };
              return updated;
            }
            return msg;
          })
        );
      }
    );

    setMessageInput("");
  };

  const handleOAuthClick = () => {
    if (!window.google) {
      alert("Google SDK not loaded");
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId!,
      scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose",
      ux_mode: "popup",
      callback: (response: any) => {
        if (!response.code) return;
        setOauthCode(response.code);
        setShowOAuthGuard(false);
      }
    });
    
    client.requestCode();
  };

  useEffect(() => {
    if (importHistoryRef.current) {
      importHistoryRef.current = false;
      chatboxRef.current?.scrollTo({
        top: chatboxRef.current.scrollHeight
      });

      return;
    }

    if (shouldPostRef.current) saveChatHistory();

    const lastLog = chatHistory.filter(chat => chat.sender === "log").slice(-1)[0];
    if (!lastLog) return;

    const el = logboxRefs.current[lastLog.id];
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!activeAgent) return;

    if (activeAgent.resources.auth.length > 0) {
      setShowOAuthGuard(true);
    }
    else {
      setShowOAuthGuard(false);
    }
  }, [activeAgent, router.query]);

  useEffect(() => {
    if (activeRoom === "") return;
    fetchChatHistory();
    setActiveAgent(agentDetails.find(detail => detail.slug === activeRoom) ?? null);
  }, [activeRoom]);

  useEffect(() => {
    if (!user.hasAuth()) {
      router.push({
        pathname: "/signin",
        query: { redirect: router.pathname }
      });
  
      return;
    }

    if (subscriptions.subs.length === 0) return;
    fetchAgentDetails(subscriptions.subs);
  }, [user.token, subscriptions.subs]);

  useEffect(() => {
    if (agentDetails.length === 0) return;

    const room = router.query["room"] as string;
    if (room) setActiveRoom(room);
  }, [router.query, agentDetails]);

  return (
    <React.Fragment>
      <TopSticky />
      <div className={clsx(styles["chat-background"])} />

      <div className={clsx(styles["chat-container"])}>
        {/* ── Sidebar ── */}
        <div className={clsx(styles["chat-sidebar"], {
          [styles["sidebar-hidden-mobile"]]: activeRoom !== null
        })}>
          <div className={clsx(styles["sidebar-title"])}>
            <Image src={ICON_CHAT.src} alt={ICON_CHAT.alt} />
            <h1>Messages</h1>
          </div>
          <div className={clsx(styles["room-list"])}>
            {isRoomsLoading ? (
              Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className={clsx(styles["skeleton-room"])}>
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-room-icon"])} />
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-room-name"])} />
                </div>
              ))
            ) : (
              agentDetails.map((detail, idx) => (
              <div
                key={idx}
                className={clsx(styles["room-item"], {
                  [styles["room-item--active"]]: activeRoom === detail.slug,
                })}
                onClick={(event) => handleSelectRoom(detail.slug, event)}
              >
                <p>{detail.info.icon}</p>
                <p>{detail.info.name}</p>
              </div>
            ))
            )}
          </div>
        </div>

        {/* ── Chat Main ── */}
        <div className={clsx(styles["chat-main"], {
          [styles["main-hidden-mobile"]]: activeRoom === null
        })}>

          {/* Back Button (mobile only) */}
          <button
            className={clsx(styles["chat-back-btn"])}
            onClick={(event) => handleBackToRooms(event)}
          >
            ← Rooms
          </button>

          {/* Chat Box */}
          <div ref={chatboxRef} className={clsx(styles["chat-box"])}>
            <div className={clsx(styles["chat-box-inner"])}>
              {isHistoryLoading && (
                <div className={clsx(styles["skeleton-history"])}>
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-history-line-1"])} />
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-history-line-2"])} />
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-history-line-3"])} />
                </div>
              )}
              {chatHistory.map((chat) => chat.sender === "agent" ? (
                <div key={chat.id} className={clsx(styles["markdown-content"])}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                    rehypePlugins={[rehypeKatex, [rehypeSanitize, katexSchema]]}
                  >
                    {chat.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div key={chat.id}>
                  <div
                    ref={el => { if (chat.sender === "log") logboxRefs.current[chat.id] = el; }}
                    className={clsx(styles["message-bubble"], {
                      [styles["user-message"]]: chat.sender === "user",
                      [styles["log-message"]]: chat.sender === "log",
                    })}
                  >
                    <p>{chat.content}</p>
                  </div>
                  {chat.sender === "log" && chat.status === "processing" && (
                    <div className={clsx(styles["process-indicator"])}>
                      <span className={clsx(styles["process-spinner"])} />
                      <p>Processing...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className={clsx(styles["chat-input"])}>
            <div className={clsx(styles["chat-input-inner"])}>
              <textarea
                ref={textareaRef}
                id="queryText"
                rows={1}
                placeholder={activeAgent?.inputs[0].placeholder}
                value={messageInput}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
              />
              <button
                disabled={messageInput === "" || isWaiting}
                onClick={socket.inputRequested ? handleInputResponse : handleSubmit}
              >
                <Image src={ICON_SEND.src} alt={ICON_SEND.alt} />
              </button>
            </div>
          </div>

          {/* OAuth Guard */}
          {showOAuthGuard && (
            <div className={clsx(styles["oauth-guard"])}>
              <div className={clsx(styles["guard-notice"])}>
                <div className={clsx(styles["guard-notice-content"])}>
                  <div>
                    <Image src={ICON_LOCK.src} alt={ICON_LOCK.alt} />
                  </div>
                  <div>
                    <h1>Verification is required.</h1>
                    <p>To use this Agent, you must verify with your Google account. Once verification is complete, you will have access to all features.</p>
                  </div>
                </div>
                <div className={clsx(styles["guard-oauth-action"])}>
                  <button onClick={handleOAuthClick}>
                    <p>Authenticate with OAuth</p>
                    <Image src={ICON_HYPERLINK.src} alt={ICON_HYPERLINK.alt} />
                  </button>
                </div>
              </div>
              <div className={clsx(styles["guard-input-block"])}>
                <Image src={ICON_LOCK.src} alt={ICON_LOCK.alt} />
                <p>You must complete verification to send a message.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </React.Fragment>
  );
};

export default Chat;