// ── React ──
import React, { MouseEvent, useState } from "react";

// ── External Libraries ──
import clsx from "clsx";

// ── Internal Modules ──
import Dialog from "@/components/Dialog";
import { AgentDetail, Agent } from "@/types/agent";

// ── Styles ──
import styles from "@/styles/components/AgentDetailDialog.module.css";

interface AgentDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (slug: Agent["slug"], callback?: () => void) => void;
  onUnSubscribe: (slug: Agent["slug"], callback?: () => void) => void;
  onUse: (slug: Agent["slug"], event: MouseEvent) => void;
  subscribed: Agent["slug"][];
  agentDetail: AgentDetail | null;
};

const LABEL_MAP: Record<string, string> = {
  engine: "실행 환경",
  entry_point: "시작 파일",
  dependencies: "필요 패키지",
  provider: "AI 서비스",
  model: "AI 모델",
  temperature: "창의성 수준",
  max_tokens: "최대 응답 길이",
};

const formatPrice = (price: number): string => {
  return `$${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const AgentDetailDialog = (props: AgentDetailDialogProps) => {
  // ── State ──
  const [isSubscribeLoading, setIsSubscribeLoading] = useState<boolean>(false);

  // ── Derived ──
  const detail = props.agentDetail;
  const isSubscribed = detail ? props.subscribed.includes(detail.slug) : false;

  // ── Handlers ──
  const handleSubscribe = () => {
    if (!detail || isSubscribeLoading) return;
    setIsSubscribeLoading(true);
    props.onSubscribe(detail.slug, () => {
      setIsSubscribeLoading(false);
    });
  };

  const handleUnsubscribe = () => {
    if (!detail || isSubscribeLoading) return;
    setIsSubscribeLoading(true);
    props.onUnSubscribe(detail.slug, () => {
      setIsSubscribeLoading(false);
    });
  };

  return (
    <Dialog isOpen={props.isOpen} onClose={props.onClose}>
      {detail ? (
        <React.Fragment>
          {/* Header */}
          <div className={clsx(styles["panel-header"])}>
            <div className={clsx(styles["header-icon"])}>{detail.info.icon}</div>
            <div className={clsx(styles["header-info"])}>
              <h2 className={clsx(styles["header-name"])}>{detail.info.name}</h2>
              <div className={clsx(styles["header-meta"])}>
                <span className={clsx(styles["version-badge"])}>{detail.info.version}</span>
                <span className={clsx(styles["slug-text"])}>{detail.info.slug}</span>
              </div>
            </div>
            <div className={clsx(styles["header-price"])}>{formatPrice(detail.info.price)}</div>
          </div>

          {/* Content */}
          <div className={clsx(styles["panel-content"])}>

            {/* Description */}
            <div className={clsx(styles["section"])}>
              <div className={clsx(styles["section-label"])}>
                <span>📄</span>
                <h4>소개</h4>
              </div>
              <p className={clsx(styles["description-text"])}>{detail.info.description}</p>
            </div>

            {/* AI Model Info (simplified) */}
            <div className={clsx(styles["section"])}>
              <div className={clsx(styles["section-label"])}>
                <span>🧠</span>
                <h4>사용 중인 AI</h4>
              </div>
              <div className={clsx(styles["info-grid"])}>
                <div className={clsx(styles["info-item"])}>
                  <span className={clsx(styles["info-key"])}>AI 서비스</span>
                  <span className={clsx(styles["info-value"])}>{detail.resources.llm.provider}</span>
                </div>
                <div className={clsx(styles["info-item"])}>
                  <span className={clsx(styles["info-key"])}>AI 모델</span>
                  <span className={clsx(styles["info-value"])}>{detail.resources.llm.model}</span>
                </div>
              </div>
            </div>

            {/* Auth (simplified for non-devs) */}
            {detail.resources.auth.length > 0 && (
              <div className={clsx(styles["section"])}>
                <div className={clsx(styles["section-label"])}>
                  <span>🔐</span>
                  <h4>필요한 인증</h4>
                </div>
                <div className={clsx(styles["auth-list"])}>
                  {detail.resources.auth.map((auth, idx) => (
                    <div key={idx} className={clsx(styles["auth-item"])}>
                      <span className={clsx(styles["auth-provider"])}>{auth.provider} 계정 인증</span>
                      <span className={clsx(styles["auth-service"])}>{auth.service_name} 서비스에 접근하기 위해 사용자 인증이 필요합니다.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs (simplified) */}
            {detail.inputs.length > 0 && (
              <div className={clsx(styles["section"])}>
                <div className={clsx(styles["section-label"])}>
                  <span>📝</span>
                  <h4>입력 항목</h4>
                </div>
                <div className={clsx(styles["inputs-list"])}>
                  {detail.inputs.map((input, idx) => (
                    <div key={idx} className={clsx(styles["input-card"])}>
                      <div className={clsx(styles["input-header"])}>
                        <span className={clsx(styles["input-name"])}>{input.label || input.name}</span>
                        {input.required && (
                          <span className={clsx(styles["required-badge"])}>필수</span>
                        )}
                      </div>
                      {input.placeholder && (
                        <p className={clsx(styles["input-placeholder"])}>{input.placeholder}</p>
                      )}
                      {input.examples && input.examples.length > 0 && (
                        <div className={clsx(styles["input-examples"])}>
                          <span className={clsx(styles["examples-label"])}>입력 예시:</span>
                          {input.examples.map((ex, eIdx) => (
                            <span key={eIdx} className={clsx(styles["example-tag"])}>{ex}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Actions */}
          <div className={clsx(styles["panel-actions"])}>
            <button className={clsx(styles["btn-close"])} onClick={props.onClose}>
              닫기
            </button>
            {!isSubscribed && (
              <button
                className={clsx(styles["btn-subscribe-base"], styles["btn-subscribe"])}
                disabled={isSubscribeLoading}
                onClick={handleSubscribe}
              >
                {isSubscribeLoading ? "구독중..." : "구독하기"}
              </button>
            )}
            {isSubscribed && (
              <button
                className={clsx(styles["btn-subscribe-base"], styles["btn-unsubscribe"])}
                disabled={isSubscribeLoading}
                onClick={handleUnsubscribe}
              >
                {isSubscribeLoading ? "취소중..." : "구독취소"}
              </button>
            )}
            <button
              className={clsx(styles["btn-use"])}
              onClick={(event) => props.onUse(detail.slug, event)}
            >
              사용하기
            </button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {/* Skeleton Header */}
          <div className={clsx(styles["panel-header"])}>
            <div className={clsx(styles["skeleton-line"], styles["skeleton-icon"])} />
            <div className={clsx(styles["header-info"])}>
              <div className={clsx(styles["skeleton-line"], styles["skeleton-name"])} />
              <div className={clsx(styles["skeleton-line"], styles["skeleton-meta"])} />
            </div>
          </div>

          {/* Skeleton Content */}
          <div className={clsx(styles["panel-content"])}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={clsx(styles["section"])}>
                <div className={clsx(styles["skeleton-line"], styles["skeleton-section-label"])} />
                <div className={clsx(styles["skeleton-line"], styles["skeleton-text-full"])} />
                <div className={clsx(styles["skeleton-line"], styles["skeleton-text-medium"])} />
                <div className={clsx(styles["skeleton-line"], styles["skeleton-text-short"])} />
              </div>
            ))}
          </div>

          {/* Skeleton Actions */}
          <div className={clsx(styles["panel-actions"])}>
            <div className={clsx(styles["skeleton-line"], styles["skeleton-btn"])} />
            <div className={clsx(styles["skeleton-line"], styles["skeleton-btn"])} />
            <div className={clsx(styles["skeleton-line"], styles["skeleton-btn"])} />
          </div>
        </React.Fragment>
      )}
    </Dialog>
  );
};

export default AgentDetailDialog;
