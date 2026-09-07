import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { readBlob } from "@/src/lib/blobAccess";

// Rota PÚBLICA (sem sessão) do Portal da Transparência.
//
// Serve exclusivamente documentos marcados como `isPublic`. Documentos
// restritos saem por /api/documentos/[id], que exige sessão e confere a lista
// de acesso do documento.
//
// ATENÇÃO: enquanto o store do Blob for público (src/lib/blobAccess.ts), a URL
// do arquivo ainda abre direto, sem passar por aqui.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Usando Promise para evitar o erro de Hydration que vimos antes!
) {
  try {
    const { id } = await params;

    // 1. Busca o documento no banco de dados pelo ID
    const document = await prisma.document.findUnique({
      where: { id },
    });

    // Esta é uma rota pública (sem verificação de sessão): só pode servir
    // documentos explicitamente marcados como públicos. Do contrário, qualquer
    // pessoa que descobrisse um ID de documento restrito (ex: ficha pessoal,
    // documento financeiro) conseguiria baixá-lo sem autenticação.
    if (!document || !document.isPublic) {
      return new NextResponse("Documento não encontrado.", { status: 404 });
    }

    // 2. Busca o arquivo no Blob (readBlob cobre público e privado).
    const fileResponse = await readBlob(document.fileUrl);

    if (!fileResponse) {
      console.error(`Documento ${id}: registro existe mas o arquivo não foi encontrado no Blob.`);
      return new NextResponse("Documento não encontrado.", { status: 404 });
    }

    // 3. Limpa o título original para virar um nome de arquivo seguro (sem acentos ou espaços esquisitos)
    // Ex: "Ata de Reunião" vira "Ata_de_Reuniao"
    const safeFilename = document.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-zA-Z0-9-]/g, "_"); // Troca espaços e caracteres especiais por underline

    // Descobre o tipo real do arquivo (o portal aceita PDF, imagens, Word, Excel, zip, rar...
    // forçar "application/pdf" corrompia a visualização de qualquer arquivo que não fosse PDF)
    const contentType = fileResponse.contentType;
    const urlExtensionMatch = document.fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
    const extension = urlExtensionMatch ? urlExtensionMatch[1] : "pdf";

    // 4. Devolve o arquivo para o usuário como se fosse do seu próprio site
    return new NextResponse(fileResponse.stream, {
      headers: {
        "Content-Type": contentType,
        // 'inline' faz o arquivo abrir no navegador. Se quiser forçar o download direto, mude para 'attachment'
        "Content-Disposition": `inline; filename="${safeFilename}.${extension}"`,
      },
    });

  } catch (error) {
    console.error("Erro no proxy de arquivo:", error);
    return new NextResponse("Erro interno do servidor.", { status: 500 });
  }
}