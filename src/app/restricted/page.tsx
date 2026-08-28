import { ButtonLink } from "@/components/ui/button";

export default function RestrictedAccessPage() {
  return (
    <main className="statePage">
      <p className="eyebrow">Institution access restricted</p>
      <h1>Your CampusHire membership is not currently active.</h1>
      <p>Your saved records remain protected. Contact your placement office to review your membership status.</p>
      <ButtonLink href="/">Return home</ButtonLink>
    </main>
  );
}
