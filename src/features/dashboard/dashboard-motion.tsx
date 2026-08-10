"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function useDashboardMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (
        typeof window.matchMedia !== "function" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      gsap.from("[data-dashboard-reveal]", {
        autoAlpha: 0,
        y: 18,
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
        clearProps: "all",
      });
    },
    { scope },
  );
}
