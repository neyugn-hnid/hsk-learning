import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  Navigate,
  useNavigate,
  useNavigation,
  useLocation,
  useRouteError,
  useSearchParams,
} from "react-router";
import type { LinksFunction } from "react-router";
import { useEffect, useRef, useState } from "react";
import { ToastProvider, useToast } from "~/components/Toast";
import { AuthProvider } from "~/components/AuthProvider";
import appCss from "~/styles/app.css?url";

const MAINTENANCE_MODE = true;

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
  const location = useLocation();

  // Chế độ bảo trì: redirect tất cả về /maintenance (trừ chính trang maintenance)
  if (MAINTENANCE_MODE && location.pathname !== "/maintenance") {
    return <Navigate to="/maintenance" replace />;
  }

  return (
    <AuthProvider>
      <NavigationProgress />
      <ToastSearchBridge />
      <PageTransition>
        <Outlet />
      </PageTransition>
    </AuthProvider>
  );
}

/* ─── Navigation Progress Bar ─── */
function NavigationProgress() {
  const navigation = useNavigation();
  const [show, setShow] = useState(false);
  const [complete, setComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (navigation.state === "loading" || navigation.state === "submitting") {
      setComplete(false);
      timerRef.current = setTimeout(() => setShow(true), 80);
    } else if (navigation.state === "idle" && show) {
      setComplete(true);
      timerRef.current = setTimeout(() => {
        setShow(false);
        setComplete(false);
      }, 120);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigation.state, show]);

  if (!show) return null;

  return (
    <div
      className={`nav-progress-bar ${complete ? "complete" : ""}`}
      role="progressbar"
      aria-label="Đang tải trang..."
    />
  );
}

/* ─── Page Fade-In Transition ─── */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setAnimating(true);
      setPrevPath(location.pathname);
      const t = setTimeout(() => setAnimating(false), 90);
      return () => clearTimeout(t);
    }
  }, [location.pathname, prevPath]);

  return (
    <div className={animating ? "page-transition-enter" : ""}>
      {children}
    </div>
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
