import { useUser } from "@/contexts/UserContext";
import styles from "@/styles/components/TopSticky.module.css";
import { CategoryType } from "@/types/agentTypes";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const logo_icon = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const user_icon = {
  src: require("@/public/assets/user.svg"),
  alt: "user"
};

const TopSticky = () => {
  const router = useRouter();
  const user = useUser();

  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [toggled, setToggled] = useState<CategoryType | null>(null);

  useEffect(() => {
    if (user.hasAuth()) setIsSigned(true);
    else setIsSigned(false);
  }, [user.token]);

  useEffect(() => {
    const pathname = router.pathname;

    if (pathname === "/") setToggled("find");
    else if (pathname === "/share") setToggled("share");
    else if (pathname === "/chat") setToggled("chat");
  }, [router.pathname]);

  return (
    <div className={clsx(styles.sticky)}>
      <div className={clsx(styles.wrapper)}>
        <div className={clsx(styles.title)} onClick={router.reload}>
          <Image src={logo_icon.src} alt={logo_icon.alt} />
          <h1>hAIre Agent Market</h1>
        </div>
        <div className={clsx(styles.category)}>
          <div className={clsx({ [styles.toggled]: toggled === "find" })} onClick={() => router.push("/")}>
            <p>Find Agent</p>
          </div>
          <div className={clsx({ [styles.toggled]: toggled === "share" })} onClick={() => router.push("/share")}>
            <p>Share Agent</p>
          </div>
          <div className={clsx({ [styles.toggled]: toggled === "chat" })} onClick={() => router.push("/chat")}>
            <p>Chat Agent</p>
          </div>
        </div>
        <div className={clsx(styles.sign)}>
          {isSigned ? (
            <React.Fragment>
              <div className={clsx(styles.userProfile)}>
                <Image src={user_icon.src} alt={user_icon.alt} />
                <p>{user.name}</p>
              </div>
              <button onClick={user.signOut}>Sign out</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button onClick={() => router.push("/signin")}>Sign in</button>
              <button onClick={() => router.push("/signup")}>Sign up</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopSticky;