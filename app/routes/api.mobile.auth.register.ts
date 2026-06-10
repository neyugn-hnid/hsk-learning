import type { Route } from "./+types/api.mobile.auth.register";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { createMobileToken } from "~/lib/mobile-auth.server";
import { hashPassword } from "~/lib/password.server";

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || password.length < 6) {
    return data(
      { message: "Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return data({ message: "Email đã tồn tại." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
  });

  return data({
    token: createMobileToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
