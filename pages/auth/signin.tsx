import { useUser } from "@/contexts/UserContext";
import style from "@/styles/auth.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useState } from "react";

const logoIcon = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const SignIn = () => {
  const router = useRouter();
  const { setName } = useUser();

  const [id, setId] = useState<string>("");
  const [pwd, setPwd] = useState<string>("");

  const [submitState, setSubmitState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const home = () => {
    router.replace("/");
  };

  const handleEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "Enter") handleSignIn();
  };

  const handleChangeForm = (event: ChangeEvent<HTMLInputElement>, callback: (str: string) => void) => {
    const target = event.target;
    const value = target.value;

    callback(value);
  };

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;
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
        window.alert("Server Error");

        return;
      }

      setName(data.username);
      document.cookie = `access_token=${data.access_token}; path=/; max-age=${6*60*60}; SameSite=Lax`;
      
      const { category } = router.query;
      router.replace({
        pathname: "/agent", 
        query: (category && !Array.isArray(category)) ? { category: category } : { category: "find" }
      });
    } catch (error) {
      window.alert("Signin Error");
      router.reload();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id !== "" && pwd !== "") setSubmitState(true);
    else setSubmitState(false);
  }, [id, pwd]);

  return (
    <div className={clsx(style.container)}>
      <div className={clsx(style.logoContainer)} onClick={home}>
        <Image src={logoIcon.src} alt={logoIcon.alt} />
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
        <button onClick={handleSignIn} disabled={!submitState || isLoading}>{isLoading ? "Signing in..." : "Sign in"}</button>
        <div className={clsx(style.moreContainer)}>
          <p>New to hAIre? <a href="signup">Create an account</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;