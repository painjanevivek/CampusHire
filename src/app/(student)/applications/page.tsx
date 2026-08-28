import { StudentWorkspace } from "@/components/layout/student-workspace";
import { StudentApplications } from "@/features/recruitment/student-applications";

export default function ApplicationsPage() {
  return <StudentWorkspace active="Applications"><StudentApplications /></StudentWorkspace>;
}
