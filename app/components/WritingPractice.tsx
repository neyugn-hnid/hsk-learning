import { useEffect, useState } from "react";
import { Check, PencilLine, RotateCcw } from "lucide-react";

type WritingPracticeProps = {
  chinese: string;
  meaningVi?: string;
};

type WritingResult = {
  score: number;
  normalizedAnswer: string;
  normalizedExpected: string;
};

export function WritingPractice({ chinese, meaningVi }: WritingPracticeProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<WritingResult | null>(null);

  useEffect(() => {
    setAnswer("");
    setResult(null);
  }, [chinese]);

  const checkAnswer = () => {
    setResult(scoreWriting(answer, chinese));
  };

  const resetAnswer = () => {
    setAnswer("");
    setResult(null);
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-3 text-left sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Luyện viết</h4>
          <p className="mt-1 text-sm text-slate-500">
            {meaningVi ? `Dựa vào nghĩa "${meaningVi}" rồi viết lại chữ Hán.` : "Viết lại đúng chữ Hán của card này."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor={`writing-${chinese}`}>
          Câu trả lời của bạn
        </label>
        <input
          id={`writing-${chinese}`}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Nhập chữ Hán tại đây..."
          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-red-400"
        />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={checkAnswer}
            aria-label="Chấm bài viết"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 sm:w-auto"
          >
            <Check size={18} />
            <span className="sr-only sm:not-sr-only sm:inline">Chấm điểm</span>
          </button>
          <button
            type="button"
            onClick={resetAnswer}
            aria-label="Xóa bài viết"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            <RotateCcw size={18} />
            <span className="sr-only sm:not-sr-only sm:inline">Làm lại</span>
          </button>
        </div>

        {result ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Kết quả viết</p>
                <p className="mt-1 break-words text-sm text-slate-500">Bạn viết: {answer || "Trống"}</p>
              </div>
              <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${result.score >= 100 ? "bg-emerald-100 text-emerald-700" : result.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                {result.score}/100
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-slate-700">{toWritingFeedback(result.score)}</p>
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Đáp án chuẩn: <span className="font-bold text-slate-900">{chinese}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function scoreWriting(answer: string, expected: string): WritingResult {
  const normalizedAnswer = normalizeChinese(answer);
  const normalizedExpected = normalizeChinese(expected);

  if (!normalizedExpected) {
    return { score: 0, normalizedAnswer, normalizedExpected };
  }

  const distance = levenshteinDistance(normalizedAnswer, normalizedExpected);
  const maxLength = Math.max(normalizedAnswer.length, normalizedExpected.length, 1);
  const score = Math.max(0, Math.min(100, Math.round(((maxLength - distance) / maxLength) * 100)));

  return { score, normalizedAnswer, normalizedExpected };
}

function normalizeChinese(value: string) {
  return value.replace(/[\s.,!?;:'"`~@#$%^&*()\-_=+\[\]{}|\\/，。！？；：、】【]/g, "").trim();
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () => Array<number>(a.length + 1).fill(0));

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

function toWritingFeedback(score: number) {
  if (score >= 100) return "Chính xác. Bạn viết đúng hoàn toàn.";
  if (score >= 80) return "Khá tốt. Bạn chỉ lệch rất ít so với đáp án chuẩn.";
  if (score >= 60) return "Có phần đúng, nhưng vẫn còn sai hoặc thiếu ký tự.";
  return "Độ khớp còn thấp. Bạn nên nhìn lại card và viết lại.";
}
