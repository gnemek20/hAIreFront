import React, { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import clsx from "clsx";

import SignHeader from "@/components/SignHeader";
import { ApiError, userApi } from "@/utils/api";
import styles from "@/styles/pages/signup.module.css";

const ICON_ARROW = {
  src: require("@/public/assets/right-arrow.svg"),
  alt: "logo"
};

const SignUp = () => {
  // ── Hooks ──
  const router = useRouter();

  // ── State ──
  const [loginId, setLoginId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Data Fetching ──
  const signUp = async () => {
    if (isLoading || isSubmitDisabled) return;
    setIsLoading(true);

    try {
      await userApi.signUp(loginId, password, username);
      router.replace("/signin");
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Sign up failed:", error.data);
        return;
      }
      window.alert("Server error");
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
    if (key === "Enter") signUp();
  };

  // ── Effects ──
  useEffect(() => {
    if (loginId !== "" && password !== "" && username !== "") setIsSubmitDisabled(false);
    else setIsSubmitDisabled(true);
  }, [loginId, password, username]);

  return (
    <React.Fragment>
      <SignHeader message="Already have an account?" linkText="Sign in" />

      <div className={clsx(styles["sign-up-page"])}>
        <div className={clsx(styles["sign-up-form"])} onKeyDown={handleKeyDown}>
          <div className={clsx(styles["form-field"])}>
            {/* Title */}
            <div className={clsx(styles["form-title"])}>
              <h1>Sign up</h1>
              <p>Join the AI Agent Marketplace</p>
            </div>

            {/* Inputs */}
            <div className={clsx(styles["form-input"])}>
              <p>ID</p>
              <input
                type="text"
                placeholder="at least 3 characters"
                value={loginId}
                onChange={(event) => handleInputChange(event, setLoginId)}
              />
            </div>
            <div className={clsx(styles["form-input"])}>
              <p>Password</p>
              <input
                type="password"
                placeholder="at least 6 characters"
                value={password}
                onChange={(event) => handleInputChange(event, setPassword)}
              />
            </div>
            <div className={clsx(styles["form-input"])}>
              <p>Username</p>
              <input
                type="text"
                placeholder="Username to be displayed"
                value={username}
                onChange={(event) => handleInputChange(event, setUsername)}
              />
            </div>

            {/* Submit */}
            <div className={clsx(styles["form-submit"])}>
              <button disabled={isSubmitDisabled || isLoading} onClick={signUp}>
                {isLoading ? "Creating account..." : "Create account"}
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

export default SignUp;