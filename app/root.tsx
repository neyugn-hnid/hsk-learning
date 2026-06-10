import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
  useSearchParams,
} from "react-router";
import type { LinksFunction } from "react-router";
import { useEffect } from "react";
import { ToastProvider, useToast } from "~/components/Toast";
import appCss from "~/styles/app.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: appCss }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-50 text-slate-900">
        <ToastProvider>{children}</ToastProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <ToastSearchBridge />
      <Outlet />
    </>
  );
}

function ToastSearchBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (!toast) return;

    const tone = searchParams.get("toastType");
    pushToast(
      toast,
      tone === "success" || tone === "error" || tone === "info"
        ? tone
        : "info",
    );

    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    next.delete("toastType");
    const query = next.toString();
    navigate(query ? `?${query}` : ".", { replace: true });
  }, [navigate, pushToast, searchParams]);

  return null;
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Có lỗi xảy ra.";
  if (isRouteErrorResponse(error)) message = `${error.status} ${error.statusText}`;
  else if (error instanceof Error) message = error.message;
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-black">Lỗi</h1><p className="mt-2 text-slate-600">{message}</p></main>;
}
