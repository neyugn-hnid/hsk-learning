import type { Route } from "./+types/lessons._index";
import { Link, useSearchParams } from "react-router";
import { ChevronDown, Search } from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const level = url.searchParams.get("level") || "Tất cả";
  const q = url.searchParams.get("q") || "";
  const lessons = await prisma.lesson.findMany({
    where: {
      status: "PUBLISHED",
      ...(level !== "Tất cả" ? { level } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { _count: { select: { vocabularies: true, quizzes: true } } },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
  });
  return { user: await getUser(request), lessons, level, q };
}

export default function Lessons({ loaderData }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const levels = ["Tất cả", "HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"];
  const setLevel = (level: string) => {
    const next = new URLSearchParams(params);
    level === "Tất cả" ? next.delete("level") : next.set("level", level);
    setParams(next);
  };

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">
              Danh sách bài học
            </h1>
            <p className="mt-2 text-slate-600">
              Chọn bài học phù hợp với cấp độ của bạn.
            </p>
          </div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_9.5rem] gap-3 md:w-auto md:min-w-[32rem] md:items-end md:justify-end">
            <label className="min-w-0">
              <form className="relative w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  name="q"
                  defaultValue={loaderData.q}
                  placeholder="Tìm bài học..."
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </form>
            </label>
            <label className="min-w-0">
              <div className="relative w-full">
                <select
                  value={loaderData.level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                >
                  <option value="" disabled>
                    Cấp độ
                  </option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
              </div>
            </label>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loaderData.lessons.map(
            (lesson: (typeof loaderData.lessons)[number]) => (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                    {lesson.level}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{lesson.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {lesson.description}
                </p>
                <div className="mt-5 flex gap-4 text-sm text-slate-500">
                  <span>{lesson._count.vocabularies} từ vựng</span>
                  <span>{lesson._count.quizzes} câu quiz</span>
                </div>
                <div className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-center font-semibold text-white hover:bg-red-600">
                  Vào học
                </div>
              </Link>
            ),
          )}
        </div>
      </main>
    </SiteLayout>
  );
}
