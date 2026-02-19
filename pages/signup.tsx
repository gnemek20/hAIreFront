import SignHeader from "@/components/SignHeader";
import styles from "@/styles/pages/signup.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";

const right_arrow = {
  src: require("@/public/assets/right-arrow.svg"),
  alt: "logo"
};

const SignUp = () => {
  const router = useRouter();

  const [id, setId] = useState<string>("");
  const [pwd, setPwd] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signUp = async () => {
    if (isLoading || isDisabled) return;
    setIsLoading(true);

    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          pwd: pwd,
          username: username
        })
      });
      if (!res.ok) return;

      router.replace("/signin");
    } catch (error) {
      window.alert("Server error");
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
    if (key === "Enter") signUp();
  };

  useEffect(() => {
    if (id !== "" && pwd !== "" && username !== "") setIsDisabled(false);
    else setIsDisabled(true);
  }, [id, pwd, username]);

  return (
    <React.Fragment>
      <SignHeader p="Alreay has account?" a="Sign in" />
      <div className={clsx(styles.container)}>
        <div className={clsx(styles.form)} onKeyDown={handlePressEnter}>
          <div className={clsx(styles.field)}>
            <div className={clsx(styles.formTitle)}>
              <h1>Sign up</h1>
              <p>Join the AI Agent Marketplace</p>
            </div>
            <div className={clsx(styles.input)}>
              <p>ID</p>
              <input type="text" placeholder="at least 3 characters" value={id} onChange={(event) => handleChangeValue(event, setId)} />
            </div>
            <div className={clsx(styles.input)}>
              <p>Password</p>
              <input type="password" placeholder="at least 6 characters" value={pwd} onChange={(event) => handleChangeValue(event, setPwd)} />
            </div>
            <div className={clsx(styles.input)}>
              <p>Username</p>
              <input type="text" placeholder="Username to be displayed" value={username} onChange={(event) => handleChangeValue(event, setUsername)} />
            </div>
            <div className={clsx(styles.submit)}>
              <button disabled={isDisabled || isLoading} onClick={signUp}>
                {isLoading ? "Creating account..." : "Create account"}
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

export default SignUp;