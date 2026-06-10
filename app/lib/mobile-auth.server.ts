import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "~/lib/db.server";

const tokenSecret = process.env.SESSION_SECRET?.trim() || "dev_secret_change_me";

type MobileTokenPayload = {
  userId: string;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function sign(input: string) {
  return createHmac("sha256", tokenSecret).update(input).digest("base64url");
}

export function createMobileToken(userId: string, expiresInDays = 30) {
  const payload: MobileTokenPayload = {
    userId,
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyMobileToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const validSignature =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!validSignature) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as MobileTokenPayload;
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireMobileUser(request: Request) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const payload = verifyMobileToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true },
  });
}
