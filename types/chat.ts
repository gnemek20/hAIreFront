export type ChatMessage = {
  id: string;
  slug: string;
  sender: "agent" | "user" | "log";
  content: string;
  timestamp: number;
  status?: "processing" | "done";
};

export type ChatHistory = ChatMessage[];
