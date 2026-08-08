"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="statePage">
      <p className="eyebrow">Page unavailable</p>
      <h1>CampusHire could not load this page.</h1>
      <p>Your saved work is unaffected. Try loading the page again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
