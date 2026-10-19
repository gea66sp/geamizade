import type { Metadata } from "next";
import TutorialCenter from "@/src/components/dashboard/tutorials/TutorialCenter";

export const metadata: Metadata = {
  title: "Tutoriais",
  description: "Aprenda a utilizar os recursos disponíveis para chefes.",
};

export default function ChefeTutorialsPage() {
  return <TutorialCenter role="CHEFE" />;
}
