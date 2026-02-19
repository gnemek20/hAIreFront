import styles from "@/styles/pages/chat.module.css";
import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { AgentDetailType, AgentType } from "@/types/agentTypes";
import { useRouter } from "next/router";
import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";
import { ChatHistory, ChatMessage } from "@/types/chatTypes";

const chat_bubble = {
  src: require("@/public/assets/chat-bubble.svg"),
  alt: "chat"
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [agentDetails, setAgentDetails] = useState<AgentDetailType[]>([]);

  const [toggledRoom, setToggledRoom] = useState<AgentType["slug"] | null>(null);

  const [textQuery, setTextQuery] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistory>([]);

  const [isWaitResult, setIsWaitResult] = useState<boolean>(false);

  const resetChat = () => {
    setTextQuery("");
    setChatHistory([]);
  };

  const getChatHistory = () => {

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

  const submitMessage = async () => {
    if (!chatboxRef.current || textQuery === "") return;
    if (!toggledRoom || isWaitResult) return;
    setIsWaitResult(true);

    const query = textQuery;
    const chatMessage: ChatMessage = {
      slug: toggledRoom,
      sender: "user",
      content: query,
      timestamp: Date.now()
    };
    setChatHistory([...chatHistory, chatMessage]);

    chatboxRef.current.scrollTo({
      top: chatboxRef.current.scrollHeight,
      behavior: "smooth"
    });

    if (textareaRef.current) textareaRef.current.value = "";
    setTextQuery("");
    autoResizeTextarea();
    
    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!user.token) return;
    
    try {
      // const res = await fetch(`${serverURL}/api/agents/${toggledRoom}/run`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     inputs: query
      //   })
      // });
    } catch (error) {
      window.alert("Server error");
      router.reload();
    } finally {
      setIsWaitResult(false);
    }
  };

  const autoResizeTextarea = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const lineHeight = 20;
    const maxLines = 5;
    const maxHeight = lineHeight * maxLines;

    const lines = textarea.value.split("\n").length || 1;

    if (lines <= maxLines) {
      textarea.style.height = `${lines * lineHeight}px`;
      textarea.style.overflowY = "hidden";
    }
    else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
    }
  }

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
      submitMessage();
    }
  }

  useEffect(() => {
    if (toggledRoom === "") return;
    getChatHistory();
  }, [toggledRoom]);

  useEffect(() => {
    if (subscriptions.subs.length === 0) return;
    getAgentDetail(subscriptions.subs);
  }, [subscriptions.subs]);

  useEffect(() => {
    if (agentDetails.length === 0) return;

    const room = router.query["room"] as string;
    if (room) setToggledRoom(room);
  }, [router.query, agentDetails]);

  useEffect(() => {
    if (!user.hasAuth()) {
      router.push({
        pathname: "/signin",
        query: { redirect: router.pathname }
      });

      return;
    }
  }, [user.token]);

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
              {chatHistory.map((chat, idx) => (
                <div className={clsx(styles.chat, chat.sender === "agent" ? styles.agentChat : styles.userChat)} key={idx}>
                  <p>{chat.content}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={clsx(styles.input)}>
            <textarea ref={textareaRef} id="queryText" rows={1} placeholder="Enter message..." value={textQuery} onChange={handleChangeTextQuery} onKeyDown={handlePressShiftEnter} />
            <button disabled={textQuery === ""} onClick={submitMessage}>
              <Image src={send.src} alt={send.alt} />
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Chat;