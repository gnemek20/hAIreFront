// ── React / Next ──
import React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

// ── External Libraries ──
import { Toaster } from "sonner";

// ── Internal Modules ──
import { UserProvider } from "@/contexts/UserContext";

// ── Styles ──
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <Head>
        <title>hAIre Agent Market</title>
      </Head>
      <Script src="https://accounts.google.com/gsi/client" />
      <UserProvider>
          <Component {...pageProps} />
          <Toaster />
      </UserProvider>
    </React.Fragment>
  );
}
