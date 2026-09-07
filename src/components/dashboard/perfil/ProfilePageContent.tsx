import { redirect } from "next/navigation";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import ProfileForm from "./ProfileForm";

// A página "Meu Perfil" é idêntica nas quatro áreas do dashboard — o que muda
// é só o wrapper. Antes eram quatro cópias do mesmo arquivo, e qualquer ajuste
// no perfil exigia lembrar de todas.
export default async function ProfilePageContent({ padded = false }: { padded?: boolean }) {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      troop: true,
      patrol: true,
      personalDocs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className={`max-w-5xl mx-auto${padded ? " p-4 md:p-8" : ""}`}>
      <ProfileForm initialData={user} />
    </div>
  );
}
