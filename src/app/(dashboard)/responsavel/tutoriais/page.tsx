import type { Metadata } from "next";
import TutorialCenter from "@/src/components/dashboard/tutorials/TutorialCenter";

export const metadata: Metadata = {
  title: "Tutoriais",
  description: "Aprenda a utilizar os recursos disponíveis para responsáveis.",
};

export default function ResponsavelTutorialsPage() {
  return <TutorialCenter role="RESPONSAVEL" />;
}
