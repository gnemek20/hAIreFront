export type ChatMessage = {
  slug: string;
  sender: "user" | "agent";
  content: string;
  timestamp: number;
};

export type ChatHistory = ChatMessage[];