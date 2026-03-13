"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState } from "react";

if (typeof window !== "undefined") {
  const stagingParam = new URLSearchParams(window.location.search).get(
    "staging"
  );
  if (stagingParam === "1") window.localStorage.setItem("staging", "1");
  else if (stagingParam === "0") window.localStorage.removeItem("staging");
}

const staging =
  typeof window !== "undefined" &&
  window.localStorage.getItem("staging") === "1";

let url = process.env.NEXT_PUBLIC_CONVEX_URL!;
if (
  staging &&
  url.includes(".convex.cloud") &&
  !url.includes(".test.convex.cloud")
) {
  url = url.replace(".convex.cloud", ".test.convex.cloud");
}
const convex = new ConvexReactClient(url);

// server rendering doesn't know if we are staging
export function StagingIndicator() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(
      typeof window !== "undefined" &&
        window.localStorage.getItem("staging") === "1"
    );
  }, []);
  return show ? " [STAGING]" : null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
