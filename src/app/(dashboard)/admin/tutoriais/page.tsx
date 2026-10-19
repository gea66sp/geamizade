import type { Metadata } from "next";
import TutorialCenter from "@/src/components/dashboard/tutorials/TutorialCenter";

export const metadata: Metadata = {
  title: "Tutoriais",
  description: "Aprenda a utilizar os recursos administrativos do portal.",
};

export default function AdminTutorialsPage() {
  return <TutorialCenter role="ADMIN" />;
}
