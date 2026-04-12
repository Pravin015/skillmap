import { getSignedUrl, isGCSConfigured } from "./gcs";

/**
 * Resolves a profileImage value to a displayable URL.
 * - If null/undefined → returns null
 * - If starts with "gcs:" → generates signed URL
 * - If starts with "data:" → returns as-is (base64)
 * - Otherwise → returns as-is (external URL)
 */
export async function resolveImage(profileImage: string | null | undefined): Promise<string | null> {
  if (!profileImage) return null;

  if (profileImage.startsWith("gcs:") && isGCSConfigured()) {
    try {
      const filePath = profileImage.slice(4);
      return await getSignedUrl(filePath, 120); // 2 hour
    } catch {
      return null;
    }
  }

  return profileImage;
}
