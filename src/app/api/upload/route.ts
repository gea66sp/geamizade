import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Verifique se o caminho do seu auth está correto

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // SEGURANÇA: Verifica se a pessoa que está tentando fazer upload está logada
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
          throw new Error('Acesso negado: Apenas usuários logados podem fazer upload.');
        }

        return {
          // Permite os tipos de arquivos mais comuns. Adicione mais se necessário.
          allowedContentTypes: [
            'application/pdf', 
            'image/jpeg', 
            'image/png', 
            'image/webp',
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.rar',
            'application/zip'
          ],
          // Bloqueia envios absurdos: máximo de 500MB (limite do Vercel Client Upload)
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            userId: session.user.email,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Isso roda no servidor depois que o navegador termina de enviar a imagem.
        console.log('Upload finalizado com sucesso no Vercel Blob:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}