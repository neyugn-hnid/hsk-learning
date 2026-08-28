import type { Route } from "./+types/game-map";
import { SiteLayout } from "~/components/Layout";
import { WorldMap, type MapLesson } from "~/components/GameMap/WorldMap";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  const rawLessons = await prisma.lesson.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      level: true,
      source: true,
      orderNo: true,
      description: true,
      _count: {
        select: { vocabularies: true },
      },
      progress: user ? { where: { userId: user.id }, select: { completed: true, progress: true } } : false,
    },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
  });

  const lessons: MapLesson[] = rawLessons.map((l) => ({
    id: l.id,
    title: l.title,
    level: l.level,
    source: l.source || "HSK20",
    orderNo: l.orderNo,
    description: l.description,
    vocabCount: l._count.vocabularies,
    completed: user ? (l.progress?.[0]?.completed ?? false) : false,
    score: user ? (l.progress?.[0]?.progress ?? 0) : 0,
    stars: user
      ? l.progress?.[0]?.progress
        ? l.progress[0].progress >= 90
          ? 3
          : l.progress[0].progress >= 60
          ? 2
          : 1
        : 0
      : 0,
  }));

  return { user, lessons };
}

export default function GameMapPage({ loaderData }: Route.ComponentProps) {
  const { user, lessons } = loaderData;

  return (
    <SiteLayout user={user} hideFooter={true}>
      <div className="relative min-h-screen bg-[#FDFBF7] text-slate-900">
        {/* Main Content Area */}
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <WorldMap lessons={lessons} user={user} />
        </div>
      </div>
    </SiteLayout>
  );
}
