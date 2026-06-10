import type { Prisma } from "@prisma/client";
import type { Route } from "./+types/roadmap";
import { ArrowRight, Map, Search } from "lucide-react";
import { CustomSelect } from "~/components/CustomSelect";
import { Link, useSearchParams } from "react-router";
import { SiteLayout } from "~/components/Layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const phase = url.searchParams.get("phase") || "Tất cả";
  const q = url.searchParams.get("q") || "";
  const where: Prisma.RoadmapItemWhereInput = {
    ...(phase !== "Tất cả" ? { phase } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, phases] = await Promise.all([
    prisma.roadmapItem.findMany({
      where,
      orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
    }),
    prisma.roadmapItem.findMany({
      distinct: ["phase"],
      select: { phase: true },
      orderBy: { phase: "asc" },
    }),
  ]);

  return {
    user,
    items,
    q,
    phase,
    phases: ["Tất cả", ...phases.map((item: { phase: string }) => item.phase)],
  };
}

export default function RoadmapPage({ loaderData }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const items = loaderData.items as Array<
    (typeof loaderData.items)[number] & {
      vocabulary?: unknown;
      phrases?: unknown;
    }
  >;

  const setPhase = (phase: string) => {
    const next = new URLSearchParams(params);
    if (phase === "Tất cả") next.delete("phase");
    else next.set("phase", phase);
    setParams(next);
  };

  const grouped = items.reduce<Record<string, typeof items>>(
    (acc: Record<string, typeof items>, item: (typeof items)[number]) => {
      acc[item.phase] = [...(acc[item.phase] || []), item];
      return acc;
    },
    {},
  );

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <Map size={20} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">Lộ Trình Học</h1>
              </div>
            </div>
          </div>

            <div className="grid w-full grid-cols-[minmax(0,1fr)_10rem] gap-3 md:w-auto md:min-w-[34rem] md:items-end md:justify-end">
              <label className="min-w-0">
                <form className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="q"
                    defaultValue={loaderData.q}
                    placeholder="Tìm trong lộ trình..."
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                </form>
              </label>
              <CustomSelect
                value={loaderData.phase}
                onChange={setPhase}
                options={loaderData.phases.map((phase) => ({ value: phase, label: phase }))}
                focusColor="focus:border-red-400 focus:ring-red-100"
              />
            </div>
          </div>

          {(Object.entries(grouped) as Array<[string, typeof items]>).map(([phase, phaseItems]) => (
            <section key={phase} className="mt-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{phase}</h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {phaseItems.map((item) => {
                  const totalCount = countJsonObjects(item.vocabulary) + countJsonObjects(item.phrases);
                  return (
                  <Link
                    key={item.id}
                    to={`/roadmap/${item.id}`}
                    className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md h-56"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                        {item.phase}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Buổi {item.orderNo}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {item.description || "Buổi học trong lộ trình."}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-sm font-semibold text-slate-400">
                        {totalCount} từ & câu
                      </span>
                      <ArrowRight size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {items.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              Chưa có dữ liệu lộ trình phù hợp với bộ lọc hiện tại.
            </div>
          ) : null}
      </main>
    </SiteLayout>
  );
}

type RoadmapEntry = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
};

function toRoadmapEntries(value: unknown): RoadmapEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      chinese: String(item.chinese || ""),
      pinyin: String(item.pinyin || ""),
      meaningVi: String(item.meaningVi || item.meaning || ""),
    }))
    .filter((item) => item.chinese && item.meaningVi);
}

function countJsonObjects(value: unknown) {
  return toRoadmapEntries(value).length;
}
