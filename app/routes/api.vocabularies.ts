import type { Route } from "./+types/api.vocabularies";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const standard = url.searchParams.get("standard") || "HSK20";
  const level = url.searchParams.get("level") || "HSK1";
  const lessonId = url.searchParams.get("lessonId") || "ALL";

  const where: any = {};

  if (lessonId && lessonId !== "ALL") {
    where.lessonId = lessonId;
  } else {
    where.level = level.toUpperCase();
    where.lesson = {
      source: standard.toUpperCase(),
    };
  }

  const vocabularies = await prisma.vocabulary.findMany({
    where,
    select: {
      id: true,
      chinese: true,
      pinyin: true,
      meaningVi: true,
      level: true,
      lessonId: true,
      lesson: {
        select: {
          id: true,
          title: true,
          level: true,
          source: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return data(
    { vocabularies },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    }
  );
}
