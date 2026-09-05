import type { ReactNode } from "react";

// Keep content and navigation available immediately, including before hydration.
export function LandingMotion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
