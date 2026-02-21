import styles from "@/styles/pages/marketplace.module.css";
import Hero from "@/components/Hero";
import clsx from "clsx";
import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AgentDetailType, AgentType } from "@/types/agentTypes";
import { useRouter } from "next/router";
import { debounceTimer } from "@/utils/timer";
import { useUser } from "@/contexts/UserContext";
import TopSticky from "@/components/TopSticky";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import OverlayPanel from "@/components/OverlayPanel";
import { toast } from "sonner";

const up_chart = {
  src: require("@/public/assets/up-chart.svg"),
  alt: "up"
};

const tag_list = [
  "All",
  "Develop"
];

const dummyData: AgentType[] = [
  {
    slug: "blind-resume-scanner",
    name: "[Mock Data] 블라인드 레쥬메 스캐너",
    version: "1.0.7",
    description: "[Nothing Event] 채용 공고(JD)와 지원자 이력서를 입력하면, 편향을 제거한 블라인드 요약본과 역량 매칭 점수를 생성합니다.",
    price: 1500,
    icon: "👥",
  },
  {
    slug: "meeting-action-extractor",
    name: "[Mock Data] 회의록 액션아이템 추출기",
    version: "1.4.1",
    description: "[Nothing Event] 회의록 텍스트에서 핵심 요약과 담당자별 액션아이템을 자동으로 추출합니다.",
    price: 700,
    icon: "📋",
  },
  {
    slug: "privacy-masker",
    name: "[Mock Data] 개인정보 마스킹 에이전트",
    version: "1.5.2",
    description: "[Nothing Event] 문서 속 개인정보를 자동으로 탐지하고 마스킹 처리하여 안전한 문서를 생성합니다.",
    price: 800,
    icon: "🛡️",
  },
  {
    slug: "receipt-organizer",
    name: "[Mock Data] 영수증 & 인보이스 정리봇",
    version: "1.8.1",
    description: "[Nothing Event] 영수증과 인보이스 내용을 입력하면 항목별로 분류하고 경비 보고서를 자동 생성합니다.",
    price: 500,
    icon: "🧾",
  },
  {
    slug: "rfp-generator",
    name: "[Mock Data] RFP/제안서 초안 생성기",
    version: "1.14.1",
    description: "[Nothing Event] 고객사 정보와 우리 서비스 소개를 입력하면, 맞춤형 제안서 초안과 예상 질문 리스트를 생성합니다.",
    price: 1200,
    icon: "📑",
  },
  {
    slug: "trend-scout-copywriter",
    name: "[Mock Data] 트렌드 스카우트 & 카피라이터",
    version: "1.0.0",
    description: "[Nothing Event] 키워드 또는 경쟁사 URL을 입력하면 최신 트렌드를 분석하고, 브랜드 톤에 맞는 마케팅 콘텐츠 대본을 생성합니다.",
    price: 900,
    icon: "📈",
  },
  {
    slug: "cover-letter-coach",
    name: "[Mock Data] 자기소개서 코치",
    version: "1.0.1",
    description: "[Nothing Event] 채용 공고와 본인 경력을 입력하면, 직무에 맞춘 자기소개서 초안과 항목별 피드백을 생성합니다.",
    price: 700,
    icon: "✍️",
  },
];

