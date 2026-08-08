import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "quiet";

function className(variant: Variant, extra?: string) {
  return ["button", `button--${variant}`, extra].filter(Boolean).join(" ");
}

export function Button({ variant = "primary", className: extra, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={className(variant, extra)} {...props} />;
}

export function ButtonLink({ children, variant = "primary", className: extra, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; variant?: Variant }) {
  return <a className={className(variant, extra)} {...props}>{children}</a>;
}
