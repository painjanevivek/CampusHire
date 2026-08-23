"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { apiRequest, csrfRequest } from "@/lib/api/client";
import { safeInternalHref } from "@/lib/navigation";
import type { Notification, NotificationPage } from "./types";
import styles from "./notification-center.module.css";

export function NotificationCenter({
  navigate = (href) => window.location.assign(href),
}: {
  navigate?: (href: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<NotificationPage>({
    items: [],
    unread_count: 0,
  });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setPage(
        await apiRequest<NotificationPage>("/notifications", {
          cache: "no-store",
        }),
      );
      setError("");
    } catch {
      setError("Updates are temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);
  useEffect(() => {
    function close(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node))
        setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  async function follow(item: Notification) {
    const destination = safeInternalHref(item.deep_link, "");
    if (!destination) {
      setError("This update does not contain a safe CampusHire destination.");
      return;
    }
    if (!item.read_at) {
      try {
        const updated = await csrfRequest<Notification>(
          `/notifications/${item.id}/read`,
          { method: "POST" },
        );
        setPage((current) => ({
          items: current.items.map((entry) =>
            entry.id === item.id ? updated : entry,
          ),
          unread_count: Math.max(0, current.unread_count - 1),
        }));
      } catch {
        setError("The update could not be marked as read.");
        return;
      }
    }
    setOpen(false);
    navigate(destination);
  }

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={`Open updates${page.unread_count ? `, ${page.unread_count} unread` : ""}`}
        aria-expanded={open}
        aria-controls="student-updates"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell aria-hidden="true" />
        {page.unread_count ? (
          <span>{page.unread_count > 9 ? "9+" : page.unread_count}</span>
        ) : null}
      </button>
      {open ? (
        <section
          id="student-updates"
          className={styles.panel}
          aria-label="Placement updates"
        >
          <header>
            <div>
              <p>Placement updates</p>
              <h2>
                {page.unread_count
                  ? `${page.unread_count} unread`
                  : "You are up to date"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Refresh updates"
            >
              <CheckCheck aria-hidden="true" />
            </button>
          </header>
          {error ? <p className={styles.error}>{error}</p> : null}
          {!page.items.length && !error ? (
            <p className={styles.empty}>
              Application decisions and constructive placement feedback will
              appear here.
            </p>
          ) : null}
          <div className={styles.items}>
            {page.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={!item.read_at ? styles.unread : ""}
                onClick={() => void follow(item)}
              >
                <span>{item.title}</span>
                <p>{item.body}</p>
                <time dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
