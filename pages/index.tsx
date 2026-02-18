import style from "@/styles/landing.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";

const logoIcon = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const featureMessage = {
  h1: [
    `Use agents or share your own.`,
    `Your agent, your way.`
  ].join("\n"),
  p: [
    `AI agents are everywhere, but using the right one should be simple.`,
    `Find agents that fit you, or upload and trade the ones you create in one marketplace.`
  ].join("\n")
};

const Landing = () => {
  const router = useRouter();

  const push = (path: string) => {
    router.push(path);
  };

  const pushToFindAgent = () => {
    router.push({
      pathname: "/agent",
      query: { category: "find" }
    });
  };

  const pushToShareAgent = () => {
    router.push({
      pathname: "/agent",
      query: { category: "share" }
    });
  };

  return (
    <div className={clsx(style.container)}>
      <div className={clsx(style.topContainer)}>
        <div className={clsx(style.topWrapper)}>
          <div>

          </div>
          <div className={clsx(style.logoContainer)}>
            <Image src={logoIcon.src} alt={logoIcon.alt} />
          </div>
          <div className={clsx(style.signContainer)}>
            <button onClick={() => push("/auth/signin")}>Sign In</button>
            <button onClick={() => push("/auth/signup")}>Sign Up</button>
          </div>
        </div>
      </div>
      <div className={clsx(style.featureContainer)}>
        <div className={clsx(style.message)}>
          <h1>{featureMessage.h1}</h1>
          <p>{featureMessage.p}</p>
        </div>
      </div>
      <div className={clsx(style.startContainer)}>
        <button onClick={pushToFindAgent}>Find Agent</button>
        <button onClick={pushToShareAgent}>Share Agent</button>
      </div>
      {/* TODO: 소개 파트 추가 */}
    </div>
  );
};

export default Landing;