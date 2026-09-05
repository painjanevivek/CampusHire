import { Suspense } from "react";
import { Preparation } from "@/features/experience/preparation";

export default function PreparationPage() {
  return <Suspense fallback={<main id="main-content"><h1>Preparation</h1><p role="status">Loading preparation…</p></main>}><Preparation /></Suspense>;
}
