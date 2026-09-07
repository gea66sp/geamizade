import { get } from "@vercel/blob";

// ==========================================
// MODO DE ACESSO DO VERCEL BLOB
// ==========================================
// O store de Blob do projeto é hoje PÚBLICO. Um store público recusa uploads
// com `access: "private"` ("Cannot use private access on a public store"),
// então não dá para privatizar só no código — é preciso provisionar um store
// privado no painel da Vercel.
//
// Enquanto isso não acontece, este módulo mantém o sistema funcionando e deixa
// a virada a um passo: basta definir NEXT_PUBLIC_BLOB_PRIVATE="true" no
// ambiente (junto do token do novo store) para que todo upload novo passe a
// ser privado.
//
// POR QUE `NEXT_PUBLIC_`: o upload do Portal da Transparência acontece no
// NAVEGADOR (client upload do @vercel/blob), e o navegador só enxerga
// variáveis com esse prefixo. Uma variável sem o prefixo seria `undefined` no
// cliente, e aquele upload continuaria público para sempre — silenciosamente,
// mesmo com o store privado já configurado. Usar UMA variável nos dois lados
// evita o servidor gravar privado enquanto o cliente grava público.
//
// Não é segredo: é só um seletor de modo. O que precisa ser secreto é o
// BLOB_READ_WRITE_TOKEN.
//
// CONSEQUÊNCIA DE SEGURANÇA ENQUANTO ESTIVER "public": a URL do arquivo abre
// para qualquer pessoa que a tenha, sem sessão. As rotas de download continuam
// conferindo permissão — o que protege a navegação pela interface —, mas não
// fecham o acesso direto pela URL. Ver CLAUDE.md.
export const BLOB_ACCESS: "public" | "private" =
  process.env.NEXT_PUBLIC_BLOB_PRIVATE === "true" ? "private" : "public";

/** Um arquivo já migrado mora em `*.private.blob.vercel-storage.com`. */
export function isPrivateBlobUrl(url: string): boolean {
  return url.includes(".private.blob.");
}

export type BlobReadResult = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null;

/**
 * Lê um arquivo do Blob independentemente de ele ser público ou privado.
 *
 * A detecção é feita pela própria URL, e não pela configuração global, porque
 * durante a migração os dois formatos convivem: arquivos antigos seguem
 * públicos enquanto os novos já nascem privados.
 */
export async function readBlob(url: string): Promise<BlobReadResult> {
  try {
    if (isPrivateBlobUrl(url)) {
      const result = await get(url, { access: "private" });
      if (!result?.stream) return null;
      return {
        stream: result.stream,
        contentType: result.headers?.get("content-type") || "application/octet-stream",
      };
    }

    const response = await fetch(url);
    if (!response.ok || !response.body) return null;
    return {
      stream: response.body,
      contentType: response.headers.get("content-type") || "application/octet-stream",
    };
  } catch (error) {
    console.error("Falha ao ler arquivo do Blob:", error);
    return null;
  }
}
