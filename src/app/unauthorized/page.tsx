import { ButtonLink } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return <main id="main-content" className="statePage"><p className="eyebrow">Access protected</p><h1>This area needs a different account.</h1><p>Sign in with the account assigned to this workspace, or return to the home page.</p><ButtonLink href="/sign-in">Sign in</ButtonLink></main>;
}
