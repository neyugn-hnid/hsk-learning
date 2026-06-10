import type { Route } from "./+types/api.mobile.auth.login";
import { data } from "react-router";
import { createMobileToken } from "~/lib/mobile-auth.server";
import { prisma } from "~/lib/db.server";
import { verifyPassword } from "~/lib/password.server";

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return data({ message: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }

  return data({
    token: createMobileToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
