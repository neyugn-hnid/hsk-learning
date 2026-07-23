import { createCookieSessionStorage, redirect } from "react-router";
import { prisma } from "~/lib/db.server";

const sessionSecret = process.env.SESSION_SECRET?.trim();

if (process.env.NODE_ENV === "production" && !sessionSecret) {
  throw new Error("Missing SESSION_SECRET in production environment.");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "hsk_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret || "dev_secret_change_me"],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUser(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: String(userId) },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) throw redirect("/?auth=login");
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user.role !== "ADMIN") throw redirect("/dashboard");
  return user;
}

function buildRedirectUrl(
  redirectTo: string,
  toast?: { message: string; type?: "success" | "error" | "info" },
) {
  if (!toast?.message) return redirectTo;

  const url = new URL(redirectTo, "http://local.app");
  url.searchParams.set("toast", toast.message);
  url.searchParams.set("toastType", toast.type || "info");
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function createUserSession(
  request: Request,
  userId: string,
  redirectTo = "/",
  toast?: { message: string; type?: "success" | "error" | "info" },
) {
  const session = await getSession(request);
  session.set("userId", userId);
  return redirect(buildRedirectUrl(redirectTo, toast), {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function destroyUserSession(request: Request) {
  const session = await getSession(request);
  return redirect(buildRedirectUrl("/", { message: "Đăng xuất thành công.", type: "success" }), {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
