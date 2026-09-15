"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { type ReactNode, useRef } from "react";

gsap.registerPlugin(useGSAP);

export function LandingMotion({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (process.env.NODE_ENV === "test") return;
    const reducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    gsap.from("[data-hero-copy] > *", {
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.08,
      y: 24,
    });
    gsap.from("[data-hero-card]", {
      opacity: 0,
      delay: 0.18,
      duration: 0.95,
      ease: "power3.out",
      scale: 0.985,
      y: 34,
    });

    if (!("IntersectionObserver" in window)) return;
    const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]");
    const revealItems = groups.flatMap((group) =>
      Array.from(group.querySelectorAll<HTMLElement>("[data-reveal-item]")),
    );
    gsap.set(revealItems, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = entry.target as HTMLElement;
        const items = group.querySelectorAll<HTMLElement>("[data-reveal-item]");
        gsap.to(items, {
          opacity: 1,
          duration: 0.72,
          ease: "power3.out",
          stagger: 0.09,
          y: 0,
        });
        observer.unobserve(group);
      });
    }, { rootMargin: "0px 0px -12%", threshold: 0.12 });

    groups.forEach((group) => observer.observe(group));
    return () => observer.disconnect();
  }, { scope: root });

  return <div ref={root} className={className}>{children}</div>;
}
