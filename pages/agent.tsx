import style from "@/styles/agent.module.css";
import AgentSidebar from "@/components/AgentSidebar"
import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FindAgent from "@/components/FindAgent";
import ShareAgent from "@/components/ShareAgent";
import UseAgent from "@/components/UseAgent";
import { useUser } from "@/contexts/UserContext";

const Agent = () => {
  const router = useRouter();
  const { isSigned } = useUser();

  const [workComponent, setWorkComponent] = useState<React.ReactElement | null>(null);

  useEffect(() => {
    const category = router.query["category"] as string;
    const agent = router.query["agent"] as string;

    if (category?.includes("find")) setWorkComponent(<FindAgent />);
    else if (category?.includes("share")) setWorkComponent(<ShareAgent />);
    else if (agent) setWorkComponent(<UseAgent agent={agent} />);
    else setWorkComponent(null);
  }, [router.query]);

  useEffect(() => {
    if (!isSigned()) router.replace({
      pathname: "/auth/signin",
      query: router.query
    });
  }, []);

  return (
    <div className={clsx(style.container)}>
      <AgentSidebar />
      <div className={clsx(style.dashboard)}>
        {workComponent}
      </div>
    </div>
  );
};

export default Agent;