"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP);

export function useLandingMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (
        !scope.current ||
        !window.matchMedia ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo(
        "[data-hero-image]",
        { scale: 0.8, opacity: 0.55 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero-image]",
            start: "top 88%",
            end: "bottom 38%",
            scrub: 0.7,
          },
        },
      );

      ScrollTrigger.create({
        trigger: "[data-readiness-journey]",
        start: "top 14%",
        end: "bottom 72%",
        pin: "[data-readiness-heading]",
        pinSpacing: false,
      });

      gsap.utils.toArray<HTMLElement>("[data-evidence-panel]").forEach((panel) => {
        gsap.fromTo(
          panel,
          { scale: 0.9, opacity: 0.35 },
          {
            scale: 1,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 82%",
              end: "top 48%",
              scrub: 0.45,
            },
          },
        );
      });
    },
    { scope },
  );
}
