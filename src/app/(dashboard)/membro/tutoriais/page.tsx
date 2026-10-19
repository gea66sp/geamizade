import type { Metadata } from "next";
import TutorialCenter from "@/src/components/dashboard/tutorials/TutorialCenter";

export const metadata: Metadata = {
  title: "Tutoriais",
  description: "Aprenda a utilizar os recursos disponíveis para membros.",
};

export default function MembroTutorialsPage() {
  return <TutorialCenter role="MEMBER" />;
}
