import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserContextType {
  token: string;
  name: string;
  hasAuth: () => boolean;
  signIn: (token: string, name: string) => void;
  signOut: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [token, setToken] = useState<string>("");
  const [name, setName] = useState<string>("");

  const hasAuth = () => {
    if (typeof window === "undefined") return false;

    const hasAuth = sessionStorage.getItem("hasAuth") === "true";
    return hasAuth;
  };

  const signIn = (newToken: string, newName: string) => {
    if (typeof window === "undefined") return;

    setToken(newToken);
    setName(newName);
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("name", newName);
    sessionStorage.setItem("hasAuth", "true");
  };
  
  const signOut = () => {
    setToken("");
    setName("");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("hasAuth");
    sessionStorage.removeItem("name");
    router.replace("/");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedToken = sessionStorage.getItem("token");
    const savedName = sessionStorage.getItem("name");
    const savedSigned = sessionStorage.getItem("hasAuth") === "true";

    if (savedToken && savedSigned) setToken(savedToken);
    if (savedName && savedSigned) setName(savedName);
  }, []);

  return (
    <UserContext.Provider value={{ token, name, hasAuth, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");

  return context;
};