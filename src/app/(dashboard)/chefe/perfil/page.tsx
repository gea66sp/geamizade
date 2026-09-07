import type { Metadata } from "next";

import ProfilePageContent from "@/src/components/dashboard/perfil/ProfilePageContent";

export const metadata: Metadata = {
  title: "Meu Perfil | GE Amizade 66SP",
};

export default function ChefeProfilePage() {
  return <ProfilePageContent padded />;
}
