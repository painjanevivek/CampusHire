"use client";

import type { ReactNode, RefObject } from "react";
import { useRef } from "react";
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
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from("[data-landing-header]", { y: -18, autoAlpha: 0, duration: 0.5 })
        .from(
          "[data-hero-copy] > *",
          { y: 28, autoAlpha: 0, duration: 0.72, stagger: 0.08 },
          "-=0.22",
        )
        .from(
          "[data-hero-card]",
          { x: 34, autoAlpha: 0, duration: 0.72 },
          "-=0.5",
        )
        .from(
          "[data-brand-mark]",
          { rotate: -10, scale: 0.82, duration: 0.45 },
          0,
        );

      gsap.to("[data-hero-card]", {
        yPercent: -7,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-landing-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>("[data-reveal-item]");
        if (!items.length) return;

        gsap.from(items, {
          y: 38,
          autoAlpha: 0,
          duration: 0.72,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: group,
            start: "top 82%",
            once: true,
          },
        });
      });
    },
    { scope },
  );
}

type LandingMotionProps = {
  children: ReactNode;
  className?: string;
};

export function LandingMotion({ children, className }: LandingMotionProps) {
  const scope = useRef<HTMLDivElement>(null);
  useLandingMotion(scope);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
