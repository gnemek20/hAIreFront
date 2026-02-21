import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext";
import { UserProvider } from "@/contexts/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import React from "react";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <Head>
        <title>hAIre Agent Market</title>
      </Head>
      <Script src="https://accounts.google.com/gsi/client" />
      <UserProvider>
        <SubscriptionsProvider>
          <Component {...pageProps} />
          <Toaster />
        </SubscriptionsProvider>
      </UserProvider>
    </React.Fragment>
  );
}
