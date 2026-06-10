import {
  runLessonImportAI,
  type LessonImportProgress,
  type LessonImportResult,
} from "~/lib/lesson-import.server";

type LessonImportJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: LessonImportProgress;
  result?: LessonImportResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __lessonImportJobs: Map<string, LessonImportJob> | undefined;
}

const jobs = global.__lessonImportJobs || new Map<string, LessonImportJob>();
global.__lessonImportJobs = jobs;

export function startLessonImportJob(file: File | null, courseTitle: string) {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const initialProgress: LessonImportProgress = {
    stage: "uploading",
    message: "Đã tạo job import, chuẩn bị xử lý...",
    percent: 2,
  };

  jobs.set(id, {
    id,
    status: "running",
    progress: initialProgress,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  void runLessonImportAI(file, courseTitle, (progress) => {
    const current = jobs.get(id);
    if (!current) return;
    jobs.set(id, {
      ...current,
      progress,
      updatedAt: Date.now(),
    });
  })
    .then((result) => {
      const current = jobs.get(id);
      if (!current) return;
      jobs.set(id, {
        ...current,
        status: "completed",
        progress: {
          stage: "completed",
          message: result.message,
          percent: 100,
          lessonCount: result.lessonCount,
          quizCount: result.quizCount,
        },
        result,
        updatedAt: Date.now(),
      });
    })
    .catch((error: unknown) => {
      const current = jobs.get(id);
      if (!current) return;
      const message =
        error instanceof Error ? error.message : "Không thể import bài học bằng AI.";
      jobs.set(id, {
        ...current,
        status: "failed",
        error: message,
        updatedAt: Date.now(),
      });
    });

  cleanupOldJobs();
  return id;
}

export function getLessonImportJob(jobId: string) {
  return jobs.get(jobId) || null;
}

function cleanupOldJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.updatedAt > 1000 * 60 * 30) {
      jobs.delete(jobId);
    }
  }
}
