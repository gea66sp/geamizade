import { del, get, list, put, type PutBlobResult } from "@vercel/blob";

export type BlobAccess = "public" | "private";

const PUBLIC_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PRIVATE_TOKEN = process.env.PRIVATE_READ_WRITE_TOKEN;
const PRIVATE_STORE_ID = process.env.PRIVATE_STORE_ID;

export const BLOB_ACCESS: BlobAccess = "public";

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

export function isPrivateBlobUrl(url: string): boolean {
  return url.includes(".private.blob.");
}

export function getBlobToken(access: BlobAccess): string {
  const token = access === "private" ? PRIVATE_TOKEN : PUBLIC_TOKEN;
  if (!token) {
    throw new Error(`Token do Blob ${access === "private" ? "privado" : "público"} não configurado.`);
  }
  return token;
}

function tokenForUrl(url: string): string {
  return getBlobToken(isPrivateBlobUrl(url) ? "private" : "public");
}

export async function putBlob(
  pathname: string,
  body: Parameters<typeof put>[1],
  access: BlobAccess,
): Promise<PutBlobResult> {
  return put(pathname, body, { access, token: getBlobToken(access) });
}

export async function deleteBlob(url: string | string[]): Promise<void> {
  const urls = Array.isArray(url) ? url : [url];
  if (urls.length === 0) return;

  const grouped = new Map<string, string[]>();
  for (const blobUrl of urls) {
    const token = tokenForUrl(blobUrl);
    const current = grouped.get(token) ?? [];
    current.push(blobUrl);
    grouped.set(token, current);
  }

  for (const [token, groupedUrls] of grouped) {
    await del(groupedUrls, { token });
  }
}

export async function copyBlob(
  sourceUrl: string,
  pathname: string,
  access: BlobAccess,
): Promise<string> {
  const source = await readBlob(sourceUrl);
  if (!source) throw new Error("Arquivo de origem não encontrado no Blob.");

  const copied = await putBlob(pathname, source.stream, access);
  const verification = await readBlob(copied.url);
  if (!verification) throw new Error("A cópia do arquivo não pôde ser validada.");
  return copied.url;
}

export type BlobReadResult = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null;

export async function readBlob(url: string): Promise<BlobReadResult> {
  if (!isAllowedBlobUrl(url)) {
    console.error("Recusada tentativa de leitura de uma URL de Blob não autorizada.");
    return null;
  }

  try {
    if (isPrivateBlobUrl(url)) {
      const result = await get(url, { access: "private", token: tokenForUrl(url) });
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

export function assertPrivateStoreConfigured(): void {
  if (!PRIVATE_STORE_ID || !PRIVATE_TOKEN) {
    throw new Error("Store privado do Blob não está configurado.");
  }
}

export async function getBlobStorageUsage(access: BlobAccess): Promise<number> {
  let totalBytes = 0;
  let cursor: string | undefined;

  do {
    const result = await list({
      limit: 1000,
      ...(cursor ? { cursor } : {}),
      token: getBlobToken(access),
    });

    totalBytes += result.blobs.reduce((total, blob) => total + blob.size, 0);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return totalBytes;
}
