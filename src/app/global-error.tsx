"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="statePage">
          <p className="eyebrow">Workspace unavailable</p>
          <h1>CampusHire could not start safely.</h1>
          <p>Your saved work is unaffected. Reload the workspace to continue.</p>
          <Button onClick={reset}>Reload workspace</Button>
        </main>
      </body>
    </html>
  );
}
