import React, { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import clsx from "clsx";

import SignHeader from "@/components/SignHeader";
import { useUser } from "@/contexts/UserContext";
import { ApiError, userApi } from "@/utils/api";
import styles from "@/styles/pages/signin.module.css";

const ICON_ARROW = {
  src: require("@/public/assets/right-arrow.svg"),
  alt: "logo"
};

const SignIn = () => {
  // ── Hooks ──
  const router = useRouter();
  const user = useUser();

  // ── State ──
  const [loginId, setLoginId] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Data Fetching ──
  const signIn = async () => {
    if (isLoading || isSubmitDisabled) return;
    setIsLoading(true);

    try {
      const data = await userApi.signIn(loginId, password);

      user.signIn(data.access_token, data.username);

      const redirect = router.query["redirect"] as string;
      router.replace(redirect ? redirect : "/");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setPassword("");
          if ((error.data as any)?.detail === "User not found") setLoginId("");
          return;
        }
        console.error("Sign in error:", (error.data as any)?.detail, error.data);
        return;
      }
      window.alert("Sign in error");
      router.reload();
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ──
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>, callback: (str: string) => void) => {
    const target = event.target;
    const value = target.value;

    callback(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "Enter") signIn();
  };

  // ── Effects ──
  useEffect(() => {
    if (loginId !== "" && password !== "") setIsSubmitDisabled(false);
    else setIsSubmitDisabled(true);
  }, [loginId, password]);

  return (
    <React.Fragment>
      <SignHeader message="No have account?" linkText="Sign up" />

      <div className={clsx(styles["sign-in-page"])}>
        <div className={clsx(styles["sign-in-form"])} onKeyDown={handleKeyDown}>
          <div className={clsx(styles["form-field"])}>
            {/* Title */}
            <div className={clsx(styles["form-title"])}>
              <h1>Sign in</h1>
              <p>Join the AI Agent Marketplace</p>
            </div>

            {/* Inputs */}
            <div className={clsx(styles["form-input"])}>
              <p>ID</p>
              <input
                type="text"
                placeholder="Enter ID"
                value={loginId}
                onChange={(event) => handleInputChange(event, setLoginId)}
              />
            </div>
            <div className={clsx(styles["form-input"])}>
              <p>Password</p>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(event) => handleInputChange(event, setPassword)}
              />
            </div>

            {/* Submit */}
            <div className={clsx(styles["form-submit"])}>
              <button disabled={isSubmitDisabled || isLoading} onClick={signIn}>
                {isLoading ? "Signing in..." : "Sign in"}
                <Image src={ICON_ARROW.src} alt={ICON_ARROW.alt} />
              </button>
            </div>
          </div>

          <div className={clsx(styles["form-footer"])}>
            <p>ⓒ hAIre</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SignIn;