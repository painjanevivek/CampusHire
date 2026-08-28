import { StudentWorkspace } from "@/components/layout/student-workspace";
import { StudentRoadmap } from "@/features/roadmap/student-roadmap";

export default function RoadmapPage() {
  return <StudentWorkspace active="Roadmap"><StudentRoadmap /></StudentWorkspace>;
}

