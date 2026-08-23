import { StudentWorkspace } from "@/components/layout/student-workspace";
import { ResumeBuilder } from "@/features/resume/resume-builder";

export default function ResumeBuilderPage() {
  return <StudentWorkspace active="Resume"><ResumeBuilder /></StudentWorkspace>;
}
