import { describe, expect, it } from "vitest";

import {
  buildGuardianCopyTitle,
  canManageNotifications,
  canSendNotifications,
  isGlobalNotifier,
  requiresApproval,
} from "./notificationAccess";
import { getHomeRouteForRole } from "./roleRouting";

describe("isGlobalNotifier", () => {
  it("reconhece os cargos administrativos", () => {
    expect(isGlobalNotifier({ role: "ADMIN" })).toBe(true);
    expect(isGlobalNotifier({ role: "DEVELOPER" })).toBe(true);
    expect(isGlobalNotifier({ role: "FINANCEIRO" })).toBe(true);
  });

  it("reconhece quem é da Diretoria pelo ramo, independente do cargo", () => {
    // Um CHEFE lotado na Diretoria tem alcance global.
    expect(isGlobalNotifier({ role: "CHEFE", branch: "DIRETORIA" })).toBe(true);
    expect(isGlobalNotifier({ role: "MEMBER", branch: "DIRETORIA" })).toBe(true);
  });

  it("nega para cargos sem alcance global", () => {
    expect(isGlobalNotifier({ role: "CHEFE", branch: "ESCOTEIRO" })).toBe(false);
    expect(isGlobalNotifier({ role: "MEMBER", branch: "LOBINHO" })).toBe(false);
    expect(isGlobalNotifier({ role: "RESPONSAVEL" })).toBe(false);
  });

  it("nega com segurança para usuário ausente", () => {
    expect(isGlobalNotifier(null)).toBe(false);
    expect(isGlobalNotifier(undefined)).toBe(false);
  });
});

describe("permissões derivadas do NotifierKind", () => {
  it("só Diretoria e chefia acessam o painel de gerenciamento", () => {
    expect(canManageNotifications("GLOBAL")).toBe(true);
    expect(canManageNotifications("CHEFE")).toBe(true);
    expect(canManageNotifications("MONITOR")).toBe(false);
    expect(canManageNotifications("NONE")).toBe(false);
  });

  it("monitor pode enviar, membro comum não", () => {
    expect(canSendNotifications("MONITOR")).toBe(true);
    expect(canSendNotifications("NONE")).toBe(false);
  });

  it("apenas o monitor precisa de aprovação", () => {
    expect(requiresApproval("MONITOR")).toBe(true);
    expect(requiresApproval("CHEFE")).toBe(false);
    expect(requiresApproval("GLOBAL")).toBe(false);
  });
});

describe("buildGuardianCopyTitle", () => {
  it("prefixa o título com o nome do jovem", () => {
    // É o que evita o responsável achar que o aviso é sobre ele mesmo.
    expect(buildGuardianCopyTitle("João Silva", "Novo lançamento financeiro")).toBe(
      "Notificação para João Silva: Novo lançamento financeiro"
    );
  });

  it("usa um rótulo genérico quando o jovem não tem nome cadastrado", () => {
    expect(buildGuardianCopyTitle(null, "Aviso")).toBe("Notificação para seu dependente: Aviso");
    expect(buildGuardianCopyTitle("   ", "Aviso")).toBe("Notificação para seu dependente: Aviso");
  });
});

describe("getHomeRouteForRole", () => {
  it("leva cada cargo para a sua área", () => {
    expect(getHomeRouteForRole("ADMIN")).toBe("/admin");
    expect(getHomeRouteForRole("DEVELOPER")).toBe("/admin");
    expect(getHomeRouteForRole("FINANCEIRO")).toBe("/admin");
    expect(getHomeRouteForRole("CHEFE")).toBe("/chefe");
    expect(getHomeRouteForRole("MEMBER")).toBe("/membro");
    expect(getHomeRouteForRole("RESPONSAVEL")).toBe("/responsavel");
  });

  it("cai no site público para cargo desconhecido ou ausente", () => {
    expect(getHomeRouteForRole(null)).toBe("/");
    expect(getHomeRouteForRole(undefined)).toBe("/");
    expect(getHomeRouteForRole("CARGO_INVENTADO")).toBe("/");
  });
});
