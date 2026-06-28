"use client";

import { useEffect } from "react";
import { getAnalyticsClient } from "@/lib/firebase";

/**
 * Mounts Firebase Analytics on the client once, after hydration. Renders
 * nothing. Drop it in the root layout so every route is tracked. Failures
 * (unsupported browser, blocked storage) are swallowed — analytics should
 * never break the page.
 */
export function FirebaseAnalytics() {
  useEffect(() => {
    getAnalyticsClient().catch(() => {
      /* analytics unavailable — no-op */
    });
  }, []);

  return null;
}
