import type { Route } from "./+types/api.auth.login";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { verifyPassword } from "~/lib/password.server";
import { getSession, sessionStorage } from "~/lib/auth.server";
export async function action({ request }: Route.ActionArgs) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return data(
        { message: "Vui lòng nhập đầy đủ email và mật khẩu." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return data(
        { message: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const session = await getSession(request);
    session.set("userId", user.id);
    return data(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      }
    );
  } catch (err: any) {
    return data(
      { message: err.message || "Lỗi xử lý đăng nhập." },
      { status: 500 }
    );
  }
}
