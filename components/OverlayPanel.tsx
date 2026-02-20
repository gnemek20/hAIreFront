import styles from "@/styles/components/OverlayPanel.module.css"
import { AgentDetailType, AgentType } from "@/types/agentTypes";
import clsx from "clsx";
import React, { PointerEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import katexSchema from "@/katexSchema";

interface OverlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (slug: AgentType["slug"], callback?: () => void) => void;
  onUnSubscribe: (slug: AgentType["slug"], callback?: () => void) => void;
  onUse: (slug: AgentType["slug"]) => void;
  subscribed: AgentType["slug"][];
  agentDetail: AgentDetailType | null;
  children?: React.ReactNode;
};

const OverlayPanel = (props: OverlayPanelProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isSubLoading, setIsSubLoading] = useState<boolean>(false);

  const handleClickBackground = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target === overlayRef.current) props.onClose();
  };

  const handleClickSubscribe = () => {
    if (!props.agentDetail || isSubLoading) return;
    setIsSubLoading(true);
    props.onSubscribe(props.agentDetail.slug, () => {
      setIsSubLoading(false);
    });
  };

  const handleClickUnSubscribe = () => {
    if (!props.agentDetail || isSubLoading) return;
    setIsSubLoading(true);
    props.onUnSubscribe(props.agentDetail.slug, () => {
      setIsSubLoading(false);
    });
  };

  useEffect(() => {
    if (!overlayRef.current) return;

    if (props.isOpen) {
      document.body.setAttribute("data-scroll-locked", "true");
      overlayRef.current.style.zIndex = "2";
      return;
    }
    
    setTimeout(() => {
      if (!overlayRef.current) return;
      document.body.removeAttribute("data-scroll-locked");
      overlayRef.current.style.zIndex = "-1";
    }, 150);
  }, [props.isOpen]);

  return (
    <div ref={overlayRef} className={clsx(styles.overlay, { [styles.closeOverlay]: !props.isOpen })} onPointerDown={handleClickBackground}>
      <div className={clsx(styles.panel, { [styles.closePanel]: !props.isOpen })}>
        {/* {props.children} */}
        {props.agentDetail && (
          <React.Fragment>
            <div className={clsx(styles.title)}>
              <h1>{props.agentDetail.info.icon}</h1>
              <h1>{props.agentDetail.info.name}</h1>
            </div>
            <div className={clsx(styles.content)}>
              <div className={clsx(styles.md)}>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex, [rehypeSanitize, katexSchema]]}>
                  {props.agentDetail.modelcard}
                </ReactMarkdown>
              </div>
            </div>
            <div className={clsx(styles.option)}>
              <button className={clsx(styles.closeButton)} onClick={props.onClose}>닫기</button>
              {!props.subscribed.includes(props.agentDetail.slug) && (
                <button className={clsx(styles.subsButton, styles.subscribeButton)} disabled={isSubLoading} onClick={handleClickSubscribe}>
                  {isSubLoading ? "구독중..." : "구독하기"}
                </button>
              )}
              {props.subscribed.includes(props.agentDetail.slug) && (
                <button className={clsx(styles.subsButton, styles.unSubscribeButton)} disabled={isSubLoading} onClick={handleClickUnSubscribe}>
                  {isSubLoading ? "취소중..." : "구독취소"}
                </button>
              )}
              <button className={clsx(styles.useButton)} onClick={() => props.onUse(props.agentDetail!.slug)}>사용하기</button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default OverlayPanel;