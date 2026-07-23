export default function Maintenance() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-12 w-12 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
          Đang bảo trì
        </h1>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          Trang web đang được nâng cấp, vui lòng quay lại sau ít phút.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Cảm ơn bạn đã kiên nhẫn!
        </p>
      </div>
    </main>
  );
}
