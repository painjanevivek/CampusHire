---
version: 1.0.0
name: Next.js SSR Architecture System
description: A sophisticated, developer-centric design language emphasizing performance metrics, code-readability, and minimalist structural integrity.
colors:
  background: "#FAFAFA"
  foreground: "#111827"
  card-bg: "#FFFFFF"
  border: "#E5E7EB"
  primary: "#000000"
  accent-emerald: "#10B981"
  accent-blue: "#2563EB"
  code-bg: "#111111"
  muted-text: "#6B7280"
typography:
  display:
    family: "Instrument Serif"
    weight: "500"
    lineHeight: "0.9"
  body:
    family: "Inter"
    weight: "400"
    lineHeight: "1.625"
  interface:
    family: "Montserrat"
    weight: "500"
    letterSpacing: "-0.025em"
  monospace:
    family: "JetBrains Mono"
    weight: "400"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "96px"
rounded:
  small: "4px"
  medium: "8px"
  large: "12px"
  card: "24px"
  container: "40px"
  pill: "999px"
components:
  navigation:
    style: "glass-morphism"
    blur: "16px"
    border: "1px solid rgba(229, 231, 235, 0.6)"
  hero:
    alignment: "center"
    background: "grid-pattern"
    padding: "80px"
  metric-card:
    style: "radial-progress"
    color: "emerald-500"
    background: "gray-50"
  code-block:
    background: "#111111"
    syntax: "vivid-typescript"
    border: "1px solid #1F2937"
  blog-article:
    layout: "horizontal-row"
    hover: "shadow-lg"
    transition: "300ms ease"
motion:
  fadeUp: "cubic-bezier(0.16, 1, 0.3, 1) 0.8s"
  marquee: "linear infinite 40s"
  pulse: "cubic-bezier(0.24, 0, 0.38, 1) 2s"
---

# Next.js SSR Architecture System

## Overview

This design system is engineered for technical authority. It balances the elegance of traditional serif typography with the precision of monospaced data displays. The system is optimized for high-performance interfaces where clarity of information, such as readiness and eligibility metrics, is paramount.

## Colors

The palette uses a soft neutral foundation (`#FAFAFA`) to reduce eye strain and high-contrast black for structural hierarchy. Emerald is reserved for success and verified states; blue is used sparingly for interactive highlights.

## Typography

- **Instrument Serif**: large headlines and italic emphasis.
- **Inter**: body copy and general UI text.
- **Montserrat**: navigation, buttons, and interface labels.
- **JetBrains Mono**: technical tags, statuses, and data metrics.

## Spacing and Layout

Use a 4px baseline grid and generous 96px section spacing. Content is centered within a 1280px maximum width. The sticky glass navigation sits above overlays, main content, and the background grid. Primary containers use subtle borders and `0 8px 30px rgb(0 0 0 / 4%)` shadows.

## Shapes and Components

Primary containers use 40px rounding, cards use 24px, and buttons or chips use pill shapes. The shared vocabulary includes a fixed glass navigation, pulse status badges, dark code terminals, radial score rings, and horizontal content cards.

## Motion

Animations follow a natural reveal pattern. Use `fade-up` or `slide-in` for entry and reserve continuous movement for a single supporting marquee. Respect `prefers-reduced-motion` and keep essential content available without animation.

## Usage Rules

- Use italic display text for deliberate headline contrast.
- Keep technical tags and measurements monospaced.
- Prefer light borders and subtle blur over harsh shadows.
- Do not mix serif and sans-serif within a sentence except in an approved headline pattern.

## Accessibility

- Maintain at least 4.5:1 contrast for body text.
- Give icon-only controls descriptive accessible names.
- Use semantic elements such as `nav`, `main`, `article`, and `section`.
- Preserve visible focus and a minimum 44px target for interactive controls.
