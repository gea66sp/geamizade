import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho das suas opções do NextAuth
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./_components/ProfileForm";

export const metadata = {
  title: "Meu Perfil | GE Amizade 66SP",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Busca o usuário com sua ficha médica e dados de tropa
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      medicalRecord: true,
      troop: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <ProfileForm initialData={user} />
    </div>
  );
}