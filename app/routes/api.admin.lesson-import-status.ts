import type { Route } from "./+types/api.admin.lesson-import-status";
import { data } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getLessonImportJob } from "~/lib/lesson-import-job.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId") || "";

  if (!jobId) {
    return data({ error: "Thiếu jobId." }, { status: 400 });
  }

  const job = getLessonImportJob(jobId);
  if (!job) {
    return data({ error: "Không tìm thấy job import." }, { status: 404 });
  }

  return data({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result || null,
    error: job.error || null,
  });
}
