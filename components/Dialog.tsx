// ── React ──
import React, { PointerEvent, useEffect, useRef } from "react";

// ── External Libraries ──
import clsx from "clsx";

// ── Styles ──
import styles from "@/styles/components/Dialog.module.css";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const Dialog = ({ isOpen, onClose, children }: DialogProps) => {
  // ── Refs ──
  const backdropRef = useRef<HTMLDivElement>(null);

  // ── Handlers ──
  const handleBackdropClick = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target === backdropRef.current) onClose();
  };

  // ── Effects ──
  useEffect(() => {
    if (!backdropRef.current) return;

    if (isOpen) {
      document.body.setAttribute("data-scroll-locked", "true");
      backdropRef.current.style.zIndex = "2";
      return;
    }

    setTimeout(() => {
      if (!backdropRef.current) return;
      document.body.removeAttribute("data-scroll-locked");
      backdropRef.current.style.zIndex = "-1";
    }, 150);
  }, [isOpen]);

  return (
    <div
      ref={backdropRef}
      className={clsx(styles["dialog-backdrop"], {
        [styles["dialog-backdrop--closed"]]: !isOpen,
      })}
      onPointerDown={handleBackdropClick}
    >
      <div
        className={clsx(styles["dialog-panel"], {
          [styles["dialog-panel--closed"]]: !isOpen,
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default Dialog;
