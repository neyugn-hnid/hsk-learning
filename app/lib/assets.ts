// Cloudflare R2 CDN Asset Resolver
const R2_DOMAIN = (
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_R2_PUBLIC_DOMAIN) ||
  (typeof process !== "undefined" && (process.env?.R2_PUBLIC_DOMAIN || process.env?.VITE_R2_PUBLIC_DOMAIN)) ||
  "https://pub-0f34801da01d4834a6860bed70c93c54.r2.dev"
).replace(/\/$/, "");

/**
 * Chuyển đổi đường dẫn ảnh cục bộ (/map/..., /images/..., /game/..., /garden/..., /stages/...)
 * sang URL Cloudflare R2 CDN tốc độ cao.
 */
export function r2Asset(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, "");
  return `${R2_DOMAIN}/${cleanPath}`;
}

export function getR2Domain(): string {
  return R2_DOMAIN;
}
