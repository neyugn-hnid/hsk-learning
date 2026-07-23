import type { Route } from "./+types/admin";
import type { Prisma } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import {
  Activity,
  BookOpen,
  Bot,
  Clock,
  Database,
  FileJson,
  GitBranch,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  Trash2,
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
        .filter((v): v is NonNullable<typeof v> => v != null);

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
  const [levelFilter, setLevelFilter] = useState("");

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
  const lessons = loaderData.lessons;
  const lessonLevels = [...new Set(lessons.map((l) => l.level))].sort();
  const filteredLessons = levelFilter ? lessons.filter((l) => l.level === levelFilter) : lessons;
  const roadmapItems = loaderData.roadmapItems as Array<
    (typeof loaderData.roadmapItems)[number] & {
      vocabulary?: unknown;
      phrases?: unknown;
    }
  >;
  const hsk20Lessons = lessons.filter((lesson) => lesson.source === "HSK20").length;
  const hsk30Lessons = lessons.filter((lesson) => lesson.source === "HSK30").length;
  const publishedLessons = lessons.filter((lesson) => lesson.status === "PUBLISHED").length;
  const totalRoadmapWords = roadmapItems.reduce(
    (sum, item) => sum + countJsonArray(item.vocabulary) + countJsonArray(item.phrases),
    0,
  );
  const adminName = loaderData.user.name || "Admin";

  return (
    <SiteLayout user={loaderData.user}>
      <main className="bg-slate-100/70 px-3 py-4 md:px-4 md:py-6">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Admin Console
                  </p>
                  <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">
                    Bảng điều khiển quản trị
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Xin chào {adminName}. Quản lý nội dung học tập, dữ liệu HSK và lộ trình lớp.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <StatusPill icon={Activity} label="Hệ thống" value="Online" tone="emerald" />
                <StatusPill icon={Clock} label="Phiên" value="Admin" tone="slate" />
              </div>
            </div>

            <div className="grid gap-px bg-slate-200 md:grid-cols-2 xl:grid-cols-5">
              <Stat icon={Users} value={loaderData.userCount} label="Người dùng" meta="Tài khoản hệ thống" />
              <Stat icon={BookOpen} value={loaderData.lessonCount} label="Bài học" meta={`${publishedLessons} published`} />
              <Stat icon={GraduationCap} value={loaderData.vocabCount} label="Từ vựng" meta="Vocabulary records" />
              <Stat icon={ListChecks} value={loaderData.quizCount} label="Câu hỏi" meta="Quiz bank" />
              <Stat icon={GitBranch} value={loaderData.roadmapCount} label="Lộ trình" meta={`${totalRoadmapWords} mục học`} />
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <PanelHeader
                  icon={FileJson}
                  title="Import bài học HSK"
                  subtitle="JSON lessons"
                  tone="red"
                />
                <div className="p-5">
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
                      idleTitle="Chọn file bài học"
                      idleHint="JSON bài học HSK"
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
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Nguồn dữ liệu
                      </span>
                      <select
                        name="source"
                        defaultValue="HSK20"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="HSK20">HSK 2.0</option>
                        <option value="HSK30">HSK 3.0</option>
                      </select>
                    </label>
                    <button
                      disabled={lessonImportBusy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                    >
                      <Upload size={17} />
                      {lessonImportBusy ? "Đang xử lý..." : "Import bài học"}
                    </button>
                  </lessonImportFetcher.Form>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <PanelHeader
                  icon={GitBranch}
                  title="Import lộ trình lớp"
                  subtitle="Roadmap JSON"
                  tone="amber"
                />
                <div className="p-5">
                  <roadmapImportFetcher.Form
                    method="post"
                    encType="multipart/form-data"
                    className="space-y-4"
                  >
                    <input type="hidden" name="intent" value="roadmap-import" />
                    <FilePickerField
                      key={roadmapInputKey}
                      file={roadmapFile}
                      idleTitle="Chọn file lộ trình"
                      idleHint="JSON roadmap lớp học"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                    >
                      <Upload size={17} />
                      {roadmapImportFetcher.state === "idle"
                        ? "Import lộ trình"
                        : "Đang xử lý..."}
                    </button>
                  </roadmapImportFetcher.Form>

                  {roadmapImportFetcher.state !== "idle" ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      {roadmapProgress}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <PanelHeader
                icon={Database}
                title="Tổng quan dữ liệu"
                subtitle="Content inventory"
                tone="slate"
              />
              <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
                <DataCell label="HSK 2.0" value={`${hsk20Lessons} bài`} />
                <DataCell label="HSK 3.0" value={`${hsk30Lessons} bài`} />
                <DataCell label="Từ/bài TB" value={formatAverage(loaderData.vocabCount, loaderData.lessonCount)} />
                <DataCell label="Quiz/bài TB" value={formatAverage(loaderData.quizCount, loaderData.lessonCount)} />
              </div>
              <div className="border-t border-slate-200 p-5">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                    <Bot size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">AI Learning Tools</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Chat, luyện dịch, luyện chữ Hán và quiz đang dùng chung dữ liệu bài học.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="flex min-h-[38rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Content Management
                </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Danh sách bài học HSK</h2>
              </div>
              <div className="flex items-center gap-3">
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="">Tất cả cấp độ</option>
                    {lessonLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {filteredLessons.length} bài
                </span>
                  <DeleteAllLessonsButton disabled={!lessons.length} />
              </div>
            </div>
            <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Bài học</th>
                    <th className="px-5 py-3">Nguồn</th>
                    <th className="px-5 py-3">Cấp độ</th>
                    <th className="px-5 py-3 text-right">Từ</th>
                    <th className="px-5 py-3 text-right">Quiz</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLessons.map((lesson: (typeof lessons)[number]) => (
                      <tr key={lesson.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-950">
                          {lesson.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Thứ tự {lesson.orderNo} · {lesson.status}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                            {lesson.source}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                            {lesson.level}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-700">
                          {lesson._count.vocabularies}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-700">
                          {lesson._count.quizzes}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <LessonDeleteButton
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

            <div className="flex min-h-[38rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Roadmap
                </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Lộ trình lớp gần đây</h2>
              </div>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                {roadmapItems.length} mục
              </span>
            </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {roadmapItems.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-slate-50/70">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                          Buổi {item.orderNo}
                        </span>
                          <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                          {item.phase}
                        </span>
                        {item.weekLabel ? (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            {item.weekLabel}
                          </span>
                        ) : null}
                      </div>
                        <h3 className="mt-3 text-base font-black text-slate-950">{item.title}</h3>
                    </div>
                    {item.duration ? (
                        <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        {item.duration}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description || "Chưa có mô tả."}
                  </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
                      {countJsonArray(item.vocabulary)} từ
                    </span>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
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
                {!roadmapItems.length ? (
                  <div className="p-8 text-center text-sm font-semibold text-slate-500">
                    Chưa có dữ liệu lộ trình.
                  </div>
                ) : null}
            </div>
          </div>
        </section>
        </div>
      </main>
    </SiteLayout>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "emerald" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${toneClass}`}>
      <Icon size={15} />
      <span className="text-[11px] font-black uppercase tracking-[0.12em]">
        {label}
      </span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  icon: any;
  title: string;
  subtitle: string;
  tone: "red" | "amber" | "slate";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-600"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          {subtitle}
        </p>
        <h2 className="mt-0.5 text-base font-black text-slate-950">{title}</h2>
      </div>
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatAverage(total: number, count: number) {
  if (!count) return "0";
  return (total / count).toFixed(1);
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
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
        onClick={(event) => {
          if (!window.confirm(`Xóa bài học "${lessonTitle}"?`)) {
            event.preventDefault();
          }
        }}
      >
        <Trash2 size={14} />
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
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
        onClick={(event) => {
          if (!window.confirm(`Xóa mục lộ trình "${title}"?`)) {
            event.preventDefault();
          }
        }}
      >
        <Trash2 size={14} />
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
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={(event) => {
          if (!window.confirm("Xóa toàn bộ bài học HSK đã import?")) {
            event.preventDefault();
          }
        }}
      >
        <Trash2 size={14} />
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
