import { NextResponse } from "next/server";

import { getAuthUser } from "@/src/lib/auth";
import { isGlobalNotifier } from "@/src/lib/notificationAccess";
import prisma from "@/src/lib/prisma";
import { readBlob } from "@/src/lib/blobAccess";

// Servidor AUTENTICADO de documentos.
//
// ATENÇÃO: enquanto o store do Blob for público (ver src/lib/blobAccess.ts),
// esta rota protege a NAVEGAÇÃO pela interface, mas NÃO impede que alguém com
// a URL do arquivo o baixe direto. O fechamento completo depende de
// provisionar um store privado na Vercel e migrar os arquivos.
//
// Cobre os dois tipos:
//  - documento PESSOAL (`ownerId`): dono, responsável legal ou gestão;
//  - documento do PORTAL (`folderId`): público a qualquer pessoa logada, ou
//    restrito às listas `allowedViewers`/`allowedEditors`, ou gestão.
//
// A rota /portal-da-transparencia/arquivo/[id] continua existindo para o
// visitante NÃO logado, e serve exclusivamente documentos `isPublic`.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Toda saída negativa é 404, nunca 403: um 403 confirmaria a existência do
  // documento para quem não deveria nem saber que ele existe.
  const notFound = () => new NextResponse("Documento não encontrado.", { status: 404 });

  try {
    const user = await getAuthUser();
    if (!user) return notFound();

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        ownerId: true,
        isPublic: true,
        allowedViewers: { select: { id: true } },
        allowedEditors: { select: { id: true } },
      },
    });

    if (!document) return notFound();

    // ==========================================
    // PERMISSÃO
    // ==========================================
    let allowed = false;

    if (document.ownerId === user.id) {
      // 1. O próprio dono de um documento pessoal.
      allowed = true;
    } else if (isGlobalNotifier(user)) {
      // 2. Gestão do grupo (ADMIN/DEVELOPER/FINANCEIRO ou Diretoria).
      allowed = true;
    } else if (document.ownerId) {
      // 3. Responsável legal do dono — mesma trava de FamilyTie que o RSVP usa.
      const tie = await prisma.familyTie.findFirst({
        where: { guardianId: user.id, dependentId: document.ownerId },
        select: { id: true },
      });
      allowed = !!tie;
    } else if (document.isPublic) {
      // 4. Documento do portal marcado como público: qualquer pessoa logada lê.
      allowed = true;
    } else {
      // 5. Documento do portal restrito: vale a lista explícita de acesso,
      //    que é o controle próprio do módulo de transparência (separado das
      //    checagens por Role usadas no resto do sistema).
      allowed =
        document.allowedViewers.some((u) => u.id === user.id) ||
        document.allowedEditors.some((u) => u.id === user.id);
    }

    if (!allowed) return notFound();

    // ==========================================
    // ENTREGA DO ARQUIVO
    // ==========================================
    // readBlob detecta pela URL se o arquivo é público ou privado — durante a
    // migração os dois formatos convivem.
    const result = await readBlob(document.fileUrl);
    if (!result) {
      console.error(`Documento ${id}: registro existe mas o arquivo não foi encontrado no Blob.`);
      return notFound();
    }

    const safeFilename = document.title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]/g, "_");

    const contentType = result.contentType;
    const extensionMatch = document.fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
    const extension = extensionMatch ? extensionMatch[1] : "pdf";

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename}.${extension}"`,
        // Documento pessoal nunca deve ficar em cache compartilhado.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(`Erro ao servir o documento ${id}:`, error);
    return new NextResponse("Erro ao ler o arquivo.", { status: 500 });
  }
}
