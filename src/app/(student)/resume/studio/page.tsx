import { AiResumeStudio } from "@/features/resume/ai-resume-studio";

export default async function ResumeStudioPage({ searchParams }: { searchParams: Promise<{ proposal?: string }> }) {
  const { proposal } = await searchParams;
  return <AiResumeStudio initialProposalId={proposal} />;
}
