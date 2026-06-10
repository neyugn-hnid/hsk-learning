import type { Route } from "./+types/api.mobile.roadmap";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { requireMobileUser } from "~/lib/mobile-auth.server";
import { serializeRoadmapEntries } from "~/lib/mobile-serializers.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireMobileUser(request);
  if (!user) {
    return data({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const phase = url.searchParams.get("phase") || "";
  const q = url.searchParams.get("q") || "";

  const items = await prisma.roadmapItem.findMany({
    where: {
      ...(phase ? { phase } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
  });

  return data({
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      phase: item.phase,
      weekLabel: item.weekLabel,
      level: item.level,
      orderNo: item.orderNo,
      duration: item.duration,
      vocabularyCount: serializeRoadmapEntries(item.vocabulary).length,
      phraseCount: serializeRoadmapEntries(item.phrases).length,
    })),
  });
}
