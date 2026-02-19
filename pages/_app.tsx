import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext";
import { UserProvider } from "@/contexts/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import React from "react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <Script src="https://accounts.google.com/gsi/client" />
      <UserProvider>
        <SubscriptionsProvider>
          <Component {...pageProps} />
        </SubscriptionsProvider>
      </UserProvider>
    </React.Fragment>
  );
}
