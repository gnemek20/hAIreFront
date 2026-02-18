import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserContextType {
  name: string;
  setName: (name: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState<string>("");

  const setNameWithStorage = (newName: string) => {
    setName(newName);
    localStorage.setItem("name", newName);
  };

  useEffect(() => {
    const savedName = localStorage.getItem("name");
    if (savedName) setName(savedName);
  }, []);

  return (
    <UserContext.Provider value={{ name, setName: setNameWithStorage }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");

  return context;
};