import type { Route } from "./+types/admin";
import type { Prisma, Role } from "@prisma/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useRevalidator, Link } from "react-router";
import {
  Activity,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  FileJson,
  Filter,
  Flame,
  FolderSync,
  GitBranch,
  GraduationCap,
  Layers,
  ListChecks,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { useToast } from "~/components/Toast";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

// =============================================================================
// 1. LOADER & ACTION HANDLERS
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  const [
    lessonCount,
    vocabCount,
    quizCount,
    userCount,
    studentCount,
    roadmapCount,
    lessons,
    roadmapItems,
    users,
  ] = await Promise.all([
    prisma.lesson.count(),
    prisma.vocabulary.count(),
    prisma.quizQuestion.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.roadmapItem.count(),
    prisma.lesson.findMany({
      include: { _count: { select: { vocabularies: true, quizzes: true } } },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.roadmapItem.findMany({
      orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    user,
    lessonCount,
    vocabCount,
    quizCount,
    userCount,
    studentCount,
    roadmapCount,
    lessons,
    roadmapItems,
    users,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "lesson-import");

  if (intent === "user-role-update") {
    return updateUserRole(form);
  }

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

  if (intent === "roadmap-vocab-add") {
    return addVocabToRoadmap(form);
  }

  if (intent === "roadmap-vocab-delete") {
    return deleteVocabFromRoadmap(form);
  }

  if (intent === "roadmap-vocab-edit") {
    return editVocabInRoadmap(form);
  }

  if (intent === "lesson-vocab-add") {
    return addVocabToLesson(form);
  }

  return importLessons(form);
}

async function addVocabToRoadmap(form: FormData) {
  const roadmapItemId = String(form.get("roadmapItemId") || "").trim();
  const chinese = String(form.get("chinese") || "").trim();
  const pinyin = String(form.get("pinyin") || "").trim();
  const meaningVi = String(form.get("meaningVi") || "").trim();
  const level = String(form.get("level") || "HSK1").trim();
  const exampleChinese = String(form.get("exampleChinese") || "").trim();
  const examplePinyin = String(form.get("examplePinyin") || "").trim();
  const exampleMeaning = String(form.get("exampleMeaning") || "").trim();
  const bulkText = String(form.get("bulkText") || "").trim();

  if (!roadmapItemId) return { addVocabError: "Vui lòng chọn bài học trong lộ trình." };

  const roadmap = await prisma.roadmapItem.findUnique({
    where: { id: roadmapItemId },
  });
  if (!roadmap) return { addVocabError: "Không tìm thấy bài lộ trình đã chọn." };

  let currentVocab: any[] = Array.isArray(roadmap.vocabulary) ? [...roadmap.vocabulary] : [];

  if (bulkText) {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    let addedCount = 0;
    for (const line of lines) {
      const parts = line.includes("\t")
        ? line.split("\t")
        : line.includes("|")
        ? line.split("|")
        : line.includes(" - ")
        ? line.split(" - ")
        : line.split(",");
      if (parts.length >= 3) {
        const c = parts[0].trim();
        const p = parts[1].trim();
        const m = parts.slice(2).join(",").trim();
        if (c && p && m) {
          currentVocab.push({
            chinese: c,
            pinyin: p,
            meaningVi: m,
            level: level || roadmap.level || roadmap.phase || "HSK1",
          });
          addedCount++;
        }
      }
    }
    if (addedCount === 0) {
      return { addVocabError: "Không tìm thấy từ hợp lệ trong danh sách hàng loạt. Định dạng: Hán tự | Pinyin | Nghĩa" };
    }

    await prisma.roadmapItem.update({
      where: { id: roadmapItemId },
      data: { vocabulary: currentVocab },
    });

    return { addVocabSuccess: `Đã thêm thành công ${addedCount} từ vựng vào bài "${roadmap.title}".` };
  }

  if (!chinese || !pinyin || !meaningVi) {
    return { addVocabError: "Vui lòng nhập đầy đủ Hán tự, Pinyin và Nghĩa tiếng Việt." };
  }

  const newWord: any = {
    chinese,
    pinyin,
    meaningVi,
    level: level || roadmap.level || roadmap.phase || "HSK1",
  };
  if (exampleChinese) newWord.exampleChinese = exampleChinese;
  if (examplePinyin) newWord.examplePinyin = examplePinyin;
  if (exampleMeaning) newWord.exampleMeaning = exampleMeaning;

  currentVocab.push(newWord);

  await prisma.roadmapItem.update({
    where: { id: roadmapItemId },
    data: { vocabulary: currentVocab },
  });

  return { addVocabSuccess: `Đã thêm từ "${chinese}" (${pinyin}: ${meaningVi}) vào bài "${roadmap.title}".` };
}

async function deleteVocabFromRoadmap(form: FormData) {
  const roadmapItemId = String(form.get("roadmapItemId") || "").trim();
  const wordIndex = Number(form.get("wordIndex"));
  const chinese = String(form.get("chinese") || "").trim();

  if (!roadmapItemId) return { addVocabError: "Thiếu thông tin bài học." };

  const roadmap = await prisma.roadmapItem.findUnique({
    where: { id: roadmapItemId },
  });
  if (!roadmap) return { addVocabError: "Không tìm thấy bài học." };

  let currentVocab: any[] = Array.isArray(roadmap.vocabulary) ? [...roadmap.vocabulary] : [];
  if (Number.isInteger(wordIndex) && wordIndex >= 0 && wordIndex < currentVocab.length) {
    currentVocab.splice(wordIndex, 1);
  } else if (chinese) {
    currentVocab = currentVocab.filter((w) => w.chinese !== chinese);
  }

  await prisma.roadmapItem.update({
    where: { id: roadmapItemId },
    data: { vocabulary: currentVocab },
  });

  return { addVocabSuccess: `Đã xóa từ vựng khỏi bài "${roadmap.title}".` };
}

async function editVocabInRoadmap(form: FormData) {
  const roadmapItemId = String(form.get("roadmapItemId") || "").trim();
  const wordIndex = Number(form.get("wordIndex"));
  const chinese = String(form.get("chinese") || "").trim();
  const pinyin = String(form.get("pinyin") || "").trim();
  const meaningVi = String(form.get("meaningVi") || "").trim();
  const exampleChinese = String(form.get("exampleChinese") || "").trim();
  const examplePinyin = String(form.get("examplePinyin") || "").trim();
  const exampleMeaning = String(form.get("exampleMeaning") || "").trim();

  if (!roadmapItemId) return { addVocabError: "Thiếu thông tin bài học." };
  if (!chinese || !pinyin || !meaningVi) {
    return { addVocabError: "Vui lòng nhập đầy đủ Hán tự, Pinyin và Nghĩa tiếng Việt." };
  }

  const roadmap = await prisma.roadmapItem.findUnique({
    where: { id: roadmapItemId },
  });
  if (!roadmap) return { addVocabError: "Không tìm thấy bài học." };

  let currentVocab: any[] = Array.isArray(roadmap.vocabulary) ? [...roadmap.vocabulary] : [];
  if (!Number.isInteger(wordIndex) || wordIndex < 0 || wordIndex >= currentVocab.length) {
    return { addVocabError: "Không tìm thấy vị trí từ vựng cần chỉnh sửa." };
  }

  const existingWord = currentVocab[wordIndex] || {};
  const updatedWord: any = {
    ...existingWord,
    chinese,
    pinyin,
    meaningVi,
  };
  if (exampleChinese) updatedWord.exampleChinese = exampleChinese;
  else delete updatedWord.exampleChinese;

  if (examplePinyin) updatedWord.examplePinyin = examplePinyin;
  else delete updatedWord.examplePinyin;

  if (exampleMeaning) updatedWord.exampleMeaning = exampleMeaning;
  else delete updatedWord.exampleMeaning;

  currentVocab[wordIndex] = updatedWord;

  await prisma.roadmapItem.update({
    where: { id: roadmapItemId },
    data: { vocabulary: currentVocab },
  });

  return { addVocabSuccess: `Đã cập nhật từ "${chinese}" (${pinyin}: ${meaningVi}) thành công.` };
}

async function addVocabToLesson(form: FormData) {
  const lessonId = String(form.get("lessonId") || "").trim();
  const chinese = String(form.get("chinese") || "").trim();
  const pinyin = String(form.get("pinyin") || "").trim();
  const meaningVi = String(form.get("meaningVi") || "").trim();
  const level = String(form.get("level") || "HSK1").trim();
  const exampleChinese = String(form.get("exampleChinese") || "").trim();
  const examplePinyin = String(form.get("examplePinyin") || "").trim();
  const exampleMeaning = String(form.get("exampleMeaning") || "").trim();
  const bulkText = String(form.get("bulkText") || "").trim();

  if (!lessonId) return { addVocabError: "Vui lòng chọn bài học." };

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return { addVocabError: "Không tìm thấy bài học." };

  if (bulkText) {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const createData = [];
    for (const line of lines) {
      const parts = line.includes("\t")
        ? line.split("\t")
        : line.includes("|")
        ? line.split("|")
        : line.includes(" - ")
        ? line.split(" - ")
        : line.split(",");
      if (parts.length >= 3) {
        const c = parts[0].trim();
        const p = parts[1].trim();
        const m = parts.slice(2).join(",").trim();
        if (c && p && m) {
          createData.push({
            chinese: c,
            pinyin: p,
            meaningVi: m,
            level: level || lesson.level || "HSK1",
            lessonId,
          });
        }
      }
    }
    if (createData.length === 0) {
      return { addVocabError: "Không tìm thấy từ hợp lệ trong danh sách nhập hàng loạt." };
    }

    await prisma.vocabulary.createMany({
      data: createData,
    });

    return { addVocabSuccess: `Đã thêm thành công ${createData.length} từ vựng vào bài "${lesson.title}".` };
  }

  if (!chinese || !pinyin || !meaningVi) {
    return { addVocabError: "Vui lòng nhập đầy đủ Hán tự, Pinyin và Nghĩa tiếng Việt." };
  }

  await prisma.vocabulary.create({
    data: {
      chinese,
      pinyin,
      meaningVi,
      level: level || lesson.level || "HSK1",
      exampleChinese: exampleChinese || null,
      examplePinyin: examplePinyin || null,
      exampleMeaning: exampleMeaning || null,
      lessonId,
    },
  });

  return { addVocabSuccess: `Đã thêm từ "${chinese}" (${pinyin}: ${meaningVi}) vào bài "${lesson.title}".` };
}

async function updateUserRole(form: FormData) {
  const userId = String(form.get("userId") || "").trim();
  const newRole = String(form.get("newRole") || "USER").trim() as Role;

  if (!userId) return { userError: "Thiếu mã tài khoản người dùng." };

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  const roleLabels: Record<string, string> = {
    STUDENT: "Học Viên VIP (Được học Lộ Trình)",
    USER: "Thành Viên Thường",
    ADMIN: "Quản Trị Viên",
  };

  return {
    userSuccess: `Đã phân quyền tài khoản thành ${roleLabels[newRole] || newRole}.`,
  };
}

async function deleteLesson(form: FormData) {
  const lessonId = String(form.get("lessonId") || "").trim();
  if (!lessonId) return { deleteError: "Thiếu mã bài học để xóa." };

  await prisma.lesson.delete({
    where: { id: lessonId },
  });

  return { deleteSuccess: "Đã xóa bài học thành công." };
}

async function deleteAllLessons() {
  const deleted = await prisma.lesson.deleteMany();
  return {
    deleteSuccess:
      deleted.count > 0
        ? `Đã xóa toàn bộ ${deleted.count} bài học khỏi cơ sở dữ liệu.`
        : "Không có bài học nào để xóa.",
  };
}

async function deleteRoadmapItem(form: FormData) {
  const roadmapItemId = String(form.get("roadmapItemId") || "").trim();
  if (!roadmapItemId) return { roadmapDeleteError: "Thiếu mã lộ trình để xóa." };

  await prisma.roadmapItem.delete({
    where: { id: roadmapItemId },
  });

  return { roadmapDeleteSuccess: "Đã xóa mục lộ trình thành công." };
}

async function importLessons(form: FormData) {
  const file = form.get("jsonFile") as File | null;
  const source = String(form.get("source") || "HSK20").trim();

  if (!file || file.size === 0) {
    return { error: "Vui lòng chọn file JSON bài học." };
  }

  try {
    const rawText = await file.text();
    const json = JSON.parse(rawText);
    const rawItems: unknown[] = Array.isArray(json)
      ? json
      : json.lessons || json.data || [];

    if (!rawItems.length) {
      return { error: "File JSON rỗng hoặc sai cấu trúc." };
    }

    let lessonCount = 0;
    let vocabCount = 0;

    for (const item of rawItems) {
      const record = item as Record<string, unknown>;
      const title = String(record.title || record.name || "Bài học").trim();
      const level = String(record.level || record.phase || "HSK1").trim();
      const orderNo = Number(record.orderNo || record.order || 1);
      const description = record.description ? String(record.description) : null;
      const rawVocab = Array.isArray(record.vocabularies)
        ? record.vocabularies
        : Array.isArray(record.vocabulary)
          ? record.vocabulary
          : [];

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
      success: `Đã nạp thành công ${lessonCount} bài học và ${vocabCount} từ vựng vào hệ thống.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Lỗi khi xử lý file bài học JSON.",
    };
  }
}

async function importRoadmap(form: FormData) {
  const file = form.get("roadmapFile") as File | null;
  if (!file || file.size === 0)
    return { roadmapError: "Vui lòng chọn file JSON lộ trình." };

  try {
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
      return { roadmapError: "Không tìm thấy mục lộ trình hợp lệ trong file." };

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

    return { roadmapSuccess: `Đã nhập thành công ${normalized.length} ải vào lộ trình lớp.` };
  } catch (error) {
    return {
      roadmapError: error instanceof Error ? error.message : "Lỗi khi xử lý file lộ trình.",
    };
  }
}

// =============================================================================
// 2. MAIN ADMIN COMPONENT
// =============================================================================

export default function AdminPage({ loaderData }: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<"users" | "lessons" | "roadmap" | "import" | "add-vocab">("users");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonLevelFilter, setLessonLevelFilter] = useState<string>("");
  const [lessonSourceFilter, setLessonSourceFilter] = useState<string>("");
  const [roadmapPhaseFilter, setRoadmapPhaseFilter] = useState<string>("");
  const [roadmapSearch, setRoadmapSearch] = useState("");

  // State for Add Vocabulary Tab
  const [vocabTargetType, setVocabTargetType] = useState<"roadmap" | "lesson">("roadmap");
  const [selectedHskLevel, setSelectedHskLevel] = useState<string>("HSK1");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [inputChinese, setInputChinese] = useState("");
  const [inputPinyin, setInputPinyin] = useState("");
  const [inputMeaningVi, setInputMeaningVi] = useState("");
  const [inputExampleChinese, setInputExampleChinese] = useState("");
  const [inputExamplePinyin, setInputExamplePinyin] = useState("");
  const [inputExampleMeaning, setInputExampleMeaning] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("single");
  const [editingVocab, setEditingVocab] = useState<{
    index: number;
    roadmapItemId: string;
    chinese: string;
    pinyin: string;
    meaningVi: string;
    exampleChinese?: string;
    examplePinyin?: string;
    exampleMeaning?: string;
  } | null>(null);

  const lessonImportFetcher = useFetcher<{ success?: string; error?: string }>();
  const roadmapImportFetcher = useFetcher<typeof action>();
  const roleUpdateFetcher = useFetcher<typeof action>();
  const addVocabFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  const [lessonFile, setLessonFile] = useState<FileSelection | null>(null);
  const [roadmapFile, setRoadmapFile] = useState<FileSelection | null>(null);
  const [lessonInputKey, setLessonInputKey] = useState(0);
  const [roadmapInputKey, setRoadmapInputKey] = useState(0);

  const roadmapProgress = useRotatingStatus(
    roadmapImportFetcher.state !== "idle",
    [
      "Đang tải file lộ trình lên máy chủ...",
      "Đang phân tích cấu trúc từ vựng & ngữ pháp...",
      "Đang lưu các chặng ải vào cơ sở dữ liệu...",
    ],
  );

  // Toast notifications on fetcher results
  useFetcherToast(roadmapImportFetcher, {
    successKey: "roadmapSuccess",
    errorKey: "roadmapError",
    onSuccess: () => {
      revalidator.revalidate();
      setRoadmapFile(null);
      setRoadmapInputKey((k) => k + 1);
    },
  });

  useFetcherToast(lessonImportFetcher, {
    successKey: "success",
    errorKey: "error",
    onSuccess: () => {
      revalidator.revalidate();
      setLessonFile(null);
      setLessonInputKey((k) => k + 1);
    },
  });

  useFetcherToast(roleUpdateFetcher, {
    successKey: "userSuccess",
    errorKey: "userError",
    onSuccess: () => revalidator.revalidate(),
  });

  useFetcherToast(addVocabFetcher, {
    successKey: "addVocabSuccess",
    errorKey: "addVocabError",
    onSuccess: () => {
      revalidator.revalidate();
      setInputChinese("");
      setInputPinyin("");
      setInputMeaningVi("");
      setInputExampleChinese("");
      setInputExamplePinyin("");
      setInputExampleMeaning("");
      setBulkText("");
      setEditingVocab(null);
    },
  });

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return loaderData.users.filter((u) => {
      const matchQuery =
        !userSearch ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchQuery && matchRole;
    });
  }, [loaderData.users, userSearch, userRoleFilter]);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return loaderData.lessons.filter((l) => {
      const matchQuery =
        !lessonSearch ||
        l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
        l.level.toLowerCase().includes(lessonSearch.toLowerCase());
      const matchLevel = !lessonLevelFilter || l.level === lessonLevelFilter;
      const matchSource = !lessonSourceFilter || l.source === lessonSourceFilter;
      return matchQuery && matchLevel && matchSource;
    });
  }, [loaderData.lessons, lessonSearch, lessonLevelFilter, lessonSourceFilter]);

  // Lesson levels list for filter
  const lessonLevels = useMemo(() => {
    return [...new Set(loaderData.lessons.map((l) => l.level))].sort();
  }, [loaderData.lessons]);

  // Filtered Roadmap Items
  const filteredRoadmapItems = useMemo(() => {
    return loaderData.roadmapItems.filter((r) => {
      const matchSearch =
        !roadmapSearch ||
        r.title.toLowerCase().includes(roadmapSearch.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(roadmapSearch.toLowerCase()));
      const matchPhase = !roadmapPhaseFilter || r.phase === roadmapPhaseFilter;
      return matchSearch && matchPhase;
    });
  }, [loaderData.roadmapItems, roadmapSearch, roadmapPhaseFilter]);

  const roadmapPhases = useMemo(() => {
    return [...new Set(loaderData.roadmapItems.map((r) => r.phase))];
  }, [loaderData.roadmapItems]);

  // Items filtered automatically by selected HSK level
  const currentLevelItems = useMemo(() => {
    if (vocabTargetType === "roadmap") {
      const items = loaderData.roadmapItems.filter((r) => {
        const itemLevel = (r.level || r.phase || "").toUpperCase();
        return (
          itemLevel.includes(selectedHskLevel.toUpperCase()) ||
          (selectedHskLevel === "HSK1" && (itemLevel.includes("1") || itemLevel === "HSK1")) ||
          (selectedHskLevel === "HSK2" && (itemLevel.includes("2") || itemLevel === "HSK2")) ||
          (selectedHskLevel === "HSK3" && (itemLevel.includes("3") || itemLevel === "HSK3")) ||
          (selectedHskLevel === "HSK4" && (itemLevel.includes("4") || itemLevel === "HSK4")) ||
          (selectedHskLevel === "HSK5" && (itemLevel.includes("5") || itemLevel === "HSK5")) ||
          (selectedHskLevel === "HSK6" && (itemLevel.includes("6") || itemLevel === "HSK6"))
        );
      });
      return items.map((r) => {
        const vocabList = toEntries(r.vocabulary);
        return {
          id: r.id,
          title: r.title,
          detail: `(${r.phase || r.level || selectedHskLevel} • ${vocabList.length} từ)`,
          words: vocabList,
        };
      });
    } else {
      const lessons = loaderData.lessons.filter((l) => {
        return (l.level || "").toUpperCase() === selectedHskLevel.toUpperCase();
      });
      return lessons.map((l) => ({
        id: l.id,
        title: l.title,
        detail: `(${l.source} • ${l._count?.vocabularies || 0} từ)`,
        words: [],
      }));
    }
  }, [vocabTargetType, selectedHskLevel, loaderData.roadmapItems, loaderData.lessons]);

  // Auto-select first lesson when level or destination target changes
  useEffect(() => {
    if (currentLevelItems.length > 0) {
      const exists = currentLevelItems.some((i) => i.id === selectedItemId);
      if (!exists) {
        setSelectedItemId(currentLevelItems[0].id);
      }
    } else {
      setSelectedItemId("");
    }
  }, [currentLevelItems, selectedItemId]);

  const selectedItem = currentLevelItems.find((i) => i.id === selectedItemId);
  const selectedItemWords = selectedItem?.words || [];
  const selectedItemTitle = selectedItem?.title || "Chưa chọn bài";

  const hsk20Count = loaderData.lessons.filter((l) => l.source === "HSK20").length;
  const hsk30Count = loaderData.lessons.filter((l) => l.source === "HSK30").length;

  return (
    <SiteLayout user={loaderData.user}>
      <div className="min-h-screen bg-[#FDFBF7] py-8 text-slate-900 font-sans pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* ========================================================================= */}
          {/* 1. HERO ADMIN DASHBOARD BANNER                                            */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 text-slate-900 shadow-sm">
            {/* Background Decorative Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-700">
                    <ShieldCheck size={14} className="text-red-600" />
                    <span>Trung Tâm Quản Trị Hệ Thống</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <Activity size={12} className="animate-pulse text-emerald-600" />
                    <span>Máy chủ trực tuyến</span>
                  </span>
                </div>
                <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Bảng Điều Khiển HSK Master Pro
                </h1>
                <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Xin chào <strong className="text-slate-800">{loaderData.user.name}</strong>. Quản lý phân quyền học viên, giám sát kho từ vựng, cập nhật ngân hàng đề thi và quản trị lộ trình đại lục.
                </p>
              </div>

              {/* Quick Actions in Hero */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => revalidator.revalidate()}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <RefreshCw size={14} className="text-slate-500" />
                  <span>Đồng Bộ Dữ Liệu</span>
                </button>
                <Link
                  to="/roadmap"
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-red-600/25 transition active:scale-95 cursor-pointer"
                >
                  <Compass size={14} />
                  <span>Xem Lộ Trình</span>
                </Link>
              </div>
            </div>

            {/* Top 5 KPI Metrics Strip */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 pt-6 border-t border-slate-100">
              <StatMetricCard
                icon={Users}
                label="Tổng Tài Khoản"
                value={loaderData.userCount}
                sub={`${loaderData.studentCount} Học viên VIP`}
                color="text-sky-600"
                bgColor="bg-sky-50 border border-sky-100"
              />
              <StatMetricCard
                icon={GraduationCap}
                label="Học Viên VIP"
                value={loaderData.studentCount}
                sub="Được học Lộ trình"
                color="text-amber-600"
                bgColor="bg-amber-50 border border-amber-100"
              />
              <StatMetricCard
                icon={BookOpen}
                label="Bài Học HSK"
                value={loaderData.lessonCount}
                sub={`${hsk20Count} HSK2.0 · ${hsk30Count} HSK3.0`}
                color="text-red-600"
                bgColor="bg-red-50 border border-red-100"
              />
              <StatMetricCard
                icon={Sparkles}
                label="Kho Từ Vựng"
                value={loaderData.vocabCount}
                sub="Có Pinyin & Âm thanh"
                color="text-emerald-600"
                bgColor="bg-emerald-50 border border-emerald-100"
              />
              <StatMetricCard
                icon={GitBranch}
                label="Ải Lộ Trình"
                value={loaderData.roadmapCount}
                sub="4 Chặng Đại Lục"
                color="text-purple-600"
                bgColor="bg-purple-50 border border-purple-100"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. ADMIN TABS NAVIGATION                                                  */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            <AdminTabButton
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              icon={Users}
              label="Quản Lý Học Viên & Quyền Hạn"
              badge={loaderData.userCount}
            />
            <AdminTabButton
              active={activeTab === "lessons"}
              onClick={() => setActiveTab("lessons")}
              icon={BookOpen}
              label="Kho Bài Học HSK"
              badge={loaderData.lessonCount}
            />
            <AdminTabButton
              active={activeTab === "roadmap"}
              onClick={() => setActiveTab("roadmap")}
              icon={GitBranch}
              label="Lộ Trình Độc Quyền"
              badge={loaderData.roadmapCount}
            />
            <AdminTabButton
              active={activeTab === "import"}
              onClick={() => setActiveTab("import")}
              icon={Upload}
              label="Nhập Dữ Liệu JSON"
            />
            <AdminTabButton
              active={activeTab === "add-vocab"}
              onClick={() => setActiveTab("add-vocab")}
              icon={Plus}
              label="Thêm Từ Vào Lộ Trình"
              badge="Mới"
            />
          </div>

          {/* ========================================================================= */}
          {/* 3. TAB CONTENT: USERS & PERMISSIONS MANAGEMENT                            */}
          {/* ========================================================================= */}
          {activeTab === "users" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
              {/* Header & Search / Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="text-red-600" size={22} />
                    <span>Danh Sách Người Dùng & Phân Quyền Học Viên</span>
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                    Chỉ định học viên chính thức tại trung tâm để cấp quyền mở khóa tab <strong>Lộ Trình</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search bar */}
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm tên hoặc email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  {/* Role filter */}
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-red-500 focus:bg-white cursor-pointer"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="STUDENT">🎓 Học Viên VIP ({loaderData.studentCount})</option>
                    <option value="USER">👤 Thành Viên Thường</option>
                    <option value="ADMIN">🛡️ Quản Trị Viên</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5 rounded-l-2xl">Học Viên / Người Dùng</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Vai Trò Hiện Tại</th>
                      <th className="px-5 py-3.5 text-right rounded-r-2xl">Cập Nhật Phân Quyền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isStudent = u.role === "STUDENT";
                      const isAdmin = u.role === "ADMIN";

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-sm shadow-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{u.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  Tham gia: {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-600 text-xs">
                            {u.email}
                          </td>

                          <td className="px-5 py-4">
                            {isStudent && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                                <GraduationCap size={14} className="text-amber-600" />
                                <span>Học Viên VIP</span>
                              </span>
                            )}
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-1 text-xs font-black text-red-800">
                                <ShieldCheck size={14} className="text-red-600" />
                                <span>Quản Trị Viên</span>
                              </span>
                            )}
                            {!isStudent && !isAdmin && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                <span>Thành Viên Thường</span>
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Student Role Form */}
                              {!isAdmin && (
                                <roleUpdateFetcher.Form method="post">
                                  <input type="hidden" name="intent" value="user-role-update" />
                                  <input type="hidden" name="userId" value={u.id} />
                                  <input
                                    type="hidden"
                                    name="newRole"
                                    value={isStudent ? "USER" : "STUDENT"}
                                  />
                                  <button
                                    type="submit"
                                    disabled={roleUpdateFetcher.state !== "idle"}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer ${
                                      isStudent
                                        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20"
                                    }`}
                                  >
                                    <GraduationCap size={14} />
                                    <span>
                                      {isStudent ? "Hạ về Thành Viên" : "Kích Hoạt Học Viên VIP"}
                                    </span>
                                  </button>
                                </roleUpdateFetcher.Form>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    Không tìm thấy người dùng phù hợp với bộ lọc.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. TAB CONTENT: HSK LESSONS INVENTORY                                     */}
          {/* ========================================================================= */}
          {activeTab === "lessons" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="text-red-600" size={22} />
                    <span>Kho Dữ Liệu Bài Học HSK ({filteredLessons.length} bài)</span>
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                    Toàn bộ bài học dùng chung cho Bản Đồ HSK, Game Luyện Tập và AI Assistant.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-56">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm bài học..."
                      value={lessonSearch}
                      onChange={(e) => setLessonSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={lessonLevelFilter}
                    onChange={(e) => setLessonLevelFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-red-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">Tất cả cấp độ</option>
                    {lessonLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>

                  <select
                    value={lessonSourceFilter}
                    onChange={(e) => setLessonSourceFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-red-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">Tất cả nguồn</option>
                    <option value="HSK20">HSK 2.0</option>
                    <option value="HSK30">HSK 3.0</option>
                  </select>

                  <DeleteAllLessonsButton disabled={!loaderData.lessons.length} />
                </div>
              </div>

              {/* Lessons Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5 rounded-l-2xl">Thứ Tự & Tên Bài Học</th>
                      <th className="px-5 py-3.5">Cấp Độ</th>
                      <th className="px-5 py-3.5">Nguồn</th>
                      <th className="px-5 py-3.5 text-center">Số Từ Vựng</th>
                      <th className="px-5 py-3.5 text-center">Số Quiz</th>
                      <th className="px-5 py-3.5 text-right rounded-r-2xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{lesson.title}</p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Thứ tự {lesson.orderNo} · {lesson.status}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-xl bg-red-50 border border-red-200/80 px-2.5 py-1 text-xs font-black text-red-700">
                            {lesson.level}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {lesson.source}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center font-bold text-slate-700">
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200/80">
                            {lesson._count.vocabularies} từ
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center font-bold text-slate-700">
                          <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700 border border-sky-200/80">
                            {lesson._count.quizzes} câu
                          </span>
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

                {filteredLessons.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    Không tìm thấy bài học phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. TAB CONTENT: ROADMAP ITEMS MANAGEMENT                                  */}
          {/* ========================================================================= */}
          {activeTab === "roadmap" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <GitBranch className="text-amber-600" size={22} />
                    <span>Lộ Trình Độc Quyền Trung Tâm ({filteredRoadmapItems.length} Ải)</span>
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                    Danh sách các buổi học trên bản đồ đại lục dành riêng cho học viên VIP.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-56">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm ải lộ trình..."
                      value={roadmapSearch}
                      onChange={(e) => setRoadmapSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={roadmapPhaseFilter}
                    onChange={(e) => setRoadmapPhaseFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">Tất cả chặng đại lục</option>
                    {roadmapPhases.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roadmap List Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5 rounded-l-2xl">Thứ Tự & Tên Ải Lộ Trình</th>
                      <th className="px-5 py-3.5">Chặng Đại Lục</th>
                      <th className="px-5 py-3.5">Thời Lượng / Tuần</th>
                      <th className="px-5 py-3.5 text-center">Từ Vựng Trọng Tâm</th>
                      <th className="px-5 py-3.5 text-center">Câu Giao Tiếp</th>
                      <th className="px-5 py-3.5 text-right rounded-r-2xl">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoadmapItems.map((item) => {
                      const vocabCount = countJsonArray(item.vocabulary);
                      const phraseCount = countJsonArray(item.phrases);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-black text-xs text-white">
                                {item.orderNo}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900">{item.title}</p>
                                {item.description && (
                                  <p className="mt-0.5 max-w-sm truncate text-xs text-slate-500 font-medium">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-xl bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-black text-amber-800">
                              {item.phase}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                            {item.duration || item.weekLabel || "Theo tiến độ"}
                          </td>

                          <td className="px-5 py-4 text-center font-bold text-slate-700">
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200/80">
                              {vocabCount} từ
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center font-bold text-slate-700">
                            <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700 border border-sky-200/80">
                              {phraseCount} câu
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <RoadmapDeleteButton roadmapItemId={item.id} title={item.title} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredRoadmapItems.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    Không tìm thấy ải lộ trình phù hợp với bộ lọc.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. TAB CONTENT: JSON DATA IMPORTER TOOLS                                  */}
          {/* ========================================================================= */}
          {activeTab === "import" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Import HSK Lessons Box */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                    <FileJson size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Import Bài Học HSK</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Nạp danh sách bài học và từ vựng từ file JSON
                    </p>
                  </div>
                </div>

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
                    idleTitle="Chọn file JSON bài học HSK"
                    idleHint="Hỗ trợ cấu trúc lessons[], vocabulary[]"
                    onClear={() => {
                      setLessonFile(null);
                      setLessonInputKey((k) => k + 1);
                    }}
                  >
                    <input
                      type="file"
                      name="jsonFile"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) =>
                        setLessonFile(toFileSelection(e.currentTarget.files?.[0]))
                      }
                    />
                  </FilePickerField>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                      Nguồn Tiêu Chuẩn
                    </label>
                    <select
                      name="source"
                      defaultValue="HSK20"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 outline-none transition focus:border-red-500 focus:bg-white cursor-pointer"
                    >
                      <option value="HSK20">HSK 2.0 (Cũ - 6 Cấp độ)</option>
                      <option value="HSK30">HSK 3.0 (Mới - 9 Cấp độ)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={lessonImportFetcher.state !== "idle" || !lessonFile}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-3.5 text-xs font-black text-white shadow-md shadow-red-600/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>
                      {lessonImportFetcher.state !== "idle"
                        ? "Đang Nạp Dữ Liệu..."
                        : "Bắt Đầu Import Bài Học"}
                    </span>
                  </button>
                </lessonImportFetcher.Form>
              </div>

              {/* Import Roadmap JSON Box */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                    <GitBranch size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Import Lộ Trình Lớp Học</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Nạp các buổi học, mẫu câu và mục tiêu chặng lộ trình
                    </p>
                  </div>
                </div>

                <roadmapImportFetcher.Form
                  method="post"
                  encType="multipart/form-data"
                  className="space-y-4"
                >
                  <input type="hidden" name="intent" value="roadmap-import" />

                  <FilePickerField
                    key={roadmapInputKey}
                    file={roadmapFile}
                    idleTitle="Chọn file JSON lộ trình lớp"
                    idleHint="Hỗ trợ roadmap[], phase, vocabulary[], phrases[]"
                    onClear={() => {
                      setRoadmapFile(null);
                      setRoadmapInputKey((k) => k + 1);
                    }}
                  >
                    <input
                      type="file"
                      name="roadmapFile"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) =>
                        setRoadmapFile(toFileSelection(e.currentTarget.files?.[0]))
                      }
                    />
                  </FilePickerField>

                  <div className="h-[52px]" />

                  <button
                    type="submit"
                    disabled={roadmapImportFetcher.state !== "idle" || !roadmapFile}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 py-3.5 text-xs font-black text-white shadow-md shadow-amber-600/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>
                      {roadmapImportFetcher.state !== "idle"
                        ? "Đang Xử Lý Lộ Trình..."
                        : "Bắt Đầu Import Lộ Trình"}
                    </span>
                  </button>
                </roadmapImportFetcher.Form>

                {roadmapImportFetcher.state !== "idle" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-center text-xs font-bold text-amber-800 animate-pulse">
                    {roadmapProgress}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. TAB CONTENT: ADD VOCABULARY TO ROADMAP & LESSONS                       */}
          {/* ========================================================================= */}
          {activeTab === "add-vocab" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
                {/* Header & Mode Switch */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 mb-2">
                      <Sparkles size={14} className="text-amber-600" />
                      <span>Biên Soạn Nội Dung Trực Tiếp</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                      <Plus className="text-red-600" size={24} />
                      <span>Thêm Từ Vựng Vào Lộ Trình & Bài Học</span>
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
                      Chọn cấp độ HSK để hệ thống tự động tải toàn bộ bài học tương ứng, sau đó nhập Hán tự, Pinyin và Nghĩa để cập nhật vào lộ trình ngay lập tức.
                    </p>
                  </div>

                  {/* Single vs Bulk Mode Toggle */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-fit">
                    <button
                      type="button"
                      onClick={() => setInputMode("single")}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        inputMode === "single"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Nhập Từng Từ
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("bulk")}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        inputMode === "bulk"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Nhập Nhanh Nhiều Từ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                  {/* Left Column: Form Controls (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* 1. Target Destination Type */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                        1. Mục Tiêu Thêm Vào:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setVocabTargetType("roadmap")}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                            vocabTargetType === "roadmap"
                              ? "border-red-600 bg-red-50/70 ring-2 ring-red-600/20 text-slate-900"
                              : "border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              vocabTargetType === "roadmap"
                                ? "bg-red-600 text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-500"
                            }`}
                          >
                            <GitBranch size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-bold">Lộ Trình Độc Quyền</div>
                            <div className="text-[11px] text-slate-500">
                              {loaderData.roadmapCount} buổi học ải
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVocabTargetType("lesson")}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                            vocabTargetType === "lesson"
                              ? "border-red-600 bg-red-50/70 ring-2 ring-red-600/20 text-slate-900"
                              : "border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              vocabTargetType === "lesson"
                                ? "bg-red-600 text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-500"
                            }`}
                          >
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-bold">Kho Bài Học HSK</div>
                            <div className="text-[11px] text-slate-500">
                              {loaderData.lessonCount} bài học tiêu chuẩn
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. HSK Level Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          2. Cấp Độ HSK:
                        </label>
                        <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200/60">
                          {currentLevelItems.length} bài học tìm thấy
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6", "HSK7-9"].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSelectedHskLevel(lvl)}
                            className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              selectedHskLevel === lvl
                                ? "bg-red-600 text-white border-red-600 shadow-sm scale-102"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Bài Selector (Tự động tải toàn bộ bài của cấp độ HSK đã chọn) */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                        3. Chọn Bài Học / Buổi Học Của Cấp Độ ({selectedHskLevel}):
                      </label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-xs cursor-pointer"
                      >
                        {currentLevelItems.length === 0 ? (
                          <option value="">Không có bài học nào thuộc cấp độ {selectedHskLevel}</option>
                        ) : (
                          currentLevelItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title} {item.detail}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* 4. Form Inputs */}
                    {inputMode === "single" ? (
                      <addVocabFetcher.Form method="post" className="space-y-4 pt-2">
                        <input
                          type="hidden"
                          name="intent"
                          value={vocabTargetType === "roadmap" ? "roadmap-vocab-add" : "lesson-vocab-add"}
                        />
                        <input
                          type="hidden"
                          name={vocabTargetType === "roadmap" ? "roadmapItemId" : "lessonId"}
                          value={selectedItemId}
                        />
                        <input type="hidden" name="level" value={selectedHskLevel} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Hán Tự */}
                          <div className="sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                              <span className="text-red-600 font-bold">*</span> Hán Tự (Chữ Hán):
                            </label>
                            <input
                              type="text"
                              name="chinese"
                              required
                              placeholder="Ví dụ: 苹果, 坚持, 老师..."
                              value={inputChinese}
                              onChange={(e) => setInputChinese(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-hanzi font-black text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:bg-white"
                            />
                          </div>

                          {/* Pinyin */}
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                              <span className="text-red-600 font-bold">*</span> Pinyin (Phiên âm):
                            </label>
                            <input
                              type="text"
                              name="pinyin"
                              required
                              placeholder="Ví dụ: píngguǒ, jiānchí, lǎoshī..."
                              value={inputPinyin}
                              onChange={(e) => setInputPinyin(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:bg-white"
                            />
                          </div>

                          {/* Nghĩa Tiếng Việt */}
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                              <span className="text-red-600 font-bold">*</span> Nghĩa Tiếng Việt:
                            </label>
                            <input
                              type="text"
                              name="meaningVi"
                              required
                              placeholder="Ví dụ: quả táo, kiên trì, thầy cô giáo..."
                              value={inputMeaningVi}
                              onChange={(e) => setInputMeaningVi(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Optional Example Fields */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Ví dụ mẫu & Dịch nghĩa (Tùy chọn)
                          </span>
                          <div className="grid grid-cols-1 gap-3">
                            <input
                              type="text"
                              name="exampleChinese"
                              placeholder="Câu ví dụ Hán tự (VD: 每天坚持学习一点点。)"
                              value={inputExampleChinese}
                              onChange={(e) => setInputExampleChinese(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-hanzi text-slate-800 placeholder-slate-400 outline-none focus:border-red-500"
                            />
                            <input
                              type="text"
                              name="examplePinyin"
                              placeholder="Pinyin câu ví dụ (VD: Měitiān jiānchí xuéxí yì diǎndiǎn.)"
                              value={inputExamplePinyin}
                              onChange={(e) => setInputExamplePinyin(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:border-red-500"
                            />
                            <input
                              type="text"
                              name="exampleMeaning"
                              placeholder="Dịch nghĩa câu ví dụ (VD: Mỗi ngày kiên trì học một chút.)"
                              value={inputExampleMeaning}
                              onChange={(e) => setInputExampleMeaning(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-500"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={
                            addVocabFetcher.state !== "idle" ||
                            !selectedItemId ||
                            !inputChinese.trim() ||
                            !inputMeaningVi.trim()
                          }
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 px-6 text-sm font-black text-white shadow-md shadow-red-900/20 hover:bg-red-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addVocabFetcher.state !== "idle" ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              <span>Đang Lưu Từ Vựng...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={18} />
                              <span>LƯU TỪ VỰNG VÀO BÀI HỌC</span>
                            </>
                          )}
                        </button>
                      </addVocabFetcher.Form>
                    ) : (
                      /* Bulk Mode Form */
                      <addVocabFetcher.Form method="post" className="space-y-4 pt-2">
                        <input
                          type="hidden"
                          name="intent"
                          value={vocabTargetType === "roadmap" ? "roadmap-vocab-add" : "lesson-vocab-add"}
                        />
                        <input
                          type="hidden"
                          name={vocabTargetType === "roadmap" ? "roadmapItemId" : "lessonId"}
                          value={selectedItemId}
                        />
                        <input type="hidden" name="level" value={selectedHskLevel} />

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            Dán danh sách từ (Mỗi dòng 1 từ:{" "}
                            <code className="text-red-700 font-mono bg-red-50 px-1.5 py-0.5 rounded">
                              Hán tự | Pinyin | Nghĩa
                            </code>{" "}
                            hoặc dấu phẩy{" "}
                            <code className="text-red-700 font-mono bg-red-50 px-1.5 py-0.5 rounded">
                              Hán tự, Pinyin, Nghĩa
                            </code>
                            ):
                          </label>
                          <textarea
                            name="bulkText"
                            required
                            rows={8}
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder={`你好 | nǐhǎo | Xin chào\n再见 | zàijiàn | Tạm biệt\n谢谢 | xièxiè | Cảm ơn\n苹果 | píngguǒ | Quả táo`}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:bg-white leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={addVocabFetcher.state !== "idle" || !selectedItemId || !bulkText.trim()}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 px-6 text-sm font-black text-white shadow-md shadow-red-900/20 hover:bg-red-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addVocabFetcher.state !== "idle" ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              <span>Đang Thêm Hàng Loạt...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={18} />
                              <span>THÊM TOÀN BỘ DANH SÁCH VÀO BÀI</span>
                            </>
                          )}
                        </button>
                      </addVocabFetcher.Form>
                    )}
                  </div>

                  {/* Right Column: Live Card Preview & Existing Words List (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Card Live Preview */}
                    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Xem Trước Thẻ Từ Vựng</span>
                      </span>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center space-y-2">
                        <div className="text-3xl font-hanzi font-black text-red-700 tracking-tight">
                          {inputChinese || "汉字"}
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-500">
                          {inputPinyin || "hànzì"}
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          {inputMeaningVi || "Ý nghĩa tiếng Việt"}
                        </div>
                        {inputExampleChinese && (
                          <div className="mt-3 pt-2 border-t border-slate-100 text-left text-xs text-slate-600">
                            <div className="font-hanzi font-medium text-slate-900">{inputExampleChinese}</div>
                            {inputExamplePinyin && (
                              <div className="font-mono text-[11px] text-slate-500">{inputExamplePinyin}</div>
                            )}
                            {inputExampleMeaning && (
                              <div className="text-[11px] text-slate-600 italic">{inputExampleMeaning}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Existing Words in Selected Bài */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <BookOpen size={14} className="text-red-600" />
                          <span>Từ Vựng Trong Bài ({selectedItemWords.length})</span>
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 max-w-[160px] truncate">
                          {selectedItemTitle}
                        </span>
                      </div>

                      {selectedItemWords.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                          Chưa có từ vựng nào trong bài này. Hãy thêm từ đầu tiên!
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                          {selectedItemWords.map((w, idx) => (
                            <div key={idx} className="flex items-center justify-between pt-1.5 text-xs">
                              <div>
                                <span className="font-hanzi font-black text-slate-900 mr-2 text-sm">
                                  {w.chinese}
                                </span>
                                <span className="font-mono text-[11px] text-emerald-700 mr-2 font-bold">
                                  {w.pinyin}
                                </span>
                                <span className="text-slate-600 text-[11px]">{w.meaningVi}</span>
                              </div>
                              {vocabTargetType === "roadmap" && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingVocab({
                                        index: idx,
                                        roadmapItemId: selectedItemId,
                                        chinese: w.chinese,
                                        pinyin: w.pinyin,
                                        meaningVi: w.meaningVi,
                                        exampleChinese: w.exampleChinese,
                                        examplePinyin: w.examplePinyin,
                                        exampleMeaning: w.exampleMeaning,
                                      })
                                    }
                                    title="Chỉnh sửa từ này"
                                    className="p-1 text-slate-300 hover:text-amber-600 transition cursor-pointer"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <addVocabFetcher.Form method="post" className="inline">
                                    <input type="hidden" name="intent" value="roadmap-vocab-delete" />
                                    <input type="hidden" name="roadmapItemId" value={selectedItemId} />
                                    <input type="hidden" name="wordIndex" value={idx} />
                                    <button
                                      type="submit"
                                      title="Xóa từ này"
                                      className="p-1 text-slate-300 hover:text-red-600 transition cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </addVocabFetcher.Form>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Vocab Modal */}
              {editingVocab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                          <Pencil size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">
                            Chỉnh Sửa Từ Vựng
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Cập nhật Hán tự, Pinyin và dịch nghĩa trong lộ trình
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingVocab(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <addVocabFetcher.Form method="post" className="space-y-4">
                      <input type="hidden" name="intent" value="roadmap-vocab-edit" />
                      <input type="hidden" name="roadmapItemId" value={editingVocab.roadmapItemId} />
                      <input type="hidden" name="wordIndex" value={editingVocab.index} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            <span className="text-red-600 font-bold">*</span> Hán Tự (Chữ Hán):
                          </label>
                          <input
                            type="text"
                            name="chinese"
                            required
                            value={editingVocab.chinese}
                            onChange={(e) => setEditingVocab({ ...editingVocab, chinese: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-hanzi font-black text-slate-900 outline-none focus:border-red-500 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            <span className="text-red-600 font-bold">*</span> Pinyin (Phiên âm):
                          </label>
                          <input
                            type="text"
                            name="pinyin"
                            required
                            value={editingVocab.pinyin}
                            onChange={(e) => setEditingVocab({ ...editingVocab, pinyin: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            <span className="text-red-600 font-bold">*</span> Nghĩa Tiếng Việt:
                          </label>
                          <input
                            type="text"
                            name="meaningVi"
                            required
                            value={editingVocab.meaningVi}
                            onChange={(e) => setEditingVocab({ ...editingVocab, meaningVi: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-red-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Optional Example Fields */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Ví dụ mẫu & Dịch nghĩa (Tùy chọn)
                        </span>
                        <input
                          type="text"
                          name="exampleChinese"
                          placeholder="Câu ví dụ Hán tự"
                          value={editingVocab.exampleChinese || ""}
                          onChange={(e) => setEditingVocab({ ...editingVocab, exampleChinese: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-hanzi text-slate-800 outline-none focus:border-red-500"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            name="examplePinyin"
                            placeholder="Pinyin câu ví dụ"
                            value={editingVocab.examplePinyin || ""}
                            onChange={(e) => setEditingVocab({ ...editingVocab, examplePinyin: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-red-500"
                          />
                          <input
                            type="text"
                            name="exampleMeaning"
                            placeholder="Dịch nghĩa câu ví dụ"
                            value={editingVocab.exampleMeaning || ""}
                            onChange={(e) => setEditingVocab({ ...editingVocab, exampleMeaning: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingVocab(null)}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={addVocabFetcher.state !== "idle" || !editingVocab.chinese || !editingVocab.pinyin || !editingVocab.meaningVi}
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-red-500/20 hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                        >
                          {addVocabFetcher.state !== "idle" ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Đang Lưu...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Lưu Thay Đổi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </addVocabFetcher.Form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}

// =============================================================================
// 3. SUB-COMPONENTS & HELPERS
// =============================================================================

function StatMetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bgColor,
}: {
  icon: any;
  label: string;
  value: number;
  sub: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all duration-200 hover:bg-white hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs ${bgColor} ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 truncate">
          {label}
        </span>
      </div>
      <p className="mt-2.5 text-2xl sm:text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500 truncate">{sub}</p>
    </div>
  );
}

function AdminTabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  badge?: number | string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
        active
          ? "bg-slate-900 text-white shadow-md"
          : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
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
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
        onClick={(e) => {
          if (!window.confirm(`Xác nhận xóa bài học "${lessonTitle}"?`)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={13} />
        <span>{fetcher.state === "idle" ? "Xóa" : "Đang xóa..."}</span>
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
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
        onClick={(e) => {
          if (!window.confirm(`Xác nhận xóa ải lộ trình "${title}"?`)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={13} />
        <span>{fetcher.state === "idle" ? "Xóa" : "Đang xóa..."}</span>
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
        className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-black text-red-700 hover:bg-red-100 transition active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        onClick={(e) => {
          if (!window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ bài học HSK?")) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={14} />
        <span>{fetcher.state === "idle" ? "Xóa Tất Cả" : "Đang xóa..."}</span>
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
    successKey: "success" | "deleteSuccess" | "roadmapSuccess" | "roadmapDeleteSuccess" | "userSuccess" | "addVocabSuccess";
    errorKey: "error" | "deleteError" | "roadmapError" | "roadmapDeleteError" | "userError" | "addVocabError";
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

function toEntries(value: unknown): Array<{
  chinese: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string;
  exampleChinese?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
}> {
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
      meaningEn: item.meaningEn ? String(item.meaningEn) : undefined,
      exampleChinese: item.exampleChinese ? String(item.exampleChinese) : undefined,
      examplePinyin: item.examplePinyin ? String(item.examplePinyin) : undefined,
      exampleMeaning: item.exampleMeaning ? String(item.exampleMeaning) : undefined,
    }))
    .filter((item) => item.chinese && item.meaningVi);
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
      className={`group flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 transition ${
        file
          ? "border-emerald-300 bg-emerald-50/70"
          : "border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/30"
      } ${className}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          file ? "bg-emerald-100 text-emerald-600" : "bg-white text-red-600 shadow-xs"
        }`}
      >
        <Upload size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-black text-slate-900">
          {file ? file.name : idleTitle}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
          {file ? `Đã chọn • ${file.sizeLabel}` : idleHint}
        </p>
      </div>

      {file ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-xs transition hover:text-red-600"
          aria-label="Bỏ chọn file"
        >
          <X size={15} />
        </button>
      ) : (
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-2xs">
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
      optionalString(item.phase || item.stage || item.module) || "HSK1",
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
