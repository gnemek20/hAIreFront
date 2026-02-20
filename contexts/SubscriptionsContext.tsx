import { AgentType } from "@/types/agentTypes";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface SubscriptionsContextType {
  subs: AgentType["slug"][];
  setSubs: (newSubs: AgentType["slug"][]) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextType | undefined>(undefined);

export const SubscriptionsProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<AgentType["slug"][]>([]);

  const handleSetSubscriptions = (newSubs: AgentType["slug"][]) => {
    setSubscriptions(newSubs);
    sessionStorage.setItem("subscriptions", JSON.stringify(newSubs));
  };
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedSubs = sessionStorage.getItem("subscriptions");
    if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
  }, []);

  return (
    <SubscriptionsContext.Provider value={{ subs: subscriptions, setSubs: handleSetSubscriptions }}>
      {children}
    </SubscriptionsContext.Provider>
  )
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionsContext);
  if (!context) if (!context) throw new Error("useSubscriptions must be used within SubscriptionsProvider");

  return context;
};