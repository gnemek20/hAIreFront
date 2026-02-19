import SignHeader from "@/components/SignHeader";
import { useUser } from "@/contexts/UserContext";
import styles from "@/styles/pages/signin.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";

const right_arrow = {
  src: require("@/public/assets/right-arrow.svg"),
  alt: "logo"
};

const SignIn = () => {
  const router = useRouter();
  const user = useUser();

  const [id, setId] = useState<string>("");
  const [pwd, setPwd] = useState<string>("");

  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signIn = async () => {
    if (isLoading || isDisabled) return;
    setIsLoading(true);

    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          pwd: pwd
        })
      });

      const data = await res.json();

      if (res.status === 401) {
        setPwd("");
        if (data.detail === "User not found") setId("");

        return;
      }

      if (!res.ok) {
        console.error("Sign in error:", data.detail, data);
      }

      user.signIn(data["access_token"], data["username"]);

      const redirect = router.query["redirect"] as string;
      router.replace(redirect ? redirect : "/");
    } catch (error) {
      window.alert("Sign in error");
      router.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeValue = (event: ChangeEvent<HTMLInputElement>, callback: (str: string) => void) => {
    const target = event.target;
    const value = target.value;

    callback(value);
  };

  const handlePressEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "Enter") signIn();
  };

  useEffect(() => {
    if (id !== "" && pwd !== "") setIsDisabled(false);
    else setIsDisabled(true);
  }, [id, pwd]);

  return (
    <React.Fragment>
      <SignHeader p="No have account?" a="Sign up" />
      <div className={clsx(styles.container)}>
        <div className={clsx(styles.form)} onKeyDown={handlePressEnter}>
          <div className={clsx(styles.field)}>
            <div className={clsx(styles.formTitle)}>
              <h1>Sign in</h1>
              <p>Join the AI Agent Marketplace</p>
            </div>
            <div className={clsx(styles.input)}>
              <p>ID</p>
              <input type="text" placeholder="Enter ID" value={id} onChange={(event) => handleChangeValue(event, setId)} />
            </div>
            <div className={clsx(styles.input)}>
              <p>Password</p>
              <input type="password" placeholder="Enter Password" value={pwd} onChange={(event) => handleChangeValue(event, setPwd)} />
            </div>
            <div className={clsx(styles.submit)}>
              <button disabled={isDisabled || isLoading} onClick={signIn}>
                {isLoading ? "Signing in..." : "Sign in"}
                <Image src={right_arrow.src} alt={right_arrow.alt} />
              </button>
            </div>
          </div>
          <div className={clsx(styles.belt)}>
            <p>ⓒ hAIre</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SignIn;