/**
 * Script upload toàn bộ SVG chữ Hán lên Cloudflare R2.
 * 
 * Cách dùng:
 *   1. Tạo file .env với các biến R2 (xem .env.example)
 *   2. Chạy: npx tsx scripts/upload-hanzi-svgs.ts
 * 
 * Yêu cầu:
 *   - R2 Bucket đã được tạo và bật Public Access
 *   - API Token có quyền Object Read & Write
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import "dotenv/config";

// ===== CONFIG =====
const SVG_SOURCE_DIR = "c:/Users/VanDinh/Downloads/makemeahanzi/svgs-recolored";
const BATCH_SIZE = 100; // số file upload song song mỗi đợt

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Thiếu biến môi trường: ${key}`);
    process.exit(1);
  }
}

// ===== R2 Client =====
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

// ===== Hàm upload 1 file =====
async function uploadFile(filePath: string): Promise<{ key: string; success: boolean; error?: string }> {
  const key = basename(filePath);
  const body = readFileSync(filePath);
  
  try {
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/svg+xml",
      CacheControl: "public, max-age=31536000, immutable", // cache 1 năm
    }));
    return { key, success: true };
  } catch (e: any) {
    return { key, success: false, error: e.message };
  }
}

// ===== Main =====
async function main() {
  console.log(`📂 Đọc thư mục: ${SVG_SOURCE_DIR}`);
  
  const files = readdirSync(SVG_SOURCE_DIR)
    .filter((f) => f.endsWith(".svg"))
    .map((f) => join(SVG_SOURCE_DIR, f));
  
  const totalSize = files.reduce((acc, f) => acc + statSync(f).size, 0);
  console.log(`📊 Tổng: ${files.length} files (${(totalSize / 1024 / 1024).toFixed(1)} MB)`);

  // Kiểm tra file đã tồn tại trên R2 chưa (để skip nếu cần)
  if (process.env.SKIP_EXISTING === "true") {
    console.log("🔍 Kiểm tra file đã tồn tại trên R2...");
    const existing = new Set<string>();
    let continuationToken: string | undefined;
    do {
      const res = await r2.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }));
      for (const obj of res.Contents || []) {
        if (obj.Key) existing.add(obj.Key);
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);
    console.log(`   Đã có ${existing.size} files trên R2`);
    const before = files.length;
    const filtered = files.filter((f) => !existing.has(basename(f)));
    console.log(`   Bỏ qua ${before - filtered.length}, còn ${filtered.length} files cần upload`);
    files.length = 0;
    files.push(...filtered);
  }

  // Upload theo batch
  let uploaded = 0;
  let failed = 0;
  const start = Date.now();

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(uploadFile));
    
    for (const r of results) {
      if (r.success) uploaded++;
      else {
        failed++;
        console.error(`   ❌ ${r.key}: ${r.error}`);
      }
    }

    const progress = ((uploaded + failed) / files.length * 100).toFixed(1);
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    process.stdout.write(`\r⏳ Upload: ${progress}% (${uploaded} ok, ${failed} fail) - ${elapsed}s`);
  }

  const totalTime = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n✅ Hoàn thành! ${uploaded} thành công, ${failed} thất bại trong ${totalTime}s`);
  console.log(`🌐 Public URL: https://${process.env.R2_PUBLIC_DOMAIN || `${BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.dev`}/`);
}

main().catch(console.error);
