import type { Route } from "./+types/api.mobile.lessons";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const level = url.searchParams.get("level") || "";
  const q = url.searchParams.get("q") || "";

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "PUBLISHED",
      ...(level ? { level } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { _count: { select: { vocabularies: true, quizzes: true } } },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
  });

  return data({
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      level: lesson.level,
      orderNo: lesson.orderNo,
      vocabularyCount: lesson._count.vocabularies,
      quizCount: lesson._count.quizzes,
    })),
  });
}
