"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";

export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (!path) { setLoading(false); return; }
      setLoading(true); setError("");
      void apiRequest<T>(path, { signal: controller.signal, cache: "no-store" })
        .then(value => { if (!controller.signal.aborted) setData(value); })
        .catch(() => { if (!controller.signal.aborted) setError("This information could not be loaded. Retry to refresh the recorded state."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [path, revision]);
  return { data, error, loading, refresh: () => setRevision(value => value + 1) };
}
