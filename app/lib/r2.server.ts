import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";

// Configuration for Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "hsk-learning-images";
const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, "");

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3ClientInstance;
}

/**
 * Upload a Buffer or File to Cloudflare R2
 */
export async function uploadFileToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error(
      "Cloudflare R2 chưa được cấu hình. Vui lòng cung cấp R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY trong file .env."
    );
  }

  // Clean key prefix
  const cleanKey = key.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicUrl = R2_PUBLIC_DOMAIN
    ? `${R2_PUBLIC_DOMAIN}/${cleanKey}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${cleanKey}`;

  return {
    url: publicUrl,
    key: cleanKey,
  };
}

/**
 * Lấy Public URL của ảnh trên R2
 */
export function getR2PublicUrl(keyOrPath: string): string {
  if (!keyOrPath) return "";
  if (keyOrPath.startsWith("http://") || keyOrPath.startsWith("https://")) {
    return keyOrPath;
  }

  if (R2_PUBLIC_DOMAIN) {
    const cleanKey = keyOrPath.replace(/^\/+/, "");
    return `${R2_PUBLIC_DOMAIN}/${cleanKey}`;
  }

  return keyOrPath.startsWith("/") ? keyOrPath : `/${keyOrPath}`;
}
