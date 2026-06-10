import type { Route } from "./+types/api.mobile.roadmap.$roadmapId";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { requireMobileUser } from "~/lib/mobile-auth.server";
import {
  serializeRoadmapEntries,
  serializeStringArray,
} from "~/lib/mobile-serializers.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireMobileUser(request);
  if (!user) {
    return data({ message: "Unauthorized" }, { status: 401 });
  }

  const roadmap = await prisma.roadmapItem.findUnique({
    where: { id: params.roadmapId },
  });

  if (!roadmap) {
    return data({ message: "Không tìm thấy lộ trình." }, { status: 404 });
  }

  return data({
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      phase: roadmap.phase,
      weekLabel: roadmap.weekLabel,
      level: roadmap.level,
      orderNo: roadmap.orderNo,
      duration: roadmap.duration,
      objectives: serializeStringArray(roadmap.objectives),
      materials: serializeStringArray(roadmap.materials),
      vocabulary: serializeRoadmapEntries(roadmap.vocabulary),
      phrases: serializeRoadmapEntries(roadmap.phrases),
    },
  });
}
