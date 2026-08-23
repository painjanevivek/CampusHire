import { ResumeWorkspace } from "@/features/resume/resume-workspace";
import { StudentWorkspace } from "@/components/layout/student-workspace";

export default function ResumePage() { return <StudentWorkspace active="Resume"><ResumeWorkspace /></StudentWorkspace>; }
