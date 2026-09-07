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
  description: "Envie avisos para a sua tropa e aprove os pedidos dos monitores.",
};

export default async function ChefeNotificacoesPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const inbox = await getInbox(ctx.user.id, { limit: 100 });
  const unreadCount = inbox.filter((i) => !i.isRead).length;

  // Um chefe sem tropa não tem escopo de gestão: entrega só a caixa de entrada
  // em vez de deixar as abas de envio/gestão estourarem sem dados.
  if (ctx.kind !== "CHEFE" && ctx.kind !== "GLOBAL") {
    return (
      <div className="w-full animate-fade-in-down pb-16">
        <Header />
        <NotificationList initialItems={inbox} />
      </div>
    );
  }

  const [panelItems, approvals, troops, youths] = await Promise.all([
    getPanelNotifications(ctx, { limit: 300 }),
    listApprovalQueue(ctx),
    prisma.troop.findMany({
      where: { id: { in: ctx.managedTroopIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER", troopId: { in: ctx.managedTroopIds } },
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

  const recipientOptions = youths.map((y) => ({
    id: y.id,
    name: y.name,
    role: y.role,
    troopName: y.troop?.name ?? null,
    patrolName: y.patrol?.name ?? null,
  }));

  const troopNames = troops.map((t) => t.name).join(", ") || "sua tropa";

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <Header />

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
                scopeLabel={`Você visualiza e pode excluir apenas as notificações entregues aos membros de ${troopNames}.`}
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

function Header() {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
          <i className="fa-solid fa-bell"></i>
        </span>
        Notificações da Seção
      </h1>
      <p className="text-gray-500 font-medium mt-2">
        Avise os jovens da sua tropa e os responsáveis, e aprove os pedidos dos monitores.
      </p>
    </div>
  );
}
