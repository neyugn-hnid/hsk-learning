import type { Route } from "./+types/register";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, Link, redirect, useActionData } from "react-router";
import { useToast } from "~/components/Toast";
import { prisma } from "~/lib/db.server";
import { createUserSession, getUser } from "~/lib/auth.server";
import { hashPassword } from "~/lib/password.server";

export async function loader({ request }: Route.LoaderArgs) {
  if (await getUser(request)) throw redirect("/dashboard");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (!name || !email || password.length < 6) {
    return { error: "Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự." };
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Email đã tồn tại." };
  }
  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
  });
  return createUserSession(request, user.id, "/dashboard", {
    message: "Tạo tài khoản thành công.",
    type: "success",
  });
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const [showPassword, setShowPassword] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    if (actionData?.error) {
      pushToast(actionData.error, "error");
    }
  }, [actionData?.error, pushToast]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.14),_transparent_36%),linear-gradient(180deg,#fffaf5_0%,#fff 55%,#f8fafc_100%)] px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-red-600 text-white shadow-lg shadow-red-100">
            <GraduationCap size={30} />
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-500">HSK Learning</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Tạo tài khoản</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Tạo tài khoản để bắt đầu học HSK, theo lộ trình lớp và lưu quá trình luyện tập của bạn.</p>
        </div>

        <Form method="post" className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Họ tên</span>
            <input
              name="name"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400"
              placeholder="Nhập họ tên"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              name="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Mật khẩu</span>
            <div className="relative mt-2">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400"
                placeholder="Ít nhất 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {actionData?.error ? (
            <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {actionData.error}
            </div>
          ) : null}

          <button className="w-full rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">
            Tạo tài khoản
          </button>
        </Form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-bold text-red-600">
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
