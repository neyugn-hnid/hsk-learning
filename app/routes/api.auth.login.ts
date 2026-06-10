import type { Route } from "./+types/api.auth.login";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { verifyPassword } from "~/lib/password.server";
import { getSession, sessionStorage } from "~/lib/auth.server";
export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  const user = await prisma.user.findUnique({
    where: { email: String(body.email || "").toLowerCase() },
  });
  if (
    !user ||
    !(await verifyPassword(String(body.password || ""), user.password))
  )
    return data(
      { message: "Email hoặc mật khẩu không đúng." },
      { status: 401 },
    );
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
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } },
  );
}
