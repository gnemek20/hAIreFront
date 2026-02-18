import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserContextType {
  name: string;
  isSigned: () => boolean;
  signIn: (name: string) => void;
  signOut: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [name, setName] = useState<string>("");

  const isSigned = () => {
    const isSigned = sessionStorage.getItem("isSigned") === "true";
    return isSigned;
  };

  const signIn = (newName: string) => {
    setName(newName);
    sessionStorage.setItem("isSigned", "true");
    sessionStorage.setItem("name", newName);
  };

  const signOut = () => {
    setName("");
    sessionStorage.removeItem("isSigned");
    sessionStorage.removeItem("name");
    router.replace("/");
  };

  useEffect(() => {
    const savedSigned = sessionStorage.getItem("isSigned") === "true";
    const savedName = sessionStorage.getItem("name");

    if (savedName && savedSigned) {
      setName(savedName);
    }
  }, []);

  return (
    <UserContext.Provider value={{ name, isSigned, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");

  return context;
};