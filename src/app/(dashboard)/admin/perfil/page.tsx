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

  // Busca o usuário com seus dados de tropa, patrulha e documentos pessoais 
  // (a ficha médica fixa foi removida no novo schema)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      troop: true,
      patrol: true,        // <-- NOVO: Traz os dados da Patrulha/Matilha
      personalDocs: true,  // <-- NOVO: Traz os PDFs e Fichas Médicas digitalizadas
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