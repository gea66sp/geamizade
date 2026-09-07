import type { Metadata } from "next";
import { redirect } from "next/navigation";

import prisma from "@/src/lib/prisma";
import { REQUEST_STATUS_META } from "@/src/lib/notificationAccess";
import { getInbox, getViewerContext, listOutbox } from "@/src/lib/notifications";
import ComposeNotification from "@/src/components/dashboard/notifications/ComposeNotification";
import NotificationList from "@/src/components/dashboard/notifications/NotificationList";
import NotificationsTabs from "@/src/components/dashboard/notifications/NotificationsTabs";

export const metadata: Metadata = {
  title: "Notificações",
  description: "Seus avisos do Grupo Escoteiro Amizade.",
};

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

export default async function MembroNotificacoesPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const inbox = await getInbox(ctx.user.id, { limit: 100 });
  const unreadCount = inbox.filter((i) => !i.isRead).length;

  const header = (
    <div className="mb-6 md:mb-8">
      <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
          <i className="fa-solid fa-bell"></i>
        </span>
        Minhas Notificações
      </h1>
      <p className="text-gray-500 font-medium mt-2">Avisos do grupo, da sua tropa e da sua patrulha.</p>
    </div>
  );

  // Membro comum: apenas a caixa de entrada.
  if (ctx.kind !== "MONITOR") {
    return (
      <div className="w-full animate-fade-in-down pb-16">
        {header}
        <NotificationList initialItems={inbox} />
      </div>
    );
  }

  // Monitor/Submonitor: pode compor avisos para a própria patrulha, sujeitos à
  // aprovação do chefe — e acompanha o resultado na aba "Meus envios".
  const [outbox, patrolMembers] = await Promise.all([
    listOutbox(ctx),
    prisma.user.findMany({
      where: { patrolId: { in: ctx.ledPatrolIds }, role: "MEMBER" },
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

  const recipientOptions = patrolMembers.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    troopName: m.troop?.name ?? null,
    patrolName: m.patrol?.name ?? null,
  }));

  const pendingCount = outbox.filter((o) => o.status === "PENDING_APPROVAL").length;

  return (
    <div className="w-full animate-fade-in-down pb-16">
      {header}

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
            label: "Avisar minha patrulha",
            icon: "fa-paper-plane",
            content: <ComposeNotification kind={ctx.kind} recipients={recipientOptions} />,
          },
          {
            key: "outbox",
            label: "Meus envios",
            icon: "fa-list-check",
            badge: pendingCount,
            content: (
              <div className="space-y-3">
                {outbox.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
                    <i className="fa-regular fa-paper-plane text-4xl text-gray-200 mb-3"></i>
                    <p className="text-gray-500 font-bold">Você ainda não enviou nenhum aviso.</p>
                  </div>
                ) : (
                  outbox.map((item) => {
                    const meta =
                      REQUEST_STATUS_META[item.status as keyof typeof REQUEST_STATUS_META];
                    return (
                      <article
                        key={item.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <h3 className="font-heading text-base font-bold text-gray-900 leading-tight">
                            {item.title}
                          </h3>
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest shrink-0 ${meta.className}`}
                          >
                            <i className={`fa-solid ${meta.icon} mr-1`}></i>
                            {meta.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {item.message}
                        </p>

                        <div className="text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-100 space-y-1">
                          <p>Criado em {formatDateTime(item.createdAt)}</p>
                          {item.status === "APPROVED" && (
                            <p className="text-emerald-700 font-bold">
                              Entregue a {item._count.notifications} destinatário(s)
                              {item.approver?.name ? ` · aprovado por ${item.approver.name}` : ""}
                            </p>
                          )}
                          {item.status === "REJECTED" && item.rejectionReason && (
                            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 font-medium">
                              <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
                              Motivo: {item.rejectionReason}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
