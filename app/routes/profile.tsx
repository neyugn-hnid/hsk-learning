import type { Route } from "./+types/profile";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  LogOut,
  Save,
  ShieldCheck,
  Smartphone,
  Star,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { SiteLayout } from "~/components/Layout";
import { useToast } from "~/components/Toast";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { prisma } = await import("~/lib/db.server");
  const user = await requireUser(request);

  const [totalLessons, completedLessons, inProgressLessons, quizAttempts] = await Promise.all([
    prisma.lesson.count({ where: { status: "PUBLISHED" } }),
    prisma.userProgress.count({ where: { userId: user.id, completed: true } }),
    prisma.userProgress.count({ where: { userId: user.id, completed: false, progress: { gt: 0 } } }),
    prisma.quizAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const avgQuizScore = quizAttempts.length
    ? Math.round(quizAttempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / quizAttempts.length)
    : 0;

  return {
    user,
    stats: {
      totalLessons,
      completedLessons,
      inProgressLessons,
      quizAttempts: quizAttempts.length,
      averageQuizScore: avgQuizScore,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { prisma } = await import("~/lib/db.server");
  const user = await requireUser(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "updateName") {
    const name = String(form.get("name") || "").trim();
    if (name.length < 2) {
      return { error: "Tên hiển thị phải có ít nhất 2 ký tự." };
    }
    await prisma.user.update({ where: { id: user.id }, data: { name } });
    return { success: "Đã cập nhật tên hiển thị." };
  }

  if (intent === "changePassword") {
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");

    if (!currentPassword || newPassword.length < 6) {
      return { error: "Vui lòng nhập đủ thông tin, mật khẩu mới ít nhất 6 ký tự." };
    }

    const { verifyPassword, hashPassword } = await import("~/lib/password.server");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await verifyPassword(currentPassword, dbUser.password))) {
      return { error: "Mật khẩu hiện tại không đúng." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });
    return { success: "Đã đổi mật khẩu. Vui lòng đăng nhập lại." };
  }

  return { error: "Hành động không hợp lệ." };
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user, stats } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { pushToast } = useToast();

  const [displayName, setDisplayName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      pushToast(actionData.success, "success");
      if (actionData.success.includes("mật khẩu")) {
        setCurrentPassword("");
        setNewPassword("");
      }
    }
    if (actionData?.error) {
      pushToast(actionData.error, "error");
    }
  }, [actionData, pushToast]);

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  const isSubmitting = navigation.state === "submitting";

  return (
    <SiteLayout user={user}>
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Tài khoản</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Star size={22} className="text-red-600" />
          </div>
        </div>

        {/* Hero card */}
        <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-red-600 to-red-500 p-6 text-white shadow-lg shadow-red-100">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-black">
              {initials || "U"}
            </div>
            <div>
              <p className="text-2xl font-black">{user.name}</p>
              <p className="text-red-100">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                <ShieldCheck size={14} />
                {user.role === "ADMIN" ? "Quản trị viên" : "Học viên"}
              </span>
            </div>
          </div>
        </div>

        

        {/* Update name */}
        <div className="mt-8">
          <h2 className="text-lg font-extrabold text-slate-900">Cập nhật hồ sơ</h2>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Form method="post">
              <input type="hidden" name="intent" value="updateName" />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Tên hiển thị</span>
                <input
                  name="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400"
                  placeholder="Nhập tên hiển thị"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting || displayName.trim().length < 2}
                className="mt-4 flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Activity size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Lưu tên hiển thị
              </button>
            </Form>
          </div>
        </div>

        {/* Change password */}
        <div className="mt-6">
          <h2 className="text-lg font-extrabold text-slate-900">Đổi mật khẩu</h2>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Form method="post">
              <input type="hidden" name="intent" value="changePassword" />

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mật khẩu hiện tại</span>
                <div className="relative mt-2">
                  <input
                    name="currentPassword"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-700">Mật khẩu mới</span>
                <div className="relative mt-2">
                  <input
                    name="newPassword"
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400"
                    placeholder="Ít nhất 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !currentPassword || newPassword.length < 6}
                className="mt-4 flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Activity size={18} className="animate-spin" />
                ) : (
                  <ShieldCheck size={18} />
                )}
                Cập nhật mật khẩu
              </button>
            </Form>
          </div>
        </div>

        {/* App info */}
        <div className="mt-6">
          <h2 className="text-lg font-extrabold text-slate-900">Thông tin ứng dụng</h2>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <InfoRow icon={Smartphone} label="Tên ứng dụng" value="HSK Learning" />
            <InfoRow icon={User} label="Nhà phát triển" value="Van Dinh" />
            <InfoRow icon={Info} label="Version" value="1.0.0" />
          </div>
        </div>

        {/* Logout */}
        <div className="mt-8 mb-8">
          <Form method="post" action="/api/auth/logout">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-600 hover:bg-red-100 transition">
              <LogOut size={18} />
              Đăng xuất
            </button>
          </Form>
        </div>
      </main>
    </SiteLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
        <Icon size={18} className="text-red-600" />
      </div>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50">
        <Icon size={16} className="text-red-600" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
