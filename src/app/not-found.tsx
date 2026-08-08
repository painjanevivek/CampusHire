import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="statePage">
      <p className="eyebrow">Page not found</p>
      <h1>This path does not lead to a CampusHire page.</h1>
      <p>Return to the start and continue from there.</p>
      <ButtonLink href="/">Go to home</ButtonLink>
    </main>
  );
}
