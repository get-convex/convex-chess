"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";

const staging =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("staging") === "1";

function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL!;
  if (
    staging &&
    url.includes(".convex.cloud") &&
    !url.includes(".test.convex.cloud")
  ) {
    return url.replace(".convex.cloud", ".test.convex.cloud");
  }
  return url;
}

const convex = new ConvexReactClient(getConvexUrl());

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {staging && <StagingParamPreserver />}
      {children}
    </ConvexAuthNextjsProvider>
  );
}

/**
 * Patches history.pushState/replaceState so ?staging=1 is preserved
 * across client-side navigations (Next.js Link clicks, router.push, etc).
 */
function StagingParamPreserver() {
  useEffect(() => {
    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);

    function withStagingParam(
      url: string | URL | null | undefined,
    ): string | URL | null | undefined {
      if (url == null) return url;
      try {
        const parsed = new URL(url.toString(), window.location.origin);
        if (!parsed.searchParams.has("staging")) {
          parsed.searchParams.set("staging", "1");
        }
        return parsed.pathname + parsed.search + parsed.hash;
      } catch {
        return url;
      }
    }

    history.pushState = (data, unused, url) =>
      origPushState(data, unused, withStagingParam(url));
    history.replaceState = (data, unused, url) =>
      origReplaceState(data, unused, withStagingParam(url));

    return () => {
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    };
  }, []);

  return null;
}
