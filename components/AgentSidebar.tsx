import { useUser } from "@/contexts/UserContext";
import style from "@/styles/AgentSidebar.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const logoIcon = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const agentIcon = {
  src: require("@/public/icons/agent.svg"),
  alt: "agent"
};

const uploadIcon = {
  src: require("@/public/icons/upload.svg"),
  alt: "upload"
};

const profileIcon = {
  src: require("@/public/icons/profile.svg"),
  alt: "profile"
};

const AgentSidebar = () => {
  const router = useRouter();
  const { name, signOut } = useUser();

  const agentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [toggledCategory, setToggledCategory] = useState<"find" | "share" | null>(null);
  const [toggledAgent, setToggledAgent] = useState<string>("");
  const [toggledProfilePanel, setToggledProfilePanel] = useState<boolean>(false);

  const [username, setUsername] = useState<string>("");

  const reload = () => {
    router.reload();
  };

  const pushWithQuery = (pathname: string, query: { [key: string]: string }) => {
    router.push({
      pathname,
      query
    });
  };

  const handleChangeToggledProfilePanelState = () => {
    setToggledProfilePanel(!toggledProfilePanel);
  };

  useEffect(() => {
    if (toggledAgent === "") return;

    const index = parseInt(toggledAgent);
    const target = agentRefs.current[index];
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [toggledAgent]);

  useEffect(() => {
    if (name !== "") setUsername(name);
  }, [name]);

  useEffect(() => {
    if (Object.keys(router.query).length === 0) return;

    const category = router.query["category"];
    if (category?.includes("find")) setToggledCategory("find");
    else if (category?.includes("share")) setToggledCategory("share");
    else setToggledCategory(null);

    const agent = router.query["agent"];
    if (agent && !Array.isArray(agent)) setToggledAgent(agent);
    else setToggledAgent("")

    if (!category && !agent) signOut();
  }, [router.query]);

  return (
    <div className={clsx(style.container)}>
      <div className={clsx(style.logoContainer)}>
        <div onClick={reload}>
          <Image src={logoIcon.src} alt={logoIcon.alt} />
        </div>
      </div>
      <div className={clsx(style.categoryContainer)}>
        <div className={clsx({ [style.toggledCategory]: toggledCategory === "find" })} onClick={() => pushWithQuery("/agent", { category: "find" })}>
          <Image src={agentIcon.src} alt={agentIcon.alt} />
          <p>Find Agent</p>
        </div>
        <div className={clsx({ [style.toggledCategory]: toggledCategory === "share" })} onClick={() => pushWithQuery("/agent", { category: "share" })}>
          <Image src={uploadIcon.src} alt={uploadIcon.alt} />
          <p>Share Agent</p>
        </div>
      </div>
      <div className={clsx(style.agentsContainer)}>
        <div className={clsx(style.agentsTitle)}>
          <p>My Agents</p>
        </div>
        <div className={clsx(style.agentsList)}>
          {Array(35).fill(0).map((_, idx) => (
            <div ref={el => {agentRefs.current[idx] = el}} className={clsx({ [style.toggledAgent]: toggledAgent === idx.toString() })} onClick={() => pushWithQuery("/agent", { agent: idx.toString() })} key={idx}>
              <p>{`Agent${idx}`}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={clsx(style.profileContainer)}>
        <div onClick={handleChangeToggledProfilePanelState}>
          <Image src={profileIcon.src} alt={profileIcon.alt} />
          <p>{ username }</p>
        </div>
        <div className={clsx(style.profilePanel, { [style.toggledProfilePanel]: toggledProfilePanel })} onClick={signOut}>
          <p>Sign out</p>
        </div>
      </div>
    </div>
  );
};

export default AgentSidebar;