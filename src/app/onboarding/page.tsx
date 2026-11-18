import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getViewer } from "@/lib/auth";
import { getPlayer } from "@/lib/data";
import { getLanguages } from "@/services/languages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your language",
};

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!viewer.verified) redirect("/verify");

  const player = await getPlayer(viewer);
  if (player.onboardingCompleted) redirect("/learn");

  const languages = await getLanguages();

  return <OnboardingFlow languages={languages} name={player.name} />;
}
