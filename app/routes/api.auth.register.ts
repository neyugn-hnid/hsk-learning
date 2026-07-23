import type { Route } from "./+types/api.auth.register";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { hashPassword } from "~/lib/password.server";
import { getSession, sessionStorage } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!name || !email || password.length < 6)
    return data({ message: "Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } }))
    return data({ message: "Email đã tồn tại." }, { status: 409 });
  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
    select: { id: true, name: true, email: true, role: true },
  });
  const session = await getSession(request);
  session.set("userId", user.id);
  return data(
    { user },
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
  );
}
