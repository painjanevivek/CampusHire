import type { HTMLAttributes, ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Alert({ children, tone = "info", ...props }: HTMLAttributes<HTMLDivElement> & { tone?: "info" | "error" | "success" | "warning" }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`alert alert--${tone}`} {...props}>{children}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="emptyState"><h2>{title}</h2><p>{children}</p>{action}</section>;
}
