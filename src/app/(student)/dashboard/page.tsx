import { StudentWorkspace } from "@/components/layout/student-workspace";
import { ConnectedStudentDashboard } from "@/features/dashboard/connected-student-dashboard";

export default function Dashboard() {
  return (
    <StudentWorkspace active="Readiness">
      <ConnectedStudentDashboard />
    </StudentWorkspace>
  );
}

