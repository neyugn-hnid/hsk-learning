import type { Route } from "./+types/api.mobile.lessons.$lessonId";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";
import { serializeQuizOptions } from "~/lib/mobile-serializers.server";

export async function loader({ params }: Route.LoaderArgs) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { vocabularies: true, grammars: true, quizzes: true },
  });

  if (!lesson) {
    return data({ message: "Không tìm thấy bài học." }, { status: 404 });
  }

  return data({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      level: lesson.level,
      orderNo: lesson.orderNo,
      vocabularies: lesson.vocabularies,
      grammars: lesson.grammars,
      quizzes: lesson.quizzes.map((quiz) => ({
        id: quiz.id,
        type: quiz.type,
        question: quiz.question,
        promptMeaning: quiz.promptMeaning,
        promptPinyin: quiz.promptPinyin,
        options: serializeQuizOptions(quiz.options),
        answer: quiz.answer,
      })),
    },
  });
}
