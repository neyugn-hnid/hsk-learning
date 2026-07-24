import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { useState } from "react";
import { useToast } from "~/components/Toast";
import { useAuth } from "~/components/AuthProvider";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ListChecks,
  Volume2,
  Sparkles,
  GraduationCap,
  Flame,
  Bot,
  Map,
  Shuffle,
  CheckCircle2,
  BookMarked,
  Award,
  Zap,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  // Fetch featured lessons
  const featuredLessons = await prisma.lesson.findMany({
    where: { status: "PUBLISHED" },
    take: 6,
    include: {
      _count: { select: { vocabularies: true } },
      vocabularies: { take: 1, select: { imageUrl: true } },
    },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
  });

  // Fetch sample vocabularies for interactive card
  const sampleVocabularies = await prisma.vocabulary.findMany({
    take: 12,
    select: {
      id: true,
      chinese: true,
      pinyin: true,
      meaningVi: true,
      exampleChinese: true,
      exampleMeaning: true,
      level: true,
      imageUrl: true,
    },
  });

  // Database stats
  const totalLessons = await prisma.lesson.count({
    where: { status: "PUBLISHED" },
  });
  const totalVocabularies = await prisma.vocabulary.count();
  const totalRoadmaps = await prisma.roadmapItem.count();

  return {
    user,
    featuredLessons,
    sampleVocabularies,
    stats: {
      totalLessons,
      totalVocabularies,
      totalRoadmaps,
    },
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, featuredLessons, sampleVocabularies, stats } = loaderData;
  const { openLogin, openRegister } = useAuth();
  const { pushToast } = useToast();
  const [vocabIndex, setVocabIndex] = useState(0);

  // Fallback vocabulary if database has no vocabularies yet
  const defaultVocabs = [
    {
      chinese: "你好",
      pinyin: "nǐ hǎo",
      meaningVi: "Xin chào",
      exampleChinese: "你好，我叫小明。",
      exampleMeaning: "Xin chào, tôi tên là Tiểu Minh.",
      level: "HSK 1",
    },
    {
      chinese: "学习",
      pinyin: "xué xí",
      meaningVi: "Học tập",
      exampleChinese: "我很喜欢学习汉语。",
      exampleMeaning: "Tôi rất thích học tiếng Trung.",
      level: "HSK 1",
    },
    {
      chinese: "朋友",
      pinyin: "péng you",
      meaningVi: "Bạn bè",
      exampleChinese: "我们是好朋友。",
      exampleMeaning: "Chúng tôi là bạn tốt.",
      level: "HSK 2",
    },
  ];

  const currentVocabList =
    sampleVocabularies.length > 0 ? sampleVocabularies : defaultVocabs;
  const currentVocab = currentVocabList[vocabIndex % currentVocabList.length];

  const handleNextVocab = () => {
    setVocabIndex((prev) => (prev + 1) % currentVocabList.length);
  };

  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <SiteLayout user={user}>
      <main className="bg-slate-50/60 pb-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white py-14 md:py-24 px-4">
          {/* Ambient Lighting Orbs */}
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-rose-600/25 blur-3xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Calligraphy Watermark */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-9xl font-black text-white/[0.03] select-none pointer-events-none tracking-widest hidden xl:block">
            中文学习
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Copy & Actions */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-rose-200 backdrop-blur border border-white/15 shadow-inner">
                  <Sparkles size={15} className="text-amber-400 animate-pulse" />
                  <span>Nền tảng học HSK & Lộ trình Tiếng Trung 2026</span>
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                  Học Tiếng Trung <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 bg-clip-text text-transparent">
                    Dễ Dàng & Hiệu Quả
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  Hệ thống bài học chuẩn hóa HSK 2.0 & 3.0 tích hợp lộ trình học bài bản, phiên âm Pinyin chuẩn, nghe phát âm và trắc nghiệm ghi nhớ thông minh.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  {user ? (
                    <Link
                      to="/lessons"
                      prefetch="intent"
                      className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-950/30 transition-all hover:scale-105 hover:from-rose-500 hover:to-red-500"
                    >
                      <BookOpen size={18} />
                      <span>Khám phá bài học</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { pushToast("Vui lòng đăng nhập để khám phá bài học.", "info"); openLogin(); }}
                      className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-950/30 transition-all hover:scale-105 hover:from-rose-500 hover:to-red-500"
                    >
                      <BookOpen size={18} />
                      <span>Khám phá bài học</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  )}

                  {user ? (
                    <Link
                      to="/roadmap"
                      prefetch="intent"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur border border-white/20 transition-all hover:bg-white/20 hover:border-white/30"
                    >
                      <Map size={18} className="text-amber-400" />
                      <span>Lộ trình học</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { pushToast("Vui lòng đăng nhập để xem lộ trình.", "info"); openLogin(); }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur border border-white/20 transition-all hover:bg-white/20 hover:border-white/30"
                    >
                      <Map size={18} className="text-amber-400" />
                      <span>Lộ trình học</span>
                    </button>
                  )}
                </div>

                {/* Live Stats Chips */}
                <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      <strong className="text-white text-sm font-black">{stats.totalLessons}</strong> Bài học HSK
                    </span>
                  </div>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <BookMarked size={16} className="text-amber-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{stats.totalVocabularies}</strong> Từ vựng mẫu
                    </span>
                  </div>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <CheckCircle2 size={16} className="text-rose-400" />
                    <span>Chuẩn HSK 2.0 & 3.0</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Word of the Day Flashcard */}
              <div className="lg:col-span-5">
                <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-6 shadow-2xl backdrop-blur transition-all duration-300 hover:border-rose-500/40">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                        Từ vựng học nhanh
                      </span>
                    </div>
                    {currentVocab.level ? (
                      <span className="rounded-xl bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                        {currentVocab.level}
                      </span>
                    ) : null}
                  </div>

                  {/* Main Word Presentation */}
                  <div className="my-6 text-center">
                    <h3 className="font-hanzi text-6xl font-black tracking-wide text-white drop-shadow-lg sm:text-7xl">
                      {currentVocab.chinese}
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-rose-300">
                      {currentVocab.pinyin}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-200">
                      {currentVocab.meaningVi}
                    </p>

                    {/* Speech Button */}
                    <button
                      type="button"
                      onClick={() => speakWord(currentVocab.chinese)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur border border-white/15 transition hover:bg-rose-600 hover:border-rose-500"
                    >
                      <Volume2 size={16} className="text-amber-300" />
                      <span>Phát âm Hán ngữ</span>
                    </button>
                  </div>

                  {/* Example Sentence Box */}
                  {currentVocab.exampleChinese ? (
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/10 text-left">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Ví dụ thực tế
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {currentVocab.exampleChinese}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {currentVocab.exampleMeaning}
                      </p>
                    </div>
                  ) : null}

                  {/* Card Switcher Controls */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs font-medium text-slate-400">
                      Từ {((vocabIndex % currentVocabList.length) + 1)} / {currentVocabList.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextVocab}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-rose-500"
                    >
                      <Shuffle size={14} /> Từ tiếp theo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HSK Level Showcase Cards */}
        <section className="mx-auto max-w-7xl px-4 -mt-8 relative z-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LevelCard
              level="HSK 1"
              title="Nhập môn căn bản"
              desc="Nắm vững 150-300 từ vựng ban đầu, mẫu câu giao tiếp cơ bản hằng ngày."
              bgImg="/images/thumbnail-hsk1.png"
              color="emerald"
              link="/lessons?source=HSK20&level=HSK1"
              user={user}
              onRequireAuth={() => { pushToast("Vui lòng đăng nhập để xem bài học.", "info"); openLogin(); }}
            />
            <LevelCard
              level="HSK 2"
              title="Sơ cấp ứng dụng"
              desc="Mở rộng 300-600 từ vựng, diễn đạt ý kiến và trao đổi thông tin cá nhân."
              bgImg="/images/thumbnail-hsk2.png"
              color="sky"
              link="/lessons?source=HSK20&level=HSK2"
              user={user}
              onRequireAuth={() => { pushToast("Vui lòng đăng nhập để xem bài học.", "info"); openLogin(); }}
            />
            <LevelCard
              level="HSK 3"
              title="Trung cấp giao tiếp"
              desc="Tích lũy 600-1000 từ vựng, tự tin hoàn thành các nhu cầu sinh hoạt & du lịch."
              bgImg="/images/thumbnail-hsk3.png"
              color="purple"
              link="/lessons?source=HSK20&level=HSK3"
              user={user}
              onRequireAuth={() => { pushToast("Vui lòng đăng nhập để xem bài học.", "info"); openLogin(); }}
            />
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="mx-auto max-w-7xl px-4 pt-16 md:pt-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 sm:text-4xl">
              Tính Năng Học Tập Toàn Diện
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Được thiết kế tối ưu cho trải nghiệm học từ vựng, luyện nghe phát âm và kiểm tra kiến thức bài bản.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureBox
              icon={BookOpen}
              title="Bài Học HSK Chuẩn"
              desc="Tổ chức từ vựng theo cấp độ HSK 2.0 & 3.0 giúp bạn học đúng mục tiêu."
              color="rose"
            />
            <FeatureBox
              icon={Volume2}
              title="Luyện Phát Âm Pinyin"
              desc="Hỗ trợ nghe âm chuẩn Hán ngữ với tốc độ tùy chỉnh sinh động."
              color="amber"
            />
            <FeatureBox
              icon={ListChecks}
              title="Trắc Nghiệm Quiz"
              desc="Củng cố kiến thức qua các bài quiz trắc nghiệm nhận diện mặt chữ & pinyin."
              color="emerald"
            />
            <FeatureBox
              icon={BarChart3}
              title="Lộ Trình Theo Lớp"
              desc="Bám sát tiến độ học tập thực tế theo từng tuần và chặng học cần đạt."
              color="sky"
            />
          </div>
        </section>

        {/* Featured Lessons Grid Section */}
        {featuredLessons.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 pt-16 md:pt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Flame className="text-rose-600" size={24} />
                  <span>Bài Học Nổi Bật</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Bắt đầu bài học mới nhất được cập nhật trên hệ thống
                </p>
              </div>

              <Link
                to="/lessons"
                prefetch="intent"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition"
              >
                Xem tất cả bài học <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredLessons.map((lesson) => (
                user ? (
                  <Link
                    key={lesson.id}
                    to={`/lessons/${lesson.id}`}
                    prefetch="intent"
                    className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          Bài {lesson.orderNo}
                        </span>
                        <span className="rounded-xl bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                          {lesson.level}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {lesson.title}
                      </h3>

                      {lesson.description ? (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-500 group-hover:text-rose-600">
                      <span className="flex items-center gap-1 text-slate-400">
                        <BookMarked size={14} className="text-amber-500" />
                        {lesson._count.vocabularies} từ vựng
                      </span>
                      <span className="flex items-center gap-1">
                        Học ngay <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ) : (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      pushToast("Vui lòng đăng nhập để xem bài học.", "info");
                      openLogin();
                    }}
                    className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl flex flex-col justify-between text-left w-full"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          Bài {lesson.orderNo}
                        </span>
                        <span className="rounded-xl bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                          {lesson.level}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {lesson.title}
                      </h3>

                      {lesson.description ? (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-500 group-hover:text-rose-600">
                      <span className="flex items-center gap-1 text-slate-400">
                        <BookMarked size={14} className="text-amber-500" />
                        {lesson._count.vocabularies} từ vựng
                      </span>
                      <span className="flex items-center gap-1">
                        Học ngay <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </button>
                )
              ))}
            </div>
          </section>
        ) : null}

        {/* CTA Callout Banner */}
        <section className="mx-auto max-w-7xl px-4 pt-16 md:pt-24">
          <div className="relative overflow-hidden rounded-3xl bg-amber-600 p-8 md:p-14 text-white shadow-2xl">
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur">
                <Zap size={14} className="text-amber-300" /> Khởi đầu ngay hôm nay
              </span>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                Sẵn Sàng Bắt Đầu Hành Trình Học Tiếng Trung?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-rose-100 leading-relaxed">
                Tạo tài khoản để theo dõi tiến độ học tập, lưu lại các từ vựng đã thuộc và chinh phục các cấp độ HSK.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    to="/lessons"
                    prefetch="intent"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-rose-700 shadow-lg transition hover:bg-rose-50"
                  >
                    <GraduationCap size={18} />
                    <span>Vào học ngay</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openRegister}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-rose-700 shadow-lg transition hover:bg-rose-50"
                  >
                    <GraduationCap size={18} />
                    <span>Tạo tài khoản miễn phí</span>
                  </button>
                )}
                {!user ? (
                  <button
                    type="button"
                    onClick={openLogin}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-900/40 px-6 py-3.5 text-sm font-bold text-white backdrop-blur border border-white/20 hover:bg-rose-900/60"
                  >
                    Đăng nhập
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

function LevelCard({
  level,
  title,
  desc,
  bgImg,
  color,
  link,
  user,
  onRequireAuth,
}: {
  level: string;
  title: string;
  desc: string;
  bgImg: string;
  color: string;
  link: string;
  user?: any;
  onRequireAuth?: () => void;
}) {
  const content = (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-left">
      <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-slate-900 mb-5">
        <img
          src={bgImg}
          alt={level}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="rounded-xl bg-slate-950/80 px-3 py-1 text-xs font-black text-white backdrop-blur border border-white/10">
            {level}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{desc}</p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-rose-600">
        <span>Vào bài học</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );

  if (!user) {
    return (
      <button type="button" onClick={onRequireAuth} className="w-full">
        {content}
      </button>
    );
  }

  return (
    <Link to={link} prefetch="intent">
      {content}
    </Link>
  );
}

function FeatureBox({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: any;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}