const Marketplace = () => {
  const router = useRouter();
  const user = useUser();
  const subscriptions = useSubscriptions();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [agentsData, setAgentsData] = useState<AgentType[]>([]);
  const [agents, setAgents] = useState<AgentType[][]>([]);
  const [agentDetail, setAgentDetail] = useState<AgentDetailType | null>(null);

  const [subscribedSlugs, setSubscribedSlugs] = useState<AgentType["slug"][]>([]);

  const [searchValue, setSearchValue] = useState<string>("");

  const [toggledTag, setToggledTag] = useState<string>(tag_list[0]);
  const [toggledPage, setToggledPage] = useState<number>(1);
  const [toggledOverlay, setToggledOverlay] = useState<boolean>(false);

  const changeTag = (newTag: string) => {
    setToggledTag(newTag);
  };

  const changePage = (newPage: number) => {
    router.push({
      pathname: router.pathname,
      query: { page: newPage }
    }, undefined, { shallow: true });
  };

  const sliceArray = (arr: AgentType[], size = 6): AgentType[][] => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  };

  const getAgentDetail = async (slug: AgentType["slug"]) => {
    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/api/agents/${slug}`, {
        method: "GET"
      });

      const data = await res.json();
      const detail = data["agent"] as Omit<AgentDetailType, "slug">;

      setAgentDetail({
        slug,
        ...detail,
        modelcard: data.model_card
      });
    } catch (error) {
      window.alert("Get agent detail error");
      router.reload();
    }
  };

  const getAgents = async () => {
    const serverURL = process.env.NEXT_PUBLIC_AGENT_SERVER;
    if (!serverURL) return;

    try {
      const res = await fetch(`${serverURL}/api/agents`, {
        method: "GET"
      });
      if (!res.ok) return;

      const data = await res.json();
      // setAgentsData(data["agents"]);
      setAgentsData([...data["agents"], ...dummyData]);
    } catch (error) {
      window.alert("Get agents error");
      router.reload();
    }
  };

  const searchAgents = () => {
    if (agentsData.length === 0) return;

    let result = [];
    for (const ag of agentsData) {
      if (ag.name?.includes(searchValue) || ag.description?.includes(searchValue)) result.push(ag);
    }

    computeAgents(result);
  };

  const computeAgents = (candidates: AgentType[]) => {
    const sliced = sliceArray(candidates);
    setAgents(sliced);
  };

  const subscribeAgent = async (newSlug: AgentType["slug"]) => {
    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!user.token) return;

    try {
      const res = await fetch(`${serverURL}/users/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          subscriptions: [newSlug]
        })
      });

      const data = await res.json();

      if (res.ok) {
        const newSubscription = [...subscribedSlugs, newSlug];
        subscriptions.setSubs(newSubscription)
        setSubscribedSlugs(newSubscription);
      }
      else {
        console.error("Subscribe failed:", data.detail || data);
      }
    } catch (error) {
      window.alert("Subscribe error");
      router.reload();
    }
  };

  const unSubscribeAgent = async (targetSlug: AgentType["slug"]) => {
    const serverURL = process.env.NEXT_PUBLIC_USER_SERVER;
    if (!user.token) return;

    try {
      const res = await fetch(`${serverURL}/users/subscriptions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: user.token,
          slug: targetSlug
        })
      });

      const data = await res.json();

      if (res.ok) {
        const newSubscription = subscribedSlugs.filter(slug => slug !== targetSlug);
        subscriptions.setSubs(newSubscription);
        setSubscribedSlugs(newSubscription);
      }
      else {
        console.error("unSubscribe failed:", data.detail || data);
      }
    } catch (error) {
      window.alert("unSubscribe error");
      router.reload();
    }
  };

  const handleClickAgent = (targetSlug: AgentType["slug"]) => {
    if (!user.hasAuth()) {
      router.push("/signin");
      return;
    }

    const isReal = dummyData.flat().some(d => d.slug === targetSlug);
    if (isReal) return;

    setToggledOverlay(true);
    getAgentDetail(targetSlug);
    
    // if (subscribedSlugs.includes(targetSlug)) unSubscribeAgent(targetSlug);
    // else subscribeAgent(targetSlug);
  };

  const handleSubscribeAgent = async (slug: AgentType["slug"], callback?: () => void) => {
    await subscribeAgent(slug);
    if (callback) callback();
  };

  const handleUnSubscribeAgent = async (slug: AgentType["slug"], callback?: () => void) => {
    await unSubscribeAgent(slug);
    if (callback) callback();
  };

  const handleUseAgent = (slug: AgentType["slug"]) => {
    if (!subscribedSlugs.includes(slug)) {
      toast.warning("먼저 Agent를 구독해주세요.");
      return;
    }
    
    router.push({
      pathname: "/chat",
      query: { room: slug }
    });
  };

  const handleChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const value = target.value;
    
    setSearchValue(value);
  };

  const handlePressEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "Enter") searchAgents();
  };

  useEffect(() => {
    debounceTimer(timerRef, () => {searchAgents()});
  }, [searchValue]);

  useEffect(() => {
    if (agentsData.length === 0) return;
    computeAgents(agentsData);
  }, [agentsData]);

  useEffect(() => {
    if (!user.hasAuth()) {
      setSubscribedSlugs([]);
      return;
    }
    
    setSubscribedSlugs(subscriptions.subs);
  }, [user.token]);

  useEffect(() => {
    const page = router.query["page"] as string;
    if (page) setToggledPage(parseInt(page));

    getAgents();
  }, [router.query]);

  return (
    <React.Fragment>
      <OverlayPanel isOpen={toggledOverlay} onClose={() => setToggledOverlay(false)} onSubscribe={handleSubscribeAgent} onUnSubscribe={handleUnSubscribeAgent} onUse={handleUseAgent} subscribed={subscribedSlugs} agentDetail={agentDetail} />
      <TopSticky />
      <Hero />
      <div className={clsx(styles.searchBox)}>
        <div onKeyDown={handlePressEnter}>
          <input type="text" placeholder="Search Agent..." value={searchValue} onChange={handleChangeSearchValue} />
          <button onClick={searchAgents}>Search</button>
        </div>
      </div>
      <div className={clsx(styles.tagBox)}>
        <div className={clsx(styles.tagList)}>
          {tag_list.map((tag, idx) => (
            <div className={clsx({ [styles.toggledTag]: toggledTag === tag })} onClick={() => changeTag(tag)} key={idx}>
              <p>{tag}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={clsx(styles.agentBox)}>
        <div className={clsx(styles.agentWrapper)}>
          <div className={clsx(styles.order)}>
            <div>
              <h2>AI Agents</h2>
              <h2>{`(${agents.flat().length})`}</h2>
            </div>
            <div>
              <Image src={up_chart.src} alt={up_chart.alt} />
              <p>Default</p>
            </div>
          </div>
          <div className={clsx(styles.agentList)}>
            {agents?.[toggledPage - 1]?.map((agent, idx) => (
              <div onClick={() => handleClickAgent(agent["slug"])} key={idx}>
                <div className={clsx(styles.agentProfile)}>
                  <div>
                    <div className={clsx(styles.title)}>
                      <div className={clsx(styles.name)}>
                        <h4>{`${agent.icon} ${agent.name}`}</h4>
                      </div>
                      <div className={clsx(styles.version)}>
                        <p>{agent.version}</p>
                      </div>
                    </div>
                    <div className={clsx(styles.description)}>
                      <p>{agent.description}</p>
                    </div>
                  </div>
                  <hr />
                  <div className={clsx(styles.option)}>
                    <div className={clsx(styles.subscribe, { [styles.subscribed]: subscribedSlugs.includes(agent.slug) })}>
                      <p>구독</p>
                    </div>
                    <div className={clsx(styles.price)}>
                      <p>{`\\${agent.price}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {agents.length > 1 && (
            <div className={clsx(styles.listIndex)}>
              {agents.map((_, idx) => (
                <div className={clsx({ [styles.toggledIndex]: toggledPage === idx + 1 })} onClick={() => changePage(idx + 1)} key={idx}>
                  <p>{idx + 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default Marketplace;