import type { LucideIcon } from "lucide-react";

export function FeatureCard({ icon: Icon, eyebrow, title, description }: { icon: LucideIcon; eyebrow: string; title: string; description: string }) {
  return (
    <article className="featureCard">
      <div className="featureIcon"><Icon size={22} aria-hidden="true" /></div>
      <p className="featureEyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
