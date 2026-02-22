import React, { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import clsx from "clsx";
import { toast } from "sonner";

import AgentDetailDialog from "@/components/AgentDetailDialog";
import Hero from "@/components/Hero";
import TopSticky from "@/components/TopSticky";
import { useUser } from "@/contexts/UserContext";
import { AgentDetail, Agent } from "@/types/agent";
import { ApiError, agentApi, userApi } from "@/utils/api";
import { debounceTimer } from "@/utils/timer";
import styles from "@/styles/pages/marketplace.module.css";

const ICON_UP_CHART = {
  src: require("@/public/assets/up-chart.svg"),
  alt: "up"
};

const TAG_LIST = [
  "All",
  "Develop"
];

const DUMMY_AGENTS: Agent[] = [
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
    price: 8000,
    icon: "📋",
  },
  {
    slug: "privacy-masker",
    name: "[Mock Data] 개인정보 마스킹 에이전트",
    version: "1.5.2",
    description: "[Nothing Event] 문서 속 개인정보를 자동으로 탐지하고 마스킹 처리하여 안전한 문서를 생성합니다.",
    price: 5123850,
    icon: "🛡️",
  },
  {
    slug: "receipt-organizer",
    name: "[Mock Data] 영수증 & 인보이스 정리봇",
    version: "1.8.1",
    description: "[Nothing Event] 영수증과 인보이스 내용을 입력하면 항목별로 분류하고 경비 보고서를 자동 생성합니다.",
    price: 200,
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

interface MarketplaceProps {
  initialAgents: Agent[];
}

const Marketplace = ({ initialAgents }: MarketplaceProps) => {
  // ── Hooks ──
  const router = useRouter();
  const user = useUser();

  // ── Refs ──
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── State ──
  const hasSSRData = initialAgents.length > 0;
  const [agentsData, setAgentsData] = useState<Agent[]>(
    hasSSRData ? [...initialAgents, ...DUMMY_AGENTS] : []
  );
  const [agents, setAgents] = useState<Agent[][]>([]);
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null);

  const [subscribedSlugs, setSubscribedSlugs] = useState<Agent["slug"][]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [activeTag, setActiveTag] = useState<string>(TAG_LIST[0]);
  const [activePage, setActivePage] = useState<number>(1);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!hasSSRData);

  // ── Helpers ──
  const sliceArray = (arr: Agent[], size = 6): Agent[][] => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  };

  const paginateAgents = (candidates: Agent[]) => {
    const sliced = sliceArray(candidates);
    setAgents(sliced);
  };

  // ── Data Fetching ──
  const fetchAgentDetail = async (slug: Agent["slug"]) => {
    try {
      const data = await agentApi.getAgentDetail(slug);

      setAgentDetail({
        slug,
        ...data.agent,
        modelcard: data.model_card
      });
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Get agent detail failed:", error.data);
        toast.error(`Get agent detail failed: ${error.message}`);
        return;
      }
      window.alert("Get agent detail error");
      router.reload();
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await agentApi.getAgents();
      // setAgentsData(data.agents);
      setAgentsData([...data.agents, ...DUMMY_AGENTS]);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Get agents failed:", error.data);
        toast.error(`Get agents failed: ${error.message}`);
        return;
      }
      window.alert("Get agents error");
      router.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const searchAgents = () => {
    if (agentsData.length === 0) return;

    let result = [];
    for (const ag of agentsData) {
      if (ag.name?.includes(searchQuery) || ag.description?.includes(searchQuery)) result.push(ag);
    }

    paginateAgents(result);
  };

  const computeAgents = (candidates: Agent[]) => {
    const sliced = sliceArray(candidates);
    setAgents(sliced);
  };

  const subscribeAgent = async (newSlug: Agent["slug"]) => {
    if (!user.token) return;

    try {
      await userApi.subscribe(user.token, [newSlug]);

      setSubscribedSlugs(prev => [...prev, newSlug]);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Subscribe failed:", error.data);
        toast.error(`Subscribe failed: ${error.message}`);
        return;
      }
      window.alert("Subscribe error");
      router.reload();
    }
  };

  const unSubscribeAgent = async (targetSlug: Agent["slug"]) => {
    if (!user.token) return;

    try {
      await userApi.unsubscribe(user.token, targetSlug);

      setSubscribedSlugs(prev => prev.filter(slug => slug !== targetSlug));
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Unsubscribe failed:", error.data);
        toast.error(`Unsubscribe failed: ${error.message}`);
        return;
      }
      window.alert("Unsubscribe error");
      router.reload();
    }
  };

  // ── Handlers ──
  const handleClickAgent = (targetSlug: Agent["slug"]) => {
    if (!user.isSignedIn()) {
      router.push("/signin");
      return;
    }

    const isReal = DUMMY_AGENTS.flat().some(d => d.slug === targetSlug);
    if (isReal) return;

    setIsOverlayOpen(true);
    setAgentDetail(null);
    fetchAgentDetail(targetSlug);
    
    // if (subscribedSlugs.includes(targetSlug)) unSubscribeAgent(targetSlug);
    // else subscribeAgent(targetSlug);
  };

  const handleSubscribeAgent = async (slug: Agent["slug"], callback?: () => void) => {
    await subscribeAgent(slug);
    if (callback) callback();
  };

  const handleUnSubscribeAgent = async (slug: Agent["slug"], callback?: () => void) => {
    await unSubscribeAgent(slug);
    if (callback) callback();
  };

  const handleUseAgent = (slug: Agent["slug"], event: MouseEvent) => {
    if (!subscribedSlugs.includes(slug)) {
      toast.warning("먼저 Agent를 구독해주세요.");
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      window.open(`/chat?room=${slug}`, "_blank");
      return;
    }
    
    router.push({
      pathname: "/chat",
      query: { room: slug }
    });
  };

  const handleSelectTag = (newTag: string) => {
    setActiveTag(newTag);
  };

  const handleSelectPage = (newPage: number, event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/?page=${newPage}`, "_blank");
      return;
    }

    router.push({
      pathname: router.pathname,
      query: { page: newPage }
    }, undefined, { shallow: true });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const value = target.value;
    
    setSearchQuery(value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "Enter") searchAgents();
  };

  // ── Effects ──
  useEffect(() => {
    debounceTimer(timerRef, () => {searchAgents()});
  }, [searchQuery]);

  useEffect(() => {
    if (agentsData.length === 0) return;
    computeAgents(agentsData);
  }, [agentsData]);

  useEffect(() => {
    if (!user.isSignedIn()) {
      setSubscribedSlugs([]);
      return;
    }
    if (!user.token) return;
    
    const fetchSubscriptions = async () => {
      try {
        const data = await userApi.getSubscriptions(user.token);
        setSubscribedSlugs(data.subscriptions);
      } catch (error) {
        if (error instanceof ApiError) {
          console.error("Get subscriptions failed:", error.data);
          toast.error(`Failed to load subscriptions: ${error.message}`);
        }
      }
    };

    fetchSubscriptions();
  }, [user.token]);

  useEffect(() => {
    // SSR이 에이전트를 제공하지 못한 경우에만 클라이언트에서 fetch
    if (agentsData.length === 0) fetchAgents();
  }, []);

  useEffect(() => {
    const page = router.query["page"] as string;
    if (page) setActivePage(parseInt(page));
  }, [router.query]);

  return (
    <React.Fragment>
      <AgentDetailDialog
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        onSubscribe={handleSubscribeAgent}
        onUnSubscribe={handleUnSubscribeAgent}
        onUse={handleUseAgent}
        subscribed={subscribedSlugs}
        agentDetail={agentDetail}
      />
      <TopSticky />
      <Hero />

      {/* ── Search ── */}
      <div className={clsx(styles["search-section"])}>
        <div onKeyDown={handleSearchKeyDown}>
          <input
            type="text"
            placeholder="Search Agent..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button onClick={searchAgents}>Search</button>
        </div>
      </div>

      {/* ── Tag Filter ── */}
      <div className={clsx(styles["tag-filter-bar"])}>
        <div className={clsx(styles["tag-filter-list"])}>
          {TAG_LIST.map((tag, idx) => (
            <div
              key={idx}
              className={clsx({
                [styles["tag-filter-item--active"]]: activeTag === tag,
              })}
              onClick={() => handleSelectTag(tag)}
            >
              <p>{tag}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Agent List ── */}
      <div className={clsx(styles["agent-section"])}>
        <div className={clsx(styles["agent-container"])}>

          {/* Header */}
          <div className={clsx(styles["agent-list-header"])}>
            <div>
              <h2>AI Agents</h2>
              <h2>{`(${agents.flat().length})`}</h2>
            </div>
            <div>
              <Image src={ICON_UP_CHART.src} alt={ICON_UP_CHART.alt} />
              <p>Default</p>
            </div>
          </div>

          {/* Grid */}
          <div className={clsx(styles["agent-grid"])}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className={clsx(styles["skeleton-card"])}>
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-title"])} />
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-desc-1"])} />
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-desc-2"])} />
                  <div className={clsx(styles["skeleton-line"], styles["skeleton-desc-3"])} />
                  <hr />
                  <div className={clsx(styles["skeleton-footer"])}>
                    <div className={clsx(styles["skeleton-line"], styles["skeleton-btn"])} />
                    <div className={clsx(styles["skeleton-line"], styles["skeleton-price"])} />
                  </div>
                </div>
              ))
            ) : (
              agents?.[activePage - 1]?.map((agent, idx) => (
              <div key={idx} onClick={() => handleClickAgent(agent["slug"])}>
                <div className={clsx(styles["agent-card-body"])}>

                  {/* Header: Icon + Name + Version */}
                  <div className={clsx(styles["agent-card-header"])}>
                    <div className={clsx(styles["agent-card-icon"])}>{agent.icon}</div>
                    <div className={clsx(styles["agent-card-title"])}>
                      <div className={clsx(styles["agent-card-name"])}>
                        <h4>{agent.name}</h4>
                      </div>
                      <div className={clsx(styles["agent-card-version"])}>
                        <p>{agent.version}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={clsx(styles["agent-card-description"])}>
                    <p>{agent.description}</p>
                  </div>

                  {/* Footer */}
                  <div className={clsx(styles["agent-card-footer"])}>
                    <div
                      className={clsx(
                        styles["agent-subscribe-btn"],
                        { [styles["agent-subscribe-btn--active"]]: subscribedSlugs.includes(agent.slug) }
                      )}
                    >
                      <p>{subscribedSlugs.includes(agent.slug) ? "구독중" : "구독"}</p>
                    </div>
                    <div className={clsx(styles["agent-price"])}>
                      <p>{`$ ${String(agent.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}</p>
                    </div>
                  </div>

                </div>
              </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {agents.length > 1 && (
            <div className={clsx(styles["pagination"])}>
              {agents.map((_, idx) => (
                <div
                  key={idx}
                  className={clsx({
                    [styles["pagination-item--active"]]: activePage === idx + 1,
                  })}
                  onClick={(event) => handleSelectPage(idx + 1, event)}
                >
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

export const getServerSideProps: GetServerSideProps<MarketplaceProps> = async () => {
  try {
    const data = await agentApi.getAgents();
    // docker_image 등 Agent 타입에 없는 필드 제거
    const agents: Agent[] = data.agents.map(({ docker_image, ...rest }) => rest);
    return { props: { initialAgents: agents } };
  } catch {
    // SSR 실패 시 빈 배열 → 클라이언트에서 재시도
    return { props: { initialAgents: [] } };
  }
};

export default Marketplace;