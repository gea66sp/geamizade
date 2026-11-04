export function getUserImageSrc(userId: string, image: string | null | undefined): string | null {
  if (!image) return null;
  try {
    const url = new URL(image);
    const isBlobUrl =
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com");
    return isBlobUrl ? `/api/usuarios/${userId}/avatar` : image;
  } catch {
    return image;
  }
}
