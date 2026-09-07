import type { NextRequest } from "next/server";

import { sendRsvpReminders } from "@/src/lib/events";

// Job disparado pelo Vercel Cron (ver vercel.json). Nunca deve ser cacheado.
export const dynamic = "force-dynamic";
// Teto do plano Hobby. Se o grupo crescer muito, dividir o trabalho em lotes
// em vez de aumentar isso.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // A Vercel injeta o valor de CRON_SECRET como `Authorization: Bearer <valor>`.
  //
  // O teste de `!cronSecret` é deliberado: sem o segredo configurado o endpoint
  // fica FECHADO, nunca aberto. Um esquecimento de configuração vira 401
  // (lembrete não sai, e aparece no log) em vez de um endpoint público capaz de
  // notificar o grupo inteiro.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await sendRsvpReminders();

    console.log(
      `[cron/lembretes] ${result.eventsProcessed} evento(s) processado(s), ${result.notificationsSent} notificação(ões) enviada(s).`
    );

    // Sempre 200 com o resumo. Um 3xx seria tratado como resposta final pelo
    // cron da Vercel (ele não segue redirect), então nunca redirecionar aqui.
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("[cron/lembretes] Falha ao executar o job:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
