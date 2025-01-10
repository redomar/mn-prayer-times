// app/providers.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import PostHogPageView from "./PostHogPageView";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
  const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  useEffect(() => {
    posthog.init(KEY, {
      api_host: "/ingest",
      ui_host: 'https://eu.posthog.com',
      capture_pageview: true, // Disable automatic pageview capture, as we capture manually
      person_profiles: "always", // Enables capturing of person profiles
    });
  }, [KEY, HOST]);

  console.log("PostHogProvider, KEY:", KEY);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
