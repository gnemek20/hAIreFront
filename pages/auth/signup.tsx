import style from "@/styles/auth.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";

const logoIcon = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const SignUp = () => {
  const router = useRouter();

  const [id, setId] = useState<string>("");
  const [pwd, setPwd] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [submitState, setSubmitState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const home = () => {
    router.replace("/");
  };

  const handleEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "Enter") handleSignUp();
  };

  const handleChangeForm = (event: ChangeEvent<HTMLInputElement>, callback: (str: string) => void) => {
    const target = event.target;
    const value = target.value;

    callback(value);
  };

  const handleSignUp = async () => {
    if (!submitState || isLoading) return;
    setIsLoading(true);

    const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;
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

      router.replace("signin");
    } catch (error) {
      window.alert("Signup Error");
      router.reload();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id !== "" && pwd !== "" && username !== "") setSubmitState(true);
    else setSubmitState(false);
  }, [id, pwd, username]);

  return (
    <div className={clsx(style.container)}>
      <div className={clsx(style.logoContainer)} onClick={home}>
        <Image src={logoIcon.src} alt={logoIcon.alt} />
      </div>
      <div className={clsx(style.titleContainer)}>
        <h1>Sign up for hAIre</h1>
      </div>
      <div className={clsx(style.form)} onKeyDown={handleEnter}>
        <div>
          <p>ID</p>
          <input type="text" placeholder="ID" value={id} onChange={(event) => handleChangeForm(event, setId)} />
        </div>
        <div>
          <p>Password</p>
          <input type="password" placeholder="Password" value={pwd} onChange={(event) => handleChangeForm(event, setPwd)} />
        </div>
        <div>
          <p>Username</p>
          <input type="text" placeholder="Username" value={username} onChange={(event) => handleChangeForm(event, setUsername)} />
        </div>
        <button onClick={handleSignUp} disabled={!submitState || isLoading}>{isLoading ? "Creating account..." : "Create account"}</button>
        <div className={clsx(style.moreContainer)}>
          <p>Already has account? <a href="signin">Sign in</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;