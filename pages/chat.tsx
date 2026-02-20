import styles from "@/styles/pages/chat.module.css";
import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { AgentDetailType, AgentType } from "@/types/agentTypes";
import { useRouter } from "next/router";
import React, { ChangeEvent, KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";
import { ChatHistory, ChatMessage } from "@/types/chatTypes";
import { useAgentWebSocket } from "@/hooks/useAgentWebSocket";
import { renderAgentMarkdown } from "@/utils/renderAgentMarkdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import katexSchema from "@/katexSchema";

const chat_bubble = {
  src: require("@/public/assets/chat-bubble.svg"),
  alt: "chat"
};

const lock = {
  src: require("@/public/assets/lock.svg"),
  alt: "lock"
};

const hyperlink = {
  src: require("@/public/assets/hyperlink.svg"),
  alt: "hyperlink"
};

const send = {
  src: require("@/public/assets/send.svg"),
  alt: "send"
};

const Chat = () => {
  const router = useRouter();
  const user = useUser();
  const subscriptions = useSubscriptions();
  
  const chatboxRef = useRef<HTMLDivElement>(null);
  const logboxRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [agentDetails, setAgentDetails] = useState<AgentDetailType[]>([]);
  
  const [toggledRoom, setToggledRoom] = useState<AgentType["slug"] | null>(null);
  const [toggledAgent, setToggledAgent] = useState<AgentDetailType | null>(null);
  
  const [textQuery, setTextQuery] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistory>([]);
  
  const [isWaitResult, setIsWaitResult] = useState<boolean>(false);

  const [oAuthCode, setOAuthCode] = useState<string>("");
  const [useOAuthGuard, setUseOAuthGuard] = useState<boolean>(false);

  const socket = useAgentWebSocket(setChatHistory);

  const importHistoryRef = useRef<boolean>(false);
  const shouldPostRef = useRef<boolean>(false);
  
  const resetChat = () => {
    setTextQuery("");
    setChatHistory([]);
  };

  const getChatHistory = async () => {
    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (user.token === "" || !toggledRoom) return;

    importHistoryRef.current = true;

    try {
      const res = await fetch(`${serverURL}/users/chat/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          slug: toggledRoom
        })
      });

      const data = await res.json();

      if (data.status === "success") {
        setChatHistory(data["chat_history"]);
      }
    } catch (error) {
      window.alert("History error");
      router.reload();
    }
  };

  const postChatHistory = async () => {
    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (user.token === "") return;

    try {
      const res = await fetch(`${serverURL}/users/chat/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          slug: toggledRoom,
          chat_history: chatHistory
        })
      });

      const data = await res.json();

      if (data.status !== "success") {
        console.error("error:", data["detail"]);
      }
    } catch (error) {
      window.alert("Save error");
      router.reload();
    } finally {
      shouldPostRef.current = false;
    }
  };

  const getAgentDetail = async (slugs: AgentType["slug"][]) => {
    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    let results: AgentDetailType[] = [];
    for (const slug of slugs) {
      try {
        const res = await fetch(`${serverURL}/api/agents/${slug}`, {
          method: "GET"
        });
  
        const data = await res.json();
        const detail = data["agent"] as Omit<AgentDetailType, "slug">;

        results.push({
          slug,
          ...detail
        });
      } catch (error) {
        window.alert("Get agent error");
        router.reload();
      }
    }

    setAgentDetails(results);
  };

  const autoResizeTextarea = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const lineHeight = 20;
    const minLines = 1;
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

  const handleClickRoom = (target: AgentType["slug"]) => {
    resetChat();
    setToggledRoom(target);
    router.push({
      pathname: router.pathname,
      query: { room: target }
    }, undefined, { shallow: true });
  };

  const handleChangeTextQuery = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const target = event.target;
    const value = target.value;

    setTextQuery(value);
    autoResizeTextarea();
  };

  const handlePressShiftEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const key = event.key;
    if (key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (socket.inputRequested) handleInputResponse();
      else handleSubmit();
    }
  }

  const handleSubmit = () => {
    if (!textQuery || !toggledRoom || !toggledAgent) return;
    setIsWaitResult(true);

    const inputName = toggledAgent.inputs[0]?.name ?? null;
    if (!inputName) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      slug: toggledRoom,
      sender: "user",
      content: textQuery,
      timestamp: Date.now()
    };
    setChatHistory((prev) => [...prev, userMessage]);

    const logId = "log_" + userMessage.id;
    setChatHistory(prev => [
      ...prev,
      {
        id: logId,
        slug: toggledRoom,
        sender: "log",
        content: "",
        timestamp: Date.now(),
        status: "processing"
      }
    ]);

    socket.run(userMessage, toggledRoom, inputName, logId,
      (finalContent?: object) => {
        if (!finalContent) return;
        shouldPostRef.current = true;

        const markdown = renderAgentMarkdown(
          finalContent,
          toggledRoom as "smart-sourcer" | "email-ghostwriter"
        );

        const agentMessage: ChatMessage = {
          id: String(Date.now()),
          slug: toggledRoom,
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

        setIsWaitResult(false);
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

    setTextQuery("");
  };

  const handleInputResponse = () => {
    if (!textQuery || !toggledRoom || isWaitResult) return;
    setIsWaitResult(true);

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      slug: toggledRoom,
      sender: "user",
      content: textQuery,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMessage]);

    const logId = "log_" + userMessage.id;
    setChatHistory(prev => [
      ...prev,
      {
        id: logId,
        slug: toggledRoom,
        sender: "log",
        content: "",
        timestamp: Date.now()
      }
    ]);

    socket.sendInput(textQuery, logId,
      (finalContent?: object) => {
        if (!finalContent) return;

        const agentMessage: ChatMessage = {
          id: String(Date.now()),
          slug: toggledRoom,
          sender: "agent",
          content: JSON.stringify(finalContent, null, 2),
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, agentMessage]);
        setIsWaitResult(false);
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

    setTextQuery("");
  };

  const handleClickOAuth = () => {
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
        if (response.code) return;
        setOAuthCode(response.code);
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

    if (shouldPostRef.current) postChatHistory();

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
    if (!toggledAgent) return;

    if (toggledAgent.resources.auth.length > 0) {
      setUseOAuthGuard(true);
    }
    else {
      setUseOAuthGuard(false);
    }
  }, [toggledAgent, router.query]);

  useEffect(() => {
    if (toggledRoom === "") return;
    getChatHistory();
    setToggledAgent(agentDetails.find(detail => detail.slug === toggledRoom) ?? null);
  }, [toggledRoom]);

  useEffect(() => {
    if (!user.hasAuth()) {
      router.push({
        pathname: "/signin",
        query: { redirect: router.pathname }
      });
  
      return;
    }

    if (subscriptions.subs.length === 0) return;
    getAgentDetail(subscriptions.subs);
  }, [user.token, subscriptions.subs]);

  useEffect(() => {
    if (agentDetails.length === 0) return;

    const room = router.query["room"] as string;
    if (room) setToggledRoom(room);
  }, [router.query, agentDetails]);

  return (
    <React.Fragment>
      <TopSticky />
      <div className={clsx(styles.background)} />
      <div className={clsx(styles.container)}>
        <div className={clsx(styles.left)}>
          <div className={clsx(styles.leftTitle)}>
            <Image src={chat_bubble.src} alt={chat_bubble.alt} />
            <h1>Messages</h1>
          </div>
          <div className={clsx(styles.roomList)}>
            {agentDetails.map((detail, idx) => (
              <div className={clsx(styles.room, { [styles.toggledRoom]: toggledRoom === detail.slug })} onClick={() => handleClickRoom(detail.slug)} key={idx}>
                <p>{detail.info.icon}</p>
                <p>{detail.info.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={clsx(styles.right)}>
          <div ref={chatboxRef} className={clsx(styles.chatbox)}>
            <div className={clsx(styles.chatboxWrapper)}>
              {chatHistory.map((chat) => chat.sender === "agent"
                ? (
                  <div className={clsx(styles.md)} key={chat.id}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex, [rehypeSanitize, katexSchema]]}>
                      {chat.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div key={chat.id}>
                    <div ref={el => { if (chat.sender === "log") logboxRefs.current[chat.id] = el; }} className={clsx(styles.chat, { [styles.userChat]: chat.sender === "user", [styles.logChat]: chat.sender === "log" })}>
                      <p>{chat.content}</p>
                    </div>
                    {chat.sender === "log" && chat.status === "processing" && (
                      <div className={clsx(styles.processText)}>
                        <p>Processing...</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          <div className={clsx(styles.input)}>
            <div className={clsx(styles.inputWrapper)}>
              <textarea ref={textareaRef} id="queryText" rows={1} placeholder={toggledAgent?.inputs[0].placeholder} value={textQuery} onChange={handleChangeTextQuery} onKeyDown={handlePressShiftEnter} />
              <button disabled={textQuery === "" || isWaitResult} onClick={socket.inputRequested ? handleInputResponse : handleSubmit}>
                <Image src={send.src} alt={send.alt} />
              </button>
            </div>
          </div>
          {useOAuthGuard && (
            <div className={clsx(styles.guard)}>
              <div className={clsx(styles.guardNotice)}>
                <div className={clsx(styles.noticeContent)}>
                  <div>
                    <Image src={lock.src} alt={lock.alt} />
                  </div>
                  <div>
                    <h1>Verification is required.</h1>
                    <p>To use this Agent, you must verify with your Google account. Once verification is complete, you will have access to all features.</p>
                  </div>
                </div>
                <div className={clsx(styles.noticeOAuth)}>
                  <button onClick={handleClickOAuth}>
                    <p>Authenticate with OAuth</p>
                    <Image src={hyperlink.src} alt={hyperlink.alt} />
                  </button>
                </div>
              </div>
              <div className={clsx(styles.inputGuard)}>
                <Image src={lock.src} alt={lock.alt} />
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