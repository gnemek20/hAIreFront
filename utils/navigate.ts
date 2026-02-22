import { NextRouter } from "next/router";
import { MouseEvent } from "react";

type Url = Parameters<NextRouter["push"]>[0];
type TransitionOptions = Parameters<NextRouter["push"]>[2];

export const navigateHandler = (
  router: NextRouter,
  url: Url,
  options?: TransitionOptions
) => {
  return (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const href = typeof url === "string"
        ? url
        : `${url.pathname ?? ""}${url.query
          ? "?" + new URLSearchParams(
            Object.entries(url.query).reduce<Record<string, string>>(
              (acc, [key, val]) => {
                if (val !== undefined) acc[key] = String(val);
                return acc;
              }, {}
            )
          ).toString()
          : ""
        }`;
      window.open(href, "_blank");
    }
    else {
      router.push(url, undefined, options);
    }
  };
};
