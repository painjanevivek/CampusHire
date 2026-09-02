import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceLoading({ label }: { label: string }) {
  return (
    <main id="main-content" className="workspaceLoading" aria-busy="true" aria-labelledby="workspace-loading-title">
      <h1 id="workspace-loading-title" className="srOnly">{label}</h1>
      <div className="workspaceLoadingHeader" aria-hidden="true">
        <Skeleton className="skeletonLine" />
        <Skeleton className="skeletonTitle" />
      </div>
      <div className="workspaceLoadingGrid" aria-hidden="true">
        <Skeleton className="workspaceLoadingCard" />
        <Skeleton className="workspaceLoadingCard" />
        <Skeleton className="workspaceLoadingCard" />
      </div>
    </main>
  );
}
