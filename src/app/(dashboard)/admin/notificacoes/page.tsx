import type { Metadata } from "next";
import { redirect } from "next/navigation";

import prisma from "@/src/lib/prisma";
import {
  getInbox,
  getPanelNotifications,
  getViewerContext,
  listApprovalQueue,
} from "@/src/lib/notifications";
import ApprovalQueue from "@/src/components/dashboard/notifications/ApprovalQueue";
import ComposeNotification from "@/src/components/dashboard/notifications/ComposeNotification";
import NotificationList from "@/src/components/dashboard/notifications/NotificationList";
import NotificationManagerTable from "@/src/components/dashboard/notifications/NotificationManagerTable";
import NotificationsTabs from "@/src/components/dashboard/notifications/NotificationsTabs";

export const metadata: Metadata = {
  title: "Notificações",
  description: "Central de comunicação do Grupo Escoteiro Amizade.",
};

export default async function AdminNotificacoesPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const [inbox, panelItems, approvals, troops, recipients] = await Promise.all([
    getInbox(ctx.user.id, { limit: 100 }),
    getPanelNotifications(ctx, { limit: 300 }),
    listApprovalQueue(ctx),
    prisma.troop.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { id: { not: ctx.user.id } },
      select: {
        id: true,
        name: true,
        role: true,
        troop: { select: { name: true } },
        patrol: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const recipientOptions = recipients.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    troopName: r.troop?.name ?? null,
    patrolName: r.patrol?.name ?? null,
  }));

  const unreadCount = inbox.filter((i) => !i.isRead).length;

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-bell"></i>
          </span>
          Central de Notificações
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Envie avisos para todo o grupo e audite tudo o que trafega no sistema.
        </p>
      </div>

      <NotificationsTabs
        tabs={[
          {
            key: "inbox",
            label: "Recebidas",
            icon: "fa-inbox",
            badge: unreadCount,
            content: <NotificationList initialItems={inbox} />,
          },
          {
            key: "compose",
            label: "Enviar",
            icon: "fa-paper-plane",
            content: (
              <ComposeNotification kind={ctx.kind} recipients={recipientOptions} troops={troops} />
            ),
          },
          {
            key: "manage",
            label: "Gerenciar",
            icon: "fa-list-check",
            content: (
              <NotificationManagerTable
                initialItems={panelItems}
                troops={troops}
                scopeLabel="Como Diretoria/Administração, você visualiza e pode excluir todas as notificações trafegadas no sistema."
              />
            ),
          },
          {
            key: "approvals",
            label: "Aprovações",
            icon: "fa-clipboard-check",
            badge: approvals.length,
            content: <ApprovalQueue initialItems={approvals} />,
          },
        ]}
      />
    </div>
  );
}
