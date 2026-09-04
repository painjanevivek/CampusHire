import type { SVGProps } from "react";

/**
 * CampusHire's Bridge C mark. The teal join represents the handoff from
 * campus readiness to an employer opportunity.
 */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-brand-mark="bridge-c"
      {...props}
    >
      <rect width="64" height="64" rx="16" fill="#2557D6" />
      <path
        d="M46 19.5A18 18 0 1 0 46 44.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="10"
      />
      <path
        d="M9.8 27.2C13.2 29.4 16.6 29.4 20 27.2V36.8C16.6 34.6 13.2 34.6 9.8 36.8Z"
        fill="#20B8A6"
      />
    </svg>
  );
}
