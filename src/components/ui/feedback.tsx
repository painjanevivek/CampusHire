import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "./button";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Alert({ children, tone = "info", ...props }: HTMLAttributes<HTMLDivElement> & { tone?: "info" | "error" | "success" | "warning" }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`alert alert--${tone}`} {...props}>{children}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="emptyState"><h2>{title}</h2><p>{children}</p>{action}</section>;
}

export function RequestState({
  state,
  title,
  children,
  onRetry,
}: {
  state: "loading" | "empty" | "error" | "offline" | "maintenance" | "provider-unavailable";
  title: string;
  children: ReactNode;
  onRetry?: () => void;
}) {
  const live = state === "loading" ? "polite" : "assertive";
  return (
    <section className="emptyState" aria-live={live} aria-busy={state === "loading"}>
      <p className="eyebrow">{state.replace("-", " ")}</p>
      <h2>{title}</h2>
      <p>{children}</p>
      {onRetry && state !== "loading" ? <Button onClick={onRetry}>Try again</Button> : null}
    </section>
  );
}
