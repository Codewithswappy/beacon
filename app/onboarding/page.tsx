import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup your profile - Beacon",
  description: "Complete your onboarding to join the community.",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
