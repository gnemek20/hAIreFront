import React from "react";
import Image from "next/image";

import clsx from "clsx";

import styles from "@/styles/components/Hero.module.css";
import { useRouter } from "next/router";
import { navigateHandler } from "@/utils/navigate";

const HERO_BACKGROUND = {
  src: require("@/public/assets/hero-background.png"),
  alt: "background"
};

const ICON_AGENT_BOT = {
  src: require("@/public/assets/agent-bot.svg"),
  alt: "agent"
};

const HERO_TEXT = {
  h1: [
    "Find the AI Agent",
    "Built for You"
  ].join("\n"),
  p: [
    "Explore expert-built AI Agents through simple chat.",
    "No coding required."
  ].join("\n")
};

const Hero = () => {
  const router = useRouter();

  return (
    <React.Fragment>
      <div className={clsx(styles["hero-background"])}>
        <Image src={HERO_BACKGROUND.src} alt={HERO_BACKGROUND.alt} />
      </div>
      <div className={clsx(styles["hero-content"])}>
        <div className={clsx(styles["hero-intro"])}>
          <div className={clsx(styles["hero-badge"])}>
            <div>
              <p>Welcome to AI Agent Marketplace</p>
            </div>
          </div>
          <div className={clsx(styles["hero-title"])}>
            <h1>{HERO_TEXT.h1}</h1>
            <p>{HERO_TEXT.p}</p>
          </div>
          <div className={clsx(styles["hero-action"])}>
            <div onClick={navigateHandler(router, "/share")}>
              <Image src={ICON_AGENT_BOT.src} alt={ICON_AGENT_BOT.alt} />
              <p>or Share Agent</p>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Hero;