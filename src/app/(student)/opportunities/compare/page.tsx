import { Suspense } from "react";
import { Comparison } from "@/features/experience/comparison";
export default function ComparisonPage() { return <Suspense fallback={<main id="main-content"><h1>Compare roles</h1><p role="status">Loading comparison…</p></main>}><Comparison /></Suspense>; }
