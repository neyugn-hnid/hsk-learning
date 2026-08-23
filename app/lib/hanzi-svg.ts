/**
 * Helper trả về URL SVG chữ Hán từ Cloudflare R2.
 * 
 * Dùng VITE_R2_PUBLIC_DOMAIN (client-side) hoặc R2_PUBLIC_DOMAIN (server-side).
 * Set trong .env: VITE_R2_PUBLIC_DOMAIN=hsklearning.qzz.io
 */

const R2_DOMAIN =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_R2_PUBLIC_DOMAIN) ||
  (typeof process !== "undefined" && process.env?.R2_PUBLIC_DOMAIN);

const R2_BASE = R2_DOMAIN
  ? (R2_DOMAIN.startsWith("http") ? R2_DOMAIN : `https://${R2_DOMAIN}`)
  : null;

/**
 * Trả về URL SVG cho một ký tự Hán, hoặc null nếu không phải chữ Hán
 */
export function getHanziSvgUrl(char: string): string | null {
  if (!R2_BASE || !/[\u4e00-\u9fff\u3400-\u4dbf]/.test(char)) return null;
  return `${R2_BASE}/${encodeURIComponent(char)}.svg`;
}

/**
 * Tách chuỗi thành mảng ký tự, trả về mảng URL SVG (có thể chứa null cho non-Hanzi)
 */
export function getHanziSvgUrls(text: string): (string | null)[] {
  return [...text].map((char) => getHanziSvgUrl(char));
}

/**
 * Trả về R2 base URL đang dùng
 */
export function getR2BaseUrl(): string {
  return R2_BASE;
}
