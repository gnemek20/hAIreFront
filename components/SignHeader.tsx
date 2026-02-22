import Image from "next/image";
import { useRouter } from "next/router";

import clsx from "clsx";

import { navigateHandler } from "@/utils/navigate";
import styles from "@/styles/components/SignHeader.module.css";

const ICON_LOGO = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

interface SignHeaderProps {
  message: string;
  linkText: string;
}

const SignHeader = ({ message, linkText }: SignHeaderProps) => {
  const router = useRouter();

  return (
    <div className={clsx(styles["sign-header"])}>
      <div className={clsx(styles["sign-header-inner"])}>
        <div className={clsx(styles["header-title"])} onClick={navigateHandler(router, "/")}>
          <Image src={ICON_LOGO.src} alt={ICON_LOGO.alt} />
          <h1>hAIre</h1>
        </div>
        <div className={clsx(styles["header-nav"])}>
          <p>{message} <a href={`/${linkText.toLowerCase().replace(/ /g, "")}`}>{linkText}</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignHeader;