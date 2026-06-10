import type { Route } from "./+types/dashboard";
import { BookOpen, CheckCircle2, GraduationCap, Trophy } from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const [lessonCount, vocabCount, progressCount, attempts] = await Promise.all([
    prisma.lesson.count(),
    prisma.vocabulary.count(),
    prisma.userProgress.count({ where: { userId: user.id, completed: true } }),
    prisma.quizAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const avg = attempts.length ? Math.round(attempts.reduce((s: number, a: typeof attempts[number]) => s + (a.score / a.total) * 100, 0) / attempts.length) : 0;
  return { user, lessonCount, vocabCount, progressCount, avg };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return <SiteLayout user={loaderData.user}><main className="mx-auto max-w-7xl px-4 py-8 md:py-10"><h1 className="text-3xl font-extrabold">Tiến độ học tập của {loaderData.user.name}</h1><p className="mt-2 text-slate-600">Trang này theo dõi kết quả học HSK của bạn. Phần lộ trình trên lớp đã được tách sang tab Lộ trình riêng.</p><div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat icon={BookOpen} value={loaderData.lessonCount} label="Tổng bài học"/><Stat icon={CheckCircle2} value={loaderData.progressCount} label="Bài hoàn thành"/><Stat icon={GraduationCap} value={loaderData.vocabCount} label="Từ vựng"/><Stat icon={Trophy} value={`${loaderData.avg}%`} label="Điểm trung bình"/></div></main></SiteLayout>;
}
function Stat({ icon: Icon, value, label }: any) { return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon size={20}/></div><div><p className="text-xl font-black md:text-3xl">{value}</p><p className="text-xs font-medium text-slate-500 md:text-sm">{label}</p></div></div></div>; }
