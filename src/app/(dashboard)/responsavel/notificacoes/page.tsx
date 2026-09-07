import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getInbox, getViewerContext } from "@/src/lib/notifications";
import NotificationList from "@/src/components/dashboard/notifications/NotificationList";

export const metadata: Metadata = {
  title: "Notificações",
  description: "Avisos sobre você e sobre os seus dependentes.",
};

export default async function ResponsavelNotificacoesPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  // A caixa do responsável já traz as cópias dos jovens: elas são gravadas como
  // notificações dele, com o título prefixado pelo nome do dependente.
  const inbox = await getInbox(ctx.user.id, { limit: 100 });

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-bell"></i>
          </span>
          Notificações
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Avisos enviados a você e as cópias de tudo o que o grupo comunica ao(s) seu(s)
          dependente(s).
        </p>
      </div>

      <NotificationList initialItems={inbox} />
    </div>
  );
}
