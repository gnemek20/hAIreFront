import styles from "@/styles/components/Hero.module.css";
import clsx from "clsx";
import Image from "next/image";
import React from "react";

const hero_background = {
  src: require("@/public/assets/hero-background.png"),
  alt: "background"
};

const agent_bot = {
  src: require("@/public/assets/agent-bot.svg"),
  alt: "agent"
};

const hero_text = {
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
  return (
    <React.Fragment>
      <div className={clsx(styles.background)}>
        <Image src={hero_background.src} alt={hero_background.alt} />
      </div>
      <div className={clsx(styles.content)}>
        <div className={clsx(styles.introduce)}>
          <div className={clsx(styles.additional)}>
            <div>
              <p>Welcome to AI Agent Marketplace</p>
            </div>
          </div>
          <div className={clsx(styles.title)}>
            <h1>{hero_text.h1}</h1>
            <p>{hero_text.p}</p>
          </div>
          <div className={clsx(styles.option)}>
            <div>
              <Image src={agent_bot.src} alt={agent_bot.alt} />
              <p>or Share Agent</p>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Hero;