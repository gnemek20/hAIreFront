import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import clsx from "clsx";

import { useUser } from "@/contexts/UserContext";
import { PageCategory } from "@/types/agent";
import { navigateHandler } from "@/utils/navigate";
import styles from "@/styles/components/TopSticky.module.css";

const ICON_LOGO = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const ICON_USER = {
  src: require("@/public/assets/user.svg"),
  alt: "user"
};

const TopSticky = () => {
  // ── Hooks ──
  const router = useRouter();
  const user = useUser();

  // ── State ──
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<PageCategory | null>(null);

  // ── Effects ──
  useEffect(() => {
    if (user.isSignedIn()) setIsAuthenticated(true);
    else setIsAuthenticated(false);
  }, [user.token]);

  useEffect(() => {
    const pathname = router.pathname;

    if (pathname === "/") setActiveNav("find");
    else if (pathname === "/share") setActiveNav("share");
    else if (pathname === "/chat") setActiveNav("chat");
  }, [router.pathname]);

  return (
    <div className={clsx(styles["top-sticky"])}>
      <div className={clsx(styles["top-sticky-inner"])}>
        {/* Logo */}
        <div className={clsx(styles["sticky-title"])} onClick={router.reload}>
          <Image src={ICON_LOGO.src} alt={ICON_LOGO.alt} />
          <h1>hAIre Agent Market</h1>
        </div>

        {/* Navigation */}
        <div className={clsx(styles["sticky-nav"])}>
          <div
            className={clsx({ [styles["nav-item--active"]]: activeNav === "find" })}
            onClick={navigateHandler(router, "/")}
          >
            <p>Find Agent</p>
          </div>
          <div
            className={clsx({ [styles["nav-item--active"]]: activeNav === "share" })}
            onClick={navigateHandler(router, "/share")}
          >
            <p>Share Agent</p>
          </div>
          <div
            className={clsx({ [styles["nav-item--active"]]: activeNav === "chat" })}
            onClick={navigateHandler(router, "/chat")}
          >
            <p>Chat Agent</p>
          </div>
        </div>

        {/* Auth */}
        <div className={clsx(styles["sticky-auth"])}>
          {isAuthenticated ? (
            <React.Fragment>
              <div className={clsx(styles["user-profile"])}>
                <Image src={ICON_USER.src} alt={ICON_USER.alt} />
                <p>{user.name}</p>
              </div>
              <button onClick={user.signOut}>Sign out</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button onClick={navigateHandler(router, "/signin")}>Sign in</button>
              <button onClick={navigateHandler(router, "/signup")}>Sign up</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopSticky;