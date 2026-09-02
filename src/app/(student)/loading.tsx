import { StudentWorkspace } from "@/components/layout/student-workspace";
import { WorkspaceLoading } from "@/components/ui/workspace-loading";

export default function StudentLoading() {
  return (
    <StudentWorkspace active="Readiness">
      <WorkspaceLoading label="Loading student workspace" />
    </StudentWorkspace>
  );
}
