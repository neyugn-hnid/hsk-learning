import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import dotenv from "dotenv";

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "hsk-learning-images";
const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, "");

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("❌ Thiếu thông tin cấu hình Cloudflare R2 trong file .env!");
  console.error("👉 Vui lòng thêm các biến sau vào .env:");
  console.error("   R2_ACCOUNT_ID=\"<your_account_id>\"");
  console.error("   R2_ACCESS_KEY_ID=\"<your_access_key_id>\"");
  console.error("   R2_SECRET_ACCESS_KEY=\"<your_secret_access_key>\"");
  console.error("   R2_BUCKET_NAME=\"hsk-learning-images\"");
  console.error("   R2_PUBLIC_DOMAIN=\"https://pub-xxxxxx.r2.dev\" (Tùy chọn)\n");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".mp3", ".wav", ".json"].includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function uploadFile(localFilePath: string, rootDir: string) {
  const relativePath = path.relative(rootDir, localFilePath).replace(/\\/g, "/");
  const fileBuffer = fs.readFileSync(localFilePath);
  const contentType = (mime.lookup(localFilePath) as string) || "application/octet-stream";

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: relativePath,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return relativePath;
}

async function main() {
  console.log(`\n🚀 BẮT ĐẦU UPLOAD TOÀN BỘ ẢNH LÊN CLOUDFLARE R2...`);
  console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`🌐 Public Domain: ${R2_PUBLIC_DOMAIN || "Default R2 Endpoint"}\n`);

  const publicDir = path.resolve(process.cwd(), "public");
  const allFiles = getAllFiles(publicDir);

  console.log(`📁 Tìm thấy ${allFiles.length} tệp phương tiện trong thư mục public/`);

  let successCount = 0;
  let failCount = 0;

  // Upload theo nhóm 10 tệp cùng lúc (concurrency = 10)
  const CONCURRENCY = 10;
  for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
    const batch = allFiles.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (file, idx) => {
        const fileIndex = i + idx + 1;
        const rel = path.relative(publicDir, file).replace(/\\/g, "/");
        try {
          await uploadFile(file, publicDir);
          successCount++;
          console.log(`[${fileIndex}/${allFiles.length}] ✅ Đã tải lên: ${rel}`);
        } catch (err: any) {
          failCount++;
          console.error(`[${fileIndex}/${allFiles.length}] ❌ Lỗi khi tải lên ${rel}:`, err?.message || err);
        }
      })
    );
  }

  console.log(`\n🎉 HOÀN TẤT UPLOAD TOÀN BỘ ẢNH LÊN CLOUDFLARE R2!`);
  console.log(`✅ Thành công: ${successCount} tệp`);
  if (failCount > 0) {
    console.log(`❌ Thất bại: ${failCount} tệp`);
  }
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
