import { Suspense } from "react";

import { ResumeBuilder } from "@/features/resume/resume-builder";

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<main id="main-content" aria-busy="true"><h1>Resume review</h1><p>Loading review workspace…</p></main>}>
      <ResumeBuilder />
    </Suspense>
  );
}
