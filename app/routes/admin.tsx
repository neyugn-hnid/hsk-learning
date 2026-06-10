import type { Route } from "./+types/admin";
import type { Prisma } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import {
  BookOpen,
  FileJson,
  GitBranch,
  GraduationCap,
  ListChecks,
  Upload,
  Users,
  X,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { useToast } from "~/components/Toast";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  const [
    lessonCount,
    vocabCount,
    quizCount,
    userCount,
    roadmapCount,
    lessons,
    roadmapItems,
  ] = await Promise.all([
    prisma.lesson.count(),
    prisma.vocabulary.count(),
    prisma.quizQuestion.count(),
    prisma.user.count(),
    prisma.roadmapItem.count(),
    prisma.lesson.findMany({
      include: { _count: { select: { vocabularies: true, quizzes: true } } },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.roadmapItem.findMany({
      orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
      take: 20,
    }),
  ]);

  return {
    user,
    lessonCount,
    vocabCount,
    quizCount,
    userCount,
    roadmapCount,
    lessons,
    roadmapItems,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "lesson-import");

  if (intent === "lesson-delete") {
    return deleteLesson(form);
  }

  if (intent === "lesson-delete-all") {
    return deleteAllLessons();
  }

  if (intent === "roadmap-delete") {
    return deleteRoadmapItem(form);
  }

  if (intent === "roadmap-import") {
    return importRoadmap(form);
  }

  return importLessons(form);
}

async function deleteLesson(form: FormData) {
  const lessonId = String(form.get("lessonId") || "").trim();
  if (!lessonId) return { deleteError: "Thiếu mã bài học để xóa." };

  await prisma.lesson.delete({
    where: { id: lessonId },
  });

  return { deleteSuccess: "Đã xóa bài học." };
}

async function deleteAllLessons() {
  const deleted = await prisma.lesson.deleteMany();
  return {
    deleteSuccess:
      deleted.count > 0
        ? `Đã xóa toàn bộ ${deleted.count} bài học.`
        : "Không có bài học nào để xóa.",
  };
}

async function deleteRoadmapItem(form: FormData) {
  const roadmapItemId = String(form.get("roadmapItemId") || "").trim();
  if (!roadmapItemId) return { roadmapDeleteError: "Thiếu mã lộ trình để xóa." };

  await prisma.roadmapItem.delete({
    where: { id: roadmapItemId },
  });

  return { roadmapDeleteSuccess: "Đã xóa mục lộ trình." };
}

async function importLessons(form: FormData) {
  const file = form.get("jsonFile") as File | null;
  const source = String(form.get("source") || "HSK20").trim();

  if (!file || file.size === 0) {
    return { error: "Vui lòng chọn file JSON." };
  }

  try {
    const rawText = await file.text();
    const json = JSON.parse(rawText);
    const rawItems: unknown[] = Array.isArray(json)
      ? json
      : json.lessons || json.data || [];

    if (!rawItems.length) {
      return { error: "File JSON rỗng." };
    }

    let lessonCount = 0;
    let vocabCount = 0;

    for (const item of rawItems) {
      const record = item as Record<string, unknown>;
      const title = String(record.title || record.name || "Bài học").trim();
      const level = String(record.level || record.phase || "HSK1").trim();
      const orderNo = Number(record.orderNo || record.order || 1);
      const description = record.description ? String(record.description) : null;
      const rawVocab = Array.isArray(record.vocabularies) ? record.vocabularies : Array.isArray(record.vocabulary) ? record.vocabulary : [];

      const vocabularies = rawVocab
        .map((v: unknown) => {
          const w = v as Record<string, unknown>;
          const chinese = String(w.chinese || w.word || w.hanzi || "").trim();
          const pinyin = String(w.pinyin || "").trim();
          const meaningVi = String(w.meaningVi || w.vi || w.meaning || w.translation || "").trim();
          if (!chinese || !pinyin || !meaningVi) return null;
          return {
            chinese,
            pinyin,
            meaningVi,
            meaningEn: w.meaningEn ? String(w.meaningEn) : "",
            exampleChinese: w.exampleChinese ? String(w.exampleChinese) : "",
            examplePinyin: w.examplePinyin ? String(w.examplePinyin) : "",
            exampleMeaning: w.exampleMeaning ? String(w.exampleMeaning) : "",
            level: String(w.level || level),
          };
        })
        .filter(Boolean);

      if (!vocabularies.length) continue;

      await prisma.lesson.create({
        data: {
          title,
          description: description || `Bài học ${source}`,
          level,
          source,
          orderNo,
          status: "PUBLISHED",
          vocabularies: { create: vocabularies },
        },
      });
      lessonCount++;
      vocabCount += vocabularies.length;
    }

    return {
      success: `Đã import ${lessonCount} bài học, ${vocabCount} từ vựng.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Lỗi import file.",
    };
  }
}

async function importRoadmap(form: FormData) {
  const file = form.get("roadmapFile") as File | null;
  if (!file || file.size === 0)
    return { roadmapError: "Vui lòng chọn file JSON lộ trình." };

  const rawText = await file.text();
  const json = JSON.parse(rawText);
  const rawItems: unknown[] = Array.isArray(json)
    ? json
    : json.roadmap || json.items || json.data || [];
  const normalized = rawItems
    .map(normalizeRoadmapItem)
    .filter(
      (item): item is NonNullable<ReturnType<typeof normalizeRoadmapItem>> =>
        Boolean(item),
    );

  if (!normalized.length)
    return { roadmapError: "Không tìm thấy mục lộ trình hợp lệ." };

  await prisma.$transaction(
    normalized.map(
      (item: NonNullable<ReturnType<typeof normalizeRoadmapItem>>) =>
        prisma.roadmapItem.create({
          data: {
            title: item.title,
            description: item.description,
            phase: item.phase,
            weekLabel: item.weekLabel,
            level: item.level,
            orderNo: item.orderNo,
            duration: item.duration,
            objectives: item.objectives,
            materials: item.materials,
            vocabulary: item.vocabulary,
            phrases: item.phrases,
          } as Prisma.RoadmapItemCreateInput,
        }),
    ),
  );

  return { roadmapSuccess: `Đã import ${normalized.length} mục vào lộ trình.` };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const lessonImportFetcher = useFetcher<{
    success?: string;
    error?: string;
  }>();
  const roadmapImportFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const { pushToast } = useToast();
  const [lessonFile, setLessonFile] = useState<FileSelection | null>(null);
  const [roadmapFile, setRoadmapFile] = useState<FileSelection | null>(null);
  const [lessonInputKey, setLessonInputKey] = useState(0);
  const [roadmapInputKey, setRoadmapInputKey] = useState(0);
  const roadmapProgress = useRotatingStatus(
    roadmapImportFetcher.state !== "idle",
    [
      "Đang tải file lộ trình từ thiết bị lên...",
      "Đang chuẩn hóa dữ liệu lộ trình...",
      "Đang lưu các mục lộ trình vào hệ thống...",
    ],
  );
  const roadmapItems = loaderData.roadmapItems as Array<
    (typeof loaderData.roadmapItems)[number] & {
      vocabulary?: unknown;
      phrases?: unknown;
    }
  >;

  useFetcherToast(roadmapImportFetcher, {
    successKey: "roadmapSuccess",
    errorKey: "roadmapError",
    onSuccess: () => revalidator.revalidate(),
  });

  useFetcherToast(lessonImportFetcher, {
    successKey: "success",
    errorKey: "error",
    onSuccess: () => { revalidator.revalidate(); setLessonFile(null); setLessonInputKey((k) => k + 1); },
  });

  const lessonImportBusy = lessonImportFetcher.state !== "idle";

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat icon={Users} value={loaderData.userCount} label="Người dùng" />
          <Stat
            icon={BookOpen}
            value={loaderData.lessonCount}
            label="Bài học"
          />
          <Stat
            icon={GraduationCap}
            value={loaderData.vocabCount}
            label="Từ vựng"
          />
          <Stat
            icon={ListChecks}
            value={loaderData.quizCount}
            label="Câu hỏi"
          />
          <Stat
            icon={GitBranch}
            value={loaderData.roadmapCount}
            label="Mục lộ trình"
          />
        </div>
        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="border-b border-slate-100 bg-gradient-to-r from-red-50 via-white to-white p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <FileJson size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
                    Import
                  </p>
                  <h2 className="mt-1 text-xl font-black">Import bài học HSK</h2>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <lessonImportFetcher.Form
                action="/api/admin/lesson-import"
                method="post"
                encType="multipart/form-data"
                className="space-y-4"
              >
                <input type="hidden" name="intent" value="lesson-import" />
                <FilePickerField
                  key={lessonInputKey}
                  file={lessonFile}
                  idleTitle="Chọn JSON bài học"
                  idleHint="Bấm để chọn file từ thiết bị"
                  onClear={() => {
                    setLessonFile(null);
                    setLessonInputKey((current) => current + 1);
                  }}
                >
                  <input
                    type="file"
                    name="jsonFile"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) =>
                      setLessonFile(toFileSelection(event.currentTarget.files?.[0]))
                    }
                  />
                </FilePickerField>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Nguồn dữ liệu</span>
                  <select
                    name="source"
                    defaultValue="HSK20"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-red-400"
                  >
                    <option value="HSK20">HSK 2.0</option>
                    <option value="HSK30">HSK 3.0</option>
                  </select>
                </label>
                <button
                  disabled={lessonImportBusy}
                  className="w-full rounded-2xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {lessonImportBusy ? "Đang xử lý..." : "Import bài học"}
                </button>
              </lessonImportFetcher.Form>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-white p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <GitBranch size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-500">
                    Class Roadmap
                  </p>
                  <h2 className="mt-1 text-xl font-black">Import lộ trình lớp</h2>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <roadmapImportFetcher.Form
                method="post"
                encType="multipart/form-data"
                className="space-y-4"
              >
                <input type="hidden" name="intent" value="roadmap-import" />
                <FilePickerField
                  key={roadmapInputKey}
                  file={roadmapFile}
                  idleTitle="Chọn JSON lộ trình"
                  idleHint="Nhận file roadmap riêng, không lẫn với bài học"
                  onClear={() => {
                    setRoadmapFile(null);
                    setRoadmapInputKey((current) => current + 1);
                  }}
                >
                  <input
                    type="file"
                    name="roadmapFile"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) =>
                      setRoadmapFile(toFileSelection(event.currentTarget.files?.[0]))
                    }
                  />
                </FilePickerField>
                <button
                  disabled={roadmapImportFetcher.state !== "idle"}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                >
                  {roadmapImportFetcher.state === "idle"
                    ? "Import lộ trình"
                    : "Đang xử lý..."}
                </button>
              </roadmapImportFetcher.Form>

              {roadmapImportFetcher.state !== "idle" ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                  {roadmapProgress}
                </div>
              ) : null}

              
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="flex h-[40rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Lessons
                </p>
                <h2 className="mt-1 text-lg font-black">Danh sách bài học HSK</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                  {loaderData.lessons.length} bài
                </span>
                <DeleteAllLessonsButton disabled={!loaderData.lessons.length} />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tên bài</th>
                    <th className="px-6 py-4">Cấp độ</th>
                    <th className="px-6 py-4">Từ vựng</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loaderData.lessons.map(
                    (lesson: (typeof loaderData.lessons)[number]) => (
                      <tr key={lesson.id} className="border-t border-slate-100">
                        <td className="px-6 py-4 font-semibold">
                          {lesson.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                            {lesson.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {lesson._count.vocabularies}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <LessonDeleteButton
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex h-[40rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Roadmap
                </p>
                <h2 className="mt-1 text-lg font-black">Danh sách lộ trình lớp</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                {roadmapItems.length} mục
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {roadmapItems.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                          Buổi {item.orderNo}
                        </span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          {item.phase}
                        </span>
                        {item.weekLabel ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {item.weekLabel}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                    </div>
                    {item.duration ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                        {item.duration}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description || "Chưa có mô tả."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
                      {countJsonArray(item.vocabulary)} từ
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
                      {countJsonArray(item.phrases)} mẫu câu
                    </span>
                  </div>
                  <div className="mt-4">
                    <RoadmapDeleteButton
                      roadmapItemId={item.id}
                      title={item.title}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

function LessonDeleteButton({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  useFetcherToast(fetcher, {
    successKey: "deleteSuccess",
    errorKey: "deleteError",
    onSuccess: () => revalidator.revalidate(),
  });

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="lesson-delete" />
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
        onClick={(event) => {
          if (!window.confirm(`Xóa bài học "${lessonTitle}"?`)) {
            event.preventDefault();
          }
        }}
      >
        {fetcher.state === "idle" ? "Xóa" : "Đang xóa..."}
      </button>
    </fetcher.Form>
  );
}

function RoadmapDeleteButton({
  roadmapItemId,
  title,
}: {
  roadmapItemId: string;
  title: string;
}) {
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  useFetcherToast(fetcher, {
    successKey: "roadmapDeleteSuccess",
    errorKey: "roadmapDeleteError",
    onSuccess: () => revalidator.revalidate(),
  });

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="roadmap-delete" />
      <input type="hidden" name="roadmapItemId" value={roadmapItemId} />
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
        onClick={(event) => {
          if (!window.confirm(`Xóa mục lộ trình "${title}"?`)) {
            event.preventDefault();
          }
        }}
      >
        {fetcher.state === "idle" ? "Xóa mục này" : "Đang xóa..."}
      </button>
    </fetcher.Form>
  );
}

function DeleteAllLessonsButton({ disabled }: { disabled: boolean }) {
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  useFetcherToast(fetcher, {
    successKey: "deleteSuccess",
    errorKey: "deleteError",
    onSuccess: () => revalidator.revalidate(),
  });

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="lesson-delete-all" />
      <button
        type="submit"
        disabled={disabled || fetcher.state !== "idle"}
        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={(event) => {
          if (!window.confirm("Xóa toàn bộ bài học HSK đã import?")) {
            event.preventDefault();
          }
        }}
      >
        {fetcher.state === "idle" ? "Xóa tất cả" : "Đang xóa..."}
      </button>
    </fetcher.Form>
  );
}

function useRotatingStatus(active: boolean, messages: string[]) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || messages.length <= 1) {
      setIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [active, messages]);

  return messages[index] || "";
}

function useFetcherToast(
  fetcher: {
    state: string;
    data?: unknown;
  },
  options: {
    successKey: "success" | "deleteSuccess" | "roadmapSuccess" | "roadmapDeleteSuccess";
    errorKey: "error" | "deleteError" | "roadmapError" | "roadmapDeleteError";
    onSuccess?: () => void;
  },
) {
  const { pushToast } = useToast();
  const lastPayloadRef = useRef<string | null>(null);
  const { successKey, errorKey, onSuccess } = options;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    const payload = JSON.stringify(fetcher.data);
    if (payload === lastPayloadRef.current) return;
    lastPayloadRef.current = payload;

    const data = fetcher.data as Record<string, unknown>;
    const successMessage = data[successKey];
    const errorMessage = data[errorKey];

    if (typeof successMessage === "string" && successMessage) {
      pushToast(successMessage, "success");
      onSuccess?.();
      return;
    }

    if (typeof errorMessage === "string" && errorMessage) {
      pushToast(errorMessage, "error");
    }
  }, [errorKey, fetcher.data, fetcher.state, onSuccess, pushToast, successKey]);
}

type FileSelection = {
  name: string;
  sizeLabel: string;
};

function FilePickerField({
  children,
  file,
  idleTitle,
  idleHint,
  onClear,
  className = "",
}: {
  children: React.ReactNode;
  file: FileSelection | null;
  idleTitle: string;
  idleHint: string;
  onClear: () => void;
  className?: string;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-4 rounded-[1.75rem] border px-4 py-4 transition ${
        file
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/40"
      } ${className}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          file ? "bg-emerald-100 text-emerald-600" : "bg-white text-red-600"
        }`}
      >
        <Upload size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">
          {file ? file.name : idleTitle}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {file ? `Đã chọn • ${file.sizeLabel}` : idleHint}
        </p>
      </div>

      {file ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onClear();
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-red-600"
          aria-label="Bỏ chọn file"
        >
          <X size={16} />
        </button>
      ) : (
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
          JSON
        </span>
      )}

      {children}
    </label>
  );
}

function toFileSelection(file?: File | null): FileSelection | null {
  if (!file) return null;

  return {
    name: file.name,
    sizeLabel: formatFileSize(file.size),
  };
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
        {label}
      </p>
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: any) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-black md:text-3xl">{value}</p>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 md:text-[11px]">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function normalizeRoadmapItem(item: any) {
  if (!item || typeof item !== "object") return null;

  const title = String(
    item.title || item.name || item.sessionTitle || "",
  ).trim();
  if (!title) return null;

  return {
    title,
    description: optionalString(item.description || item.desc || item.summary),
    phase:
      optionalString(item.phase || item.stage || item.module) || "Giai đoạn 1",
    weekLabel: optionalString(item.weekLabel || item.week || item.schedule),
    level: optionalString(item.level || item.classLevel || item.targetLevel),
    orderNo: Number(
      item.orderNo || item.order || item.sessionNo || item.buoi || 1,
    ),
    duration: optionalString(item.duration || item.durationLabel || item.time),
    objectives: toJsonArray(item.objectives || item.goals || item.targets),
    materials: toJsonArray(item.materials || item.resources || item.documents),
    vocabulary: toJsonObjectArray(
      item.vocabulary || item.vocabularies || item.words,
    ),
    phrases: toJsonObjectArray(item.phrases || item.sentences || item.patterns),
  };
}

function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function toJsonArray(value: unknown): Prisma.InputJsonValue | undefined {
  if (Array.isArray(value)) return value.map((item: unknown) => String(item));
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return undefined;
}

function toJsonObjectArray(value: unknown): Prisma.InputJsonValue | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Prisma.InputJsonObject);

  return items.length ? items : undefined;
}

function countJsonArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}
