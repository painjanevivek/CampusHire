import { StudentWorkspace } from "@/components/layout/student-workspace";
import { ProfileWorkspace } from "@/features/profile/profile-workspace";

export default function ProfilePage() {
  return <StudentWorkspace active="Profile"><ProfileWorkspace /></StudentWorkspace>;
}
