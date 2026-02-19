import styles from "@/styles/components/SignHeader.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/router";

const logo_icon = {
  src: require("@/public/images/logo.png"),
  alt: "logo"
};

const SignHeader = ({ p, a }: { p:string, a: string }) => {
  const router = useRouter();

  return (
    <div className={clsx(styles.header)}>
      <div className={clsx(styles.headerWrapper)}>
        <div className={clsx(styles.title)} onClick={() => router.replace("/")}>
          <Image src={logo_icon.src} alt={logo_icon.alt} />
          <h1>hAIre</h1>
        </div>
        <div className={clsx(styles.option)}>
          <p>{p} <a href={`/${a.toLowerCase().replace(/ /g, "")}`}>{a}</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignHeader;