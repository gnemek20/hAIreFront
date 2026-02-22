// ── React ──
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";

// ── Internal Modules ──
import { AgentType } from "@/types/agentTypes";

interface SubscriptionsContextType {
  subs: AgentType["slug"][];
  setSubs: Dispatch<SetStateAction<AgentType["slug"][]>>;
};

const SubscriptionsContext = createContext<SubscriptionsContextType | undefined>(undefined);

export const SubscriptionsProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<AgentType["slug"][]>([]);

  const handleSetSubscriptions: Dispatch<SetStateAction<AgentType["slug"][]>> =
    (value) => {
      setSubscriptions(prev => {
        const next =
          typeof value === "function"
            ? value(prev)
            : value;

        sessionStorage.setItem("subscriptions", JSON.stringify(next));
        return next;
      });
    };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSubs = sessionStorage.getItem("subscriptions");
    if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
  }, []);

  return (
    <SubscriptionsContext.Provider
      value={{ subs: subscriptions, setSubs: handleSetSubscriptions }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionsContext);
  if (!context) throw new Error("useSubscriptions must be used within SubscriptionsProvider");
  return context;
};