import type { Route } from "./+types/api.ai.split-lessons";
import { data } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { normalizeVocabulary } from "~/lib/vocab.server";
import { splitLessonsByAI } from "~/lib/ai.server";
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const body = await request.json();
  const raw = Array.isArray(body.vocabularies) ? body.vocabularies : [];
  const vocabularies = raw.map(normalizeVocabulary).filter(Boolean);
  if (!vocabularies.length) return data({ message: "Danh sách từ vựng rỗng." }, { status: 400 });
  const lessons = await splitLessonsByAI(vocabularies);
  return data({ lessons });
}
