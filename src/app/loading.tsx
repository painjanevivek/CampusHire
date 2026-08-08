import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="statePage" aria-busy="true" aria-label="Loading CampusHire">
      <Skeleton className="skeletonTitle" />
      <Skeleton className="skeletonLine" />
      <Skeleton className="skeletonPanel" />
    </main>
  );
}
