import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

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

    if (!document) {
      return new NextResponse("Documento não encontrado.", { status: 404 });
    }

    // 2. O seu servidor Next.js vai até o Vercel Blob buscar o arquivo original
    const fileResponse = await fetch(document.fileUrl);

    if (!fileResponse.ok) {
      return new NextResponse("Erro ao ler o arquivo no servidor de armazenamento.", { status: 500 });
    }

    // 3. Transforma a resposta em um formato legível (Blob do navegador/Node)
    const fileBuffer = await fileResponse.blob();

    // 4. Limpa o título original para virar um nome de arquivo seguro (sem acentos ou espaços esquisitos)
    // Ex: "Ata de Reunião" vira "Ata_de_Reuniao"
    const safeFilename = document.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-zA-Z0-9-]/g, "_"); // Troca espaços e caracteres especiais por underline

    // 5. Devolve o arquivo para o usuário como se fosse do seu próprio site
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        // 'inline' faz o PDF abrir no navegador. Se quiser forçar o download direto, mude para 'attachment'
        "Content-Disposition": `inline; filename="${safeFilename}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Erro no proxy de arquivo:", error);
    return new NextResponse("Erro interno do servidor.", { status: 500 });
  }
}