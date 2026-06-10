import type { Route } from "./+types/_index";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ListChecks,
  Volume2,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return { user: await getUser(request) };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <SiteLayout user={loaderData.user}>
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-24">
          <div>
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-red-700">
              Học tiếng Trung có lộ trình rõ ràng
            </span>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-6xl">
              Học tiếng Trung dễ dàng hơn mỗi ngày
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
              Tab Lộ trình dùng dữ liệu riêng để bám sát tiến độ trên lớp. Tab
              Bài học là khu học HSK riêng, nơi bạn học từ vựng, pinyin, ngữ
              pháp và quiz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/hsk20"
                className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-100 hover:bg-red-700"
              >
                Học HSK 2.0
              </Link>
              <Link
                to="/hsk30"
                className="flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-100 hover:bg-amber-700"
              >
                Học HSK 3.0
              </Link>
              <Link
                to="/roadmap"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem lộ trình lớp
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="rounded-3xl bg-gradient-to-br from-red-50 to-amber-50 p-8">
              <p className="text-center text-6xl font-black text-red-600 sm:text-8xl">
                你好
              </p>
              <p className="mt-3 text-center text-2xl font-semibold text-slate-800">
                nǐ hǎo
              </p>
              <p className="mt-2 text-center text-lg text-slate-600">
                Xin chào
              </p>
              <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-semibold">Ví dụ</p>
                <p className="mt-2 text-xl text-bold">你好，我叫小明。</p>
                <p className="mt-1 text-slate-500">
                  Xin chào, tôi tên là Tiểu Minh.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={BookOpen}
              title="Bài học HSK"
              text="Học theo bộ bài HSK, dễ tìm và dễ ôn lại."
            />
            <Feature
              icon={Volume2}
              title="Luyện pinyin"
              text="Hiển thị pinyin rõ ràng, hỗ trợ học phát âm."
            />
            <Feature
              icon={ListChecks}
              title="Làm quiz"
              text="Củng cố kiến thức bằng câu hỏi trắc nghiệm."
            />
            <Feature
              icon={BarChart3}
              title="Lộ trình trên lớp"
              text="Dùng dữ liệu riêng cho từng buổi học, chặng học và mục tiêu cần đạt."
            />
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

function Feature({ icon: Icon, title, text }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <Icon size={22} />
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
