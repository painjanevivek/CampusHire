"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleDashed, ListChecks } from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import type { DashboardApiResponse } from "./types";
import styles from "./activation-progress.module.css";

type Activation = DashboardApiResponse["activation"];

export function ActivationProgress() {
  const [activation, setActivation] = useState<Activation>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const dashboard = await apiRequest<DashboardApiResponse>("/dashboard", {
        cache: "no-store",
      });
      setActivation(dashboard.activation ?? []);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const complete = activation.filter((item) => item.status === "complete").length;
  const current = activation.find((item) => item.status === "current");

  return (
    <details
      className={styles.root}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-label={`${open ? "Close" : "Open"} activation checklist`}>
        <ListChecks size={18} aria-hidden="true" />
        <span>{activation.length && complete === activation.length ? "Activated" : `${complete}/${activation.length || 6}`}</span>
      </summary>
      <section aria-label="Activation checklist">
        <header>
          <p>Student activation</p>
          <strong>{current ? current.label : unavailable ? "Progress unavailable" : "All steps complete"}</strong>
        </header>
        {unavailable ? (
          <p className={styles.notice}>Your saved progress is unchanged. Refresh this checklist when your connection returns.</p>
        ) : (
          <ol>
            {activation.map((item) => (
              <li key={item.key} data-status={item.status}>
                {item.status === "complete" ? <Check aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}
                <span>
                  <Link href={item.href}>{item.label}</Link>
                  <small>{item.status === "current" ? `${item.estimated_minutes} min · Unlocks ${item.unlocks.toLowerCase()}` : item.unlocks}</small>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </details>
  );
}
