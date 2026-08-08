import { ButtonLink } from "@/components/ui/button";

export default function OfflinePage() {
  return <main id="main-content" className="statePage"><p className="eyebrow">Connection unavailable</p><h1>Your work is still here.</h1><p>Reconnect to save new changes and refresh placement information.</p><ButtonLink href="/">Try again</ButtonLink></main>;
}
