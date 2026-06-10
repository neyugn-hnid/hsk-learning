import type { Route } from "./+types/hsk30";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { CustomSelect } from "~/components/CustomSelect";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const level = url.searchParams.get("level") || "";
  const q = url.searchParams.get("q") || "";

  const allLessons = await prisma.lesson.findMany({
    where: {
      status: "PUBLISHED",
      source: "HSK30",
    },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
  });

  const levels = [...new Set(allLessons.map((l) => l.level).filter(Boolean))].sort();

  const filteredLessons = await prisma.lesson.findMany({
    where: {
      status: "PUBLISHED",
      source: "HSK30",
      ...(level ? { level } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { vocabularies: true } } },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
  });

  return { user: await getUser(request), lessons: filteredLessons, levels, q, level };
}

export default function HSK30Page({ loaderData }: Route.ComponentProps) {
  const data = loaderData!;
  const [params, setParams] = useSearchParams();
  const { lessons, levels, q, level } = data;

  const setLevel = (lvl: string) => {
    const next = new URLSearchParams(params);
    if (lvl) next.set("level", lvl);
    else next.delete("level");
    setParams(next);
  };

  return (
    <SiteLayout user={data.user}>
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                <Sparkles size={20} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">HSK 3.0</h1>
              </div>
            </div>
          </div>

          {/* Search + desktop level dropdown */}
          {/* Search + level filter */}
          <div className="grid w-full grid-cols-[minmax(0,1fr)_10rem] gap-3 md:w-auto md:min-w-[34rem] md:items-end md:justify-end">
            <label className="min-w-0">
              <form className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Tìm bài học..."
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => { const next = new URLSearchParams(params); next.delete("q"); setParams(next); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                  ><X size={16} /></button>
                ) : null}
              </form>
            </label>
            {levels.length > 0 ? (
              <CustomSelect
                value={level}
                onChange={setLevel}
                options={[{ value: "", label: "Tất cả" }, ...levels.map((lvl) => ({ value: lvl, label: lvl }))]}
                focusColor="focus:border-amber-400 focus:ring-amber-100"
              />
            ) : null}
          </div>
        </div>

        {/* Lesson cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lessons/${lesson.id}`}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md h-56"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {lesson.level}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Buổi {lesson.orderNo}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                {lesson.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {lesson.description || "Bài học HSK 3.0."}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold text-slate-400">
                  {lesson._count.vocabularies} từ vựng
                </span>
                <ArrowRight size={18} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {lessons.length === 0 ? (
          <div className="mt-12 text-center">
            <Sparkles size={48} className="mx-auto text-slate-300" />
            <p className="mt-4 text-slate-500">Chưa có bài học phù hợp.</p>
          </div>
        ) : null}
      </main>
    </SiteLayout>
  );
}
