import { StudentWorkspace } from "@/components/layout/student-workspace";
import {
  StudentDashboard,
  type StudentDashboardData,
} from "@/features/dashboard/student-dashboard";

const sampleDashboard: StudentDashboardData = {
  studentName: "Aarav",
  readiness: 83,
  state: "ready",
  nextAction: {
    title: "Add deployment evidence",
    description:
      "Publish one working project and attach its live link with a short technical note.",
    reason:
      "A verified deployment is the clearest evidence gap between your profile and AI platform roles.",
    href: "/roadmap",
  },
  evidence: [
    { label: "Formal eligibility", value: "Verified", status: "verified" },
    { label: "Resume evidence", value: "Reviewed", status: "verified" },
    { label: "Live deployment", value: "Missing", status: "pending" },
    { label: "Project note", value: "In review", status: "review" },
  ],
  opportunities: [
    {
      company: "Northstar Labs",
      role: "AI Platform Intern",
      location: "Bengaluru · Hybrid",
      eligibility: "Formally eligible",
      match: 92,
      href: "/opportunities/ai-platform-intern",
    },
    {
      company: "Atlas Systems",
      role: "Backend Engineering Intern",
      location: "Pune · On-site",
      eligibility: "Formally eligible",
      match: 86,
      href: "/opportunities/backend-engineering-intern",
    },
  ],
};

export default function Dashboard() {
  return (
    <StudentWorkspace active="Dashboard">
      <StudentDashboard data={sampleDashboard} />
    </StudentWorkspace>
  );
}
