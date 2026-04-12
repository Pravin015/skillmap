import { Storage } from "@google-cloud/storage";

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) {
    const keyJson = process.env.GCS_KEY_JSON;
    if (!keyJson) throw new Error("GCS_KEY_JSON not configured");

    const credentials = JSON.parse(keyJson);
    _storage = new Storage({
      projectId: credentials.project_id,
      credentials,
    });
  }
  return _storage;
}

const BUCKET_NAME = process.env.GCS_BUCKET || "jobash";

/**
 * Upload a base64 image to GCS and return the file path.
 * Returns the GCS file path (not a public URL — we use signed URLs).
 */
export async function uploadToGCS(
  base64Data: string,
  folder: string,
  fileName: string
): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  // Strip base64 header (data:image/jpeg;base64,...)
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 data");

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  const filePath = `${folder}/${fileName}`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return filePath;
}

/**
 * Generate a signed URL for temporary read access.
 * Default expiry: 1 hour.
 */
export async function getSignedUrl(
  filePath: string,
  expiryMinutes: number = 60
): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiryMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Delete a file from GCS.
 */
export async function deleteFromGCS(filePath: string): Promise<void> {
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);
  await bucket.file(filePath).delete().catch(() => {});
}

/**
 * Check if GCS is configured.
 */
export function isGCSConfigured(): boolean {
  return !!process.env.GCS_KEY_JSON;
}
