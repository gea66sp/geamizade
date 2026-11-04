import { get } from "@vercel/blob";

// ==========================================
// MODO DE ACESSO DO VERCEL BLOB
// ==========================================
// O store atual é público. Quando um store privado estiver disponível, defina
// NEXT_PUBLIC_BLOB_PRIVATE="true" no ambiente de build para ativar uploads
// privados sem alterar os pontos de upload.
export const BLOB_ACCESS: "public" | "private" =
  process.env.NEXT_PUBLIC_BLOB_PRIVATE === "true" ? "private" : "public";

function isAllowedBlobHostname(hostname: string): boolean {
  return hostname.endsWith(".blob.vercel-storage.com");
}

export function isAllowedBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && isAllowedBlobHostname(url.hostname);
  } catch {
    return false;
  }
}

/** Um arquivo privado mora em `*.private.blob.vercel-storage.com`. */
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
  if (!isAllowedBlobUrl(url)) {
    console.error("Recusada tentativa de leitura de uma URL de Blob não autorizada.");
    return null;
  }

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
