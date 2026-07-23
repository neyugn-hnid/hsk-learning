import { t as prisma } from "./assets/db.server-CcYyPylZ.js";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { Form, Link, Links, Meta, NavLink, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, UNSAFE_withErrorBoundaryProps, createCookieSessionStorage, data, isRouteErrorResponse, redirect, useActionData, useFetcher, useLocation, useNavigate, useNavigation, useRevalidator, useRouteError, useSearchParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, BarChart3, BookMarked, BookOpen, Bot, Brain, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, FileJson, Filter, Flame, GitBranch, GraduationCap, Home, Info, Layers, ListChecks, Loader2, LogOut, Map as Map$1, MessageCircle, Mic, MicOff, RefreshCw, RotateCcw, Save, Search, Send, Shield, ShieldCheck, Shuffle, Smartphone, Sparkles, Star, Trash2, TriangleAlert, Trophy, Upload, User, Users, Volume2, X, XCircle, Zap } from "lucide-react";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "node:crypto";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region node_modules/@react-router/dev/dist/config/defaults/entry.server.node.tsx
var entry_server_node_exports = /* @__PURE__ */ __exportAll({
	default: () => handleRequest,
	streamTimeout: () => streamTimeout
});
var streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
	if (request.method.toUpperCase() === "HEAD") return new Response(null, {
		status: responseStatusCode,
		headers: responseHeaders
	});
	return new Promise((resolve, reject) => {
		let shellRendered = false;
		let userAgent = request.headers.get("user-agent");
		let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
		let timeoutId = setTimeout(() => abort(), streamTimeout + 1e3);
		const { pipe, abort } = renderToPipeableStream(/* @__PURE__ */ jsx(ServerRouter, {
			context: routerContext,
			url: request.url
		}), {
			[readyOption]() {
				shellRendered = true;
				const body = new PassThrough({ final(callback) {
					clearTimeout(timeoutId);
					timeoutId = void 0;
					callback();
				} });
				const stream = createReadableStreamFromReadable(body);
				responseHeaders.set("Content-Type", "text/html");
				pipe(body);
				resolve(new Response(stream, {
					headers: responseHeaders,
					status: responseStatusCode
				}));
			},
			onShellError(error) {
				reject(error);
			},
			onError(error) {
				responseStatusCode = 500;
				if (shellRendered) console.error(error);
			}
		});
	});
}
//#endregion
//#region app/components/Toast.tsx
var ToastContext = createContext(null);
function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const removeToast = useCallback((id) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);
	const pushToast = useCallback((message, tone = "info") => {
		const id = Date.now() + Math.floor(Math.random() * 1e3);
		setToasts((current) => [...current, {
			id,
			message,
			tone
		}]);
	}, []);
	const value = useMemo(() => ({ pushToast }), [pushToast]);
	return /* @__PURE__ */ jsxs(ToastContext.Provider, {
		value,
		children: [children, /* @__PURE__ */ jsx("div", {
			className: "pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3",
			children: toasts.map((toast) => /* @__PURE__ */ jsx(ToastCard, {
				toast,
				onClose: () => removeToast(toast.id)
			}, toast.id))
		})]
	});
}
function useToast() {
	const context = useContext(ToastContext);
	if (!context) throw new Error("useToast must be used inside ToastProvider.");
	return context;
}
function ToastCard({ toast, onClose }) {
	useEffect(() => {
		const timer = window.setTimeout(onClose, 3200);
		return () => window.clearTimeout(timer);
	}, [onClose]);
	const toneClasses = toast.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : toast.tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700";
	const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? TriangleAlert : Info;
	return /* @__PURE__ */ jsxs("div", {
		className: `pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-slate-200/60 ${toneClasses}`,
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ jsx(Icon, {
				size: 18,
				className: "mt-0.5 shrink-0"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "min-w-0 flex-1 text-sm font-semibold",
				children: toast.message
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: onClose,
				className: "rounded-full p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100",
				"aria-label": "Đóng thông báo",
				children: /* @__PURE__ */ jsx(X, { size: 16 })
			})
		]
	});
}
//#endregion
//#region app/components/AuthModal.tsx
function AuthModal({ open, mode, onClose, onSwitchMode }) {
	const [showPassword, setShowPassword] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const fetcher = useFetcher();
	const overlayRef = useRef(null);
	const isLogin = mode === "login";
	const error = fetcher.data?.message || fetcher.data?.error;
	useEffect(() => {
		setName("");
		setEmail("");
		setPassword("");
	}, [mode]);
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data && !fetcher.data.message && !fetcher.data.error) window.location.href = "/dashboard";
	}, [fetcher.state, fetcher.data]);
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open]);
	if (!open) return null;
	const handleSubmit = (e) => {
		e.preventDefault();
		fetcher.submit(isLogin ? {
			email,
			password
		} : {
			name,
			email,
			password
		}, {
			method: "POST",
			action: isLogin ? "/api/auth/login" : "/api/auth/register",
			encType: "application/json"
		});
	};
	return /* @__PURE__ */ jsx("div", {
		ref: overlayRef,
		onClick: (e) => {
			if (e.target === overlayRef.current) onClose();
		},
		className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:p-8",
			children: [
				/* @__PURE__ */ jsx("button", {
					onClick: onClose,
					className: "absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
					children: /* @__PURE__ */ jsx(X, { size: 20 })
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-center",
					children: /* @__PURE__ */ jsx("div", {
						className: "flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-red-600 text-white shadow-lg shadow-red-100",
						children: /* @__PURE__ */ jsx(GraduationCap, { size: 30 })
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-5 text-center",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-bold uppercase tracking-[0.24em] text-red-500",
							children: "HSK Learning"
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "mt-2 text-3xl font-black text-slate-900",
							children: isLogin ? "Đăng nhập" : "Tạo tài khoản"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-6 text-slate-500",
							children: isLogin ? "Tiếp tục lộ trình HSK, luyện phát âm, viết chữ và làm quiz trong cùng một nơi." : "Tạo tài khoản để bắt đầu học HSK, theo lộ trình lớp và lưu quá trình luyện tập của bạn."
						})
					]
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					className: "mt-8 space-y-4",
					children: [
						!isLogin ? /* @__PURE__ */ jsxs("label", {
							className: "block",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-bold text-slate-700",
								children: "Họ tên"
							}), /* @__PURE__ */ jsx("input", {
								name: "name",
								value: name,
								onChange: (e) => setName(e.target.value),
								className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400",
								placeholder: "Nhập họ tên"
							})]
						}) : null,
						/* @__PURE__ */ jsxs("label", {
							className: "block",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-bold text-slate-700",
								children: "Email"
							}), /* @__PURE__ */ jsx("input", {
								name: "email",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400",
								placeholder: "you@example.com"
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "block",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-bold text-slate-700",
								children: "Mật khẩu"
							}), /* @__PURE__ */ jsxs("div", {
								className: "relative mt-2",
								children: [/* @__PURE__ */ jsx("input", {
									name: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									type: showPassword ? "text" : "password",
									className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400",
									placeholder: isLogin ? "Nhập mật khẩu" : "Ít nhất 6 ký tự"
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setShowPassword((prev) => !prev),
									className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
									children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
								})]
							})]
						}),
						error ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600",
							children: error
						}) : null,
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							className: "w-full rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50",
							disabled: fetcher.state === "submitting",
							children: fetcher.state === "submitting" ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Tạo tài khoản"
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 text-center text-sm text-slate-500",
					children: isLogin ? /* @__PURE__ */ jsxs(Fragment, { children: [
						"Chưa có tài khoản?",
						" ",
						/* @__PURE__ */ jsx("button", {
							onClick: () => onSwitchMode("register"),
							className: "font-bold text-red-600",
							children: "Đăng ký"
						})
					] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
						"Đã có tài khoản?",
						" ",
						/* @__PURE__ */ jsx("button", {
							onClick: () => onSwitchMode("login"),
							className: "font-bold text-red-600",
							children: "Đăng nhập"
						})
					] })
				})
			]
		})
	});
}
//#endregion
//#region app/components/AuthProvider.tsx
var AuthContext = createContext({
	openLogin: () => {},
	openRegister: () => {}
});
function useAuth() {
	return useContext(AuthContext);
}
function AuthProvider({ children }) {
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState("login");
	const openLogin = () => {
		setMode("login");
		setOpen(true);
	};
	const openRegister = () => {
		setMode("register");
		setOpen(true);
	};
	const close = () => setOpen(false);
	return /* @__PURE__ */ jsxs(AuthContext.Provider, {
		value: {
			openLogin,
			openRegister
		},
		children: [children, /* @__PURE__ */ jsx(AuthModal, {
			open,
			mode,
			onClose: close,
			onSwitchMode: setMode
		})]
	});
}
//#endregion
//#region app/styles/app.css?url
var app_default = "/assets/app-CtPYLe7M.css";
//#endregion
//#region app/root.tsx
var root_exports = /* @__PURE__ */ __exportAll({
	ErrorBoundary: () => ErrorBoundary,
	Layout: () => Layout,
	default: () => root_default,
	links: () => links
});
var links = () => [{
	rel: "stylesheet",
	href: app_default
}];
function Layout({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "vi",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
			/* @__PURE__ */ jsx("meta", {
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			}),
			/* @__PURE__ */ jsx(Meta, {}),
			/* @__PURE__ */ jsx(Links, {})
		] }), /* @__PURE__ */ jsxs("body", {
			className: "bg-slate-50 text-slate-900",
			children: [
				/* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(ToastProvider, { children }) }),
				/* @__PURE__ */ jsx(ScrollRestoration, {}),
				/* @__PURE__ */ jsx(Scripts, {})
			]
		})]
	});
}
var root_default = UNSAFE_withComponentProps(function App() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(NavigationProgress, {}),
		/* @__PURE__ */ jsx(ToastSearchBridge, {}),
		/* @__PURE__ */ jsx(PageTransition, { children: /* @__PURE__ */ jsx(Outlet, {}) })
	] });
});
function NavigationProgress() {
	const navigation = useNavigation();
	const [show, setShow] = useState(false);
	const [complete, setComplete] = useState(false);
	const timerRef = useRef(null);
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
	return /* @__PURE__ */ jsx("div", {
		className: `nav-progress-bar ${complete ? "complete" : ""}`,
		role: "progressbar",
		"aria-label": "Đang tải trang..."
	});
}
function PageTransition({ children }) {
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
	return /* @__PURE__ */ jsx("div", {
		className: animating ? "page-transition-enter" : "",
		children
	});
}
function ToastSearchBridge() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { pushToast } = useToast();
	useEffect(() => {
		const toast = searchParams.get("toast");
		if (!toast) return;
		const tone = searchParams.get("toastType");
		pushToast(toast, tone === "success" || tone === "error" || tone === "info" ? tone : "info");
		const next = new URLSearchParams(searchParams);
		next.delete("toast");
		next.delete("toastType");
		const query = next.toString();
		navigate(query ? `?${query}` : ".", { replace: true });
	}, [
		navigate,
		pushToast,
		searchParams
	]);
	return null;
}
var ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary() {
	const error = useRouteError();
	let message = "Có lỗi xảy ra.";
	if (isRouteErrorResponse(error)) message = `${error.status} ${error.statusText}`;
	else if (error instanceof Error) message = error.message;
	return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto max-w-3xl p-8",
		children: [/* @__PURE__ */ jsx("h1", {
			className: "text-2xl font-black",
			children: "Lỗi"
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-2 text-slate-600",
			children: message
		})]
	});
});
//#endregion
//#region app/components/AIChatWidget.tsx
var WELCOME = {
	id: "welcome",
	role: "assistant",
	content: "Xin chào! Tôi là trợ lý AI học tiếng Trung.\n\n• Hỏi tôi về từ vựng, ngữ pháp, phát âm...\n• Gõ \"Luyện tập\" để AI tạo câu hỏi trắc nghiệm.\n• Gõ \"Luyện chữ Hán\" để luyện viết câu tiếng Trung.\n\nBắt đầu ngay nhé!"
};
function startsWithAny(text, patterns) {
	return patterns.some((pattern) => pattern.test(text));
}
function AIChatWidget() {
	const location = useLocation();
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState([WELCOME]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [quizSel, setQuizSel] = useState({});
	const [quizChecking, setQuizChecking] = useState({});
	const [quizActive, setQuizActive] = useState(false);
	const [listening, setListening] = useState(false);
	const [convoActive, setConvoActive] = useState(false);
	const [translationActive, setTranslationActive] = useState(false);
	const [hanziActive, setHanziActive] = useState(false);
	const quizActiveRef = useRef(false);
	const convoActiveRef = useRef(false);
	const translationActiveRef = useRef(false);
	const hanziActiveRef = useRef(false);
	const hanziSentenceRef = useRef(null);
	const recognitionRef = useRef(null);
	const scrollRef = useRef(null);
	const inputRef = useRef(null);
	const prevWordsRef = useRef([]);
	const prevSentencesRef = useRef([]);
	const audioRef = useRef(null);
	const [speaking, setSpeaking] = useState(false);
	const lessonMatch = location.pathname.match(/^\/lessons\/([^/]+)/);
	const roadmapMatch = location.pathname.match(/^\/roadmap\/([^/]+)/);
	const currentLessonId = lessonMatch ? lessonMatch[1] : null;
	const currentRoadmapId = roadmapMatch ? roadmapMatch[1] : null;
	const setQuizActiveState = (value) => {
		setQuizActive(value);
		quizActiveRef.current = value;
	};
	const setConvoActiveState = (value) => {
		setConvoActive(value);
		convoActiveRef.current = value;
	};
	const setTranslationActiveState = (value) => {
		setTranslationActive(value);
		translationActiveRef.current = value;
	};
	const setHanziActiveState = (value) => {
		setHanziActive(value);
		hanziActiveRef.current = value;
	};
	const addStudyContext = (body) => {
		if (currentLessonId) body.lessonIds = [currentLessonId];
		if (currentRoadmapId) body.roadmapId = currentRoadmapId;
		return body;
	};
	const pushAssistant = (content) => {
		setMessages((current) => [...current, {
			id: `a${Date.now()}`,
			role: "assistant",
			content
		}]);
	};
	const toggleMic = () => {
		if (listening) {
			recognitionRef.current?.stop();
			setListening(false);
			return;
		}
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			alert("Trình duyệt không hỗ trợ nhập giọng nói.");
			return;
		}
		const recognition = new SpeechRecognition();
		recognition.lang = "zh-CN";
		recognition.interimResults = false;
		recognition.continuous = false;
		recognition.onresult = (event) => {
			const transcript = event.results[0][0].transcript;
			setInput((current) => `${current}${transcript}`);
		};
		recognition.onerror = () => setListening(false);
		recognition.onend = () => setListening(false);
		recognitionRef.current = recognition;
		recognition.start();
		setListening(true);
	};
	useEffect(() => {
		return () => recognitionRef.current?.stop();
	}, []);
	useEffect(() => {
		if (!open) return;
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth"
		});
		setTimeout(() => inputRef.current?.focus(), 250);
	}, [
		open,
		messages,
		quizSel,
		quizChecking
	]);
	const generateHanziSentence = async () => {
		setLoading(true);
		try {
			const body = addStudyContext({ intent: "hanzi_sentence" });
			if (prevSentencesRef.current.length > 0) body.previousSentences = prevSentencesRef.current;
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})).json();
			if (!data.sentence) {
				pushAssistant(data.error || "Không tạo được câu.");
				setHanziActiveState(false);
				return;
			}
			hanziSentenceRef.current = data.sentence;
			const sentChinese = data.sentence.chinese?.trim();
			if (sentChinese && !prevSentencesRef.current.includes(sentChinese)) {
				prevSentencesRef.current.push(sentChinese);
				if (prevSentencesRef.current.length > 30) prevSentencesRef.current.shift();
			}
			pushAssistant(`Viết chữ Hán cho câu sau:\n\nPinyin: ${data.sentence.pinyin}\nNghĩa: ${data.sentence.meaningVi}\n\nNhập chữ Hán của bạn vào ô bên dưới.`);
		} catch {
			pushAssistant("Lỗi kết nối.");
			setHanziActiveState(false);
		} finally {
			setLoading(false);
		}
	};
	const genQuiz = async () => {
		setLoading(true);
		try {
			const body = addStudyContext({ intent: "practice_generate" });
			if (prevWordsRef.current.length > 0) body.previousWords = prevWordsRef.current;
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})).json();
			if (!data.question) {
				pushAssistant(data.error || "Không tạo được câu hỏi.");
				setQuizActiveState(false);
				return;
			}
			const word = data.question.answer?.replace(/[()（）].*/g, "").trim();
			if (word && !prevWordsRef.current.includes(word)) prevWordsRef.current.push(word);
			setMessages((current) => [...current, {
				id: `q${Date.now()}`,
				role: "assistant",
				content: data.question.question,
				quiz: data.question
			}]);
		} catch {
			pushAssistant("Lỗi kết nối.");
			setQuizActiveState(false);
		} finally {
			setLoading(false);
		}
	};
	const sendMessage = async () => {
		const text = input.trim();
		if (!text || loading) return;
		setMessages((current) => [...current, {
			id: `u${Date.now()}`,
			role: "user",
			content: text
		}]);
		setInput("");
		setLoading(true);
		try {
			if (startsWithAny(text, [/^(kết thúc|ket thuc|dừng|dung|stop|end|thoát|thoat)/i])) {
				let label = "trợ lý";
				if (quizActiveRef.current) label = "luyện tập";
				else if (hanziActiveRef.current) label = "luyện chữ Hán";
				else if (convoActiveRef.current) label = "hội thoại";
				else if (translationActiveRef.current) label = "dịch";
				setQuizActiveState(false);
				setConvoActiveState(false);
				setTranslationActiveState(false);
				setHanziActiveState(false);
				hanziSentenceRef.current = null;
				prevSentencesRef.current = [];
				pushAssistant(`Đã kết thúc ${label}. Gõ luyện tập, luyện chữ Hán hoặc dịch để bắt đầu!`);
				return;
			}
			if (startsWithAny(text, [/^(luyện chữ hán|luyen chu han|viết chữ|viet chu|hanzi writing|chữ hán|chu han)/i])) {
				setHanziActiveState(true);
				setQuizActiveState(false);
				setConvoActiveState(false);
				setTranslationActiveState(false);
				hanziSentenceRef.current = null;
				prevSentencesRef.current = [];
				pushAssistant("Bắt đầu luyện viết chữ Hán! Tôi sẽ đưa câu, bạn gõ chữ Hán tương ứng. Gõ kết thúc để dừng.");
				setLoading(false);
				setTimeout(() => generateHanziSentence(), 350);
				return;
			}
			if (startsWithAny(text, [/^(dịch|dich|translate|phiên dịch|phien dich)/i])) {
				setTranslationActiveState(true);
				setQuizActiveState(false);
				setConvoActiveState(false);
				setHanziActiveState(false);
				hanziSentenceRef.current = null;
				pushAssistant("Chế độ dịch: Nhập tiếng Việt, tôi sẽ phân tích sang tiếng Trung (chữ Hán, pinyin, nghĩa, ví dụ). Gõ kết thúc để thoát.");
				return;
			}
			if (startsWithAny(text, [/^(luyện tập|luyen tap|luyện|luyen|practice|quiz|ôn tập|on tap|kiểm tra|kiem tra)/i])) {
				setQuizActiveState(true);
				setConvoActiveState(false);
				setTranslationActiveState(false);
				setHanziActiveState(false);
				hanziSentenceRef.current = null;
				prevWordsRef.current = [];
				pushAssistant("Bắt đầu chuỗi luyện tập! Trả lời từng câu, gõ kết thúc để dừng.");
				setLoading(false);
				setTimeout(() => genQuiz(), 350);
				return;
			}
			if (hanziActiveRef.current && hanziSentenceRef.current) {
				const body = addStudyContext({
					intent: "hanzi_check",
					userAnswer: text,
					sentence: hanziSentenceRef.current
				});
				const data = await (await fetch("/api/ai/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body)
				})).json();
				pushAssistant(data.feedback || (data.correct ? "Chính xác! 🎉" : `Chưa đúng. Đáp án: ${hanziSentenceRef.current.chinese}`));
				if (hanziActiveRef.current) setTimeout(() => generateHanziSentence(), 1e3);
				return;
			}
			const body = addStudyContext({
				intent: "chat",
				mode: translationActiveRef.current ? "translate" : convoActiveRef.current ? "conversation" : "chat",
				messages: [{
					role: "user",
					content: text
				}]
			});
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})).json();
			pushAssistant(data.reply || data.error || "Lỗi.");
		} catch {
			pushAssistant("Lỗi kết nối.");
		} finally {
			setLoading(false);
			inputRef.current?.focus();
		}
	};
	const checkQuiz = async (msgId, quiz, answer) => {
		setQuizChecking((current) => ({
			...current,
			[msgId]: true
		}));
		try {
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "practice_check",
					userAnswer: answer,
					question: quiz.question,
					correctAnswer: quiz.answer
				})
			})).json();
			setMessages((current) => current.map((message) => message.id === msgId ? {
				...message,
				quizChecked: true,
				quizCorrect: data.correct,
				content: `Đáp án: ${quiz.answer} - ${data.feedback || (data.correct ? "Chính xác!" : "Chưa đúng!")}`
			} : message));
		} catch {
			setMessages((current) => current.map((message) => message.id === msgId ? {
				...message,
				quizChecked: true,
				quizCorrect: false
			} : message));
		} finally {
			setQuizChecking((current) => ({
				...current,
				[msgId]: false
			}));
			if (quizActiveRef.current) setTimeout(() => genQuiz(), 600);
		}
	};
	const reset = () => {
		setMessages([WELCOME]);
		setQuizSel({});
		setQuizChecking({});
		setQuizActiveState(false);
		setConvoActiveState(false);
		setTranslationActiveState(false);
		setHanziActiveState(false);
		hanziSentenceRef.current = null;
		prevWordsRef.current = [];
	};
	const fallbackSpeak = (text, lang) => {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = lang;
		utterance.rate = 1;
		const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith(lang.split("-")[0]));
		if (voice) utterance.voice = voice;
		window.speechSynthesis.speak(utterance);
	};
	const speakText = async (text) => {
		if (speaking) {
			audioRef.current?.pause();
			setSpeaking(false);
			return;
		}
		const clean = text.replace(/\*\*|__|`|[*_~]/g, "").replace(/[ABCD]\)/g, "").slice(0, 500);
		const chineseChars = clean.match(/[\u4e00-\u9fff]/g);
		const lang = chineseChars && chineseChars.length > clean.length * .3 ? "zh-CN" : "vi-VN";
		setSpeaking(true);
		try {
			const data = await (await fetch("/api/ai/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: clean,
					lang
				})
			})).json();
			if (!data.audio) {
				fallbackSpeak(clean, lang);
				setSpeaking(false);
				return;
			}
			const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
			audio.onended = () => setSpeaking(false);
			audio.onerror = () => setSpeaking(false);
			audioRef.current = audio;
			await audio.play();
		} catch {
			fallbackSpeak(clean, lang);
			setSpeaking(false);
		}
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [!open ? /* @__PURE__ */ jsx("button", {
		onClick: () => setOpen(true),
		className: "fixed bottom-28 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-all hover:scale-110 hover:bg-red-700 md:bottom-10 md:right-6",
		type: "button",
		"aria-label": "Mở trợ lý AI",
		children: /* @__PURE__ */ jsx(GraduationCap, { size: 24 })
	}) : null, open ? /* @__PURE__ */ jsxs("div", {
		className: "fixed bottom-32 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl md:bottom-14 md:right-6",
		style: { height: "min(600px, calc(100vh - 8rem))" },
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: `flex items-center justify-between rounded-t-3xl px-4 py-3 text-white ${translationActive ? "bg-emerald-500" : hanziActive ? "bg-purple-600" : convoActive ? "bg-blue-500" : "bg-red-500"}`,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(GraduationCap, { size: 20 }), /* @__PURE__ */ jsx("span", {
						className: "text-sm font-bold",
						children: quizActive ? "Đang luyện tập" : hanziActive ? "Luyện chữ Hán" : convoActive ? "Đang hội thoại" : translationActive ? "Chế độ dịch" : "HSK Learning"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: reset,
						className: "rounded-full bg-white/20 p-1.5 transition hover:bg-white/30",
						type: "button",
						title: "Làm mới",
						children: /* @__PURE__ */ jsx(RotateCcw, { size: 14 })
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setOpen(false),
						className: "rounded-full bg-white/20 p-1.5 transition hover:bg-white/30",
						type: "button",
						title: "Đóng",
						children: /* @__PURE__ */ jsx(X, { size: 16 })
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				ref: scrollRef,
				className: "flex-1 space-y-3 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden",
				style: { scrollbarWidth: "none" },
				children: [messages.map((message) => /* @__PURE__ */ jsxs("div", {
					className: `flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`,
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600",
						children: message.role === "user" ? /* @__PURE__ */ jsx(User, { size: 14 }) : /* @__PURE__ */ jsx(GraduationCap, { size: 14 })
					}), /* @__PURE__ */ jsxs("div", {
						className: `group relative max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${message.role === "user" ? "bg-red-600 text-white" : "bg-slate-50 text-slate-700"}`,
						children: [message.quiz && !message.quizChecked ? /* @__PURE__ */ jsxs("div", {
							className: "w-56",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700",
									children: message.quiz.type === "pinyin" ? "Pinyin" : message.quiz.type === "recognition" ? "Chữ Hán" : "Nghĩa"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "mt-1.5 block text-xs font-extrabold text-slate-900",
									children: message.quiz.question
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-2 grid gap-1",
									children: message.quiz.options.map((option) => {
										return /* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setQuizSel((current) => ({
												...current,
												[message.id]: option
											})),
											className: `truncate rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${quizSel[message.id] === option ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`,
											children: option
										}, option);
									})
								}),
								/* @__PURE__ */ jsxs("button", {
									onClick: () => {
										const answer = quizSel[message.id];
										if (answer) checkQuiz(message.id, message.quiz, answer);
									},
									disabled: !quizSel[message.id] || quizChecking[message.id],
									className: "mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 py-2 text-[11px] font-bold text-white transition disabled:opacity-40",
									children: [quizChecking[message.id] ? /* @__PURE__ */ jsx(Loader2, {
										size: 12,
										className: "animate-spin"
									}) : /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }), "Kiểm tra"]
								})
							]
						}) : message.quiz && message.quizChecked ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
							className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${message.quizCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`,
							children: [message.quizCorrect ? /* @__PURE__ */ jsx(CheckCircle2, { size: 10 }) : /* @__PURE__ */ jsx(X, { size: 10 }), message.quizCorrect ? "Chính xác" : "Chưa đúng"]
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] font-medium",
							children: message.content
						})] }) : message.content.replace(/\*\*/g, ""), message.role === "assistant" && message.id !== "welcome" ? /* @__PURE__ */ jsxs("button", {
							onClick: () => speakText(message.content),
							className: `mt-1 flex items-center gap-1 text-[10px] transition ${speaking ? "text-red-500" : "text-slate-400 hover:text-red-500"}`,
							type: "button",
							title: "Đọc",
							children: [
								/* @__PURE__ */ jsx(Volume2, { size: 11 }),
								" ",
								speaking ? "Đang đọc..." : "Nghe"
							]
						}) : null]
					})]
				}, message.id)), loading ? /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-400",
					children: [/* @__PURE__ */ jsx(Loader2, {
						size: 14,
						className: "animate-spin text-red-500"
					}), "Đang trả lời..."]
				}) : null]
			}),
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "flex gap-1.5 overflow-x-auto px-3 pb-1 pt-1 [&::-webkit-scrollbar]:hidden",
					style: { scrollbarWidth: "none" },
					children: [
						"Dịch",
						"Luyện chữ Hán",
						"Luyện tập",
						"Ngữ pháp"
					].map((quickReply) => /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => {
							setInput(quickReply);
							inputRef.current?.focus();
						},
						className: "shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600",
						children: quickReply
					}, quickReply))
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: (event) => {
						event.preventDefault();
						sendMessage();
					},
					className: "flex gap-2 border-t border-slate-100 p-3",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: toggleMic,
							className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${listening ? "animate-pulse bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"}`,
							title: "Nhập giọng nói",
							children: listening ? /* @__PURE__ */ jsx(MicOff, { size: 14 }) : /* @__PURE__ */ jsx(Mic, { size: 14 })
						}),
						/* @__PURE__ */ jsx("input", {
							ref: inputRef,
							value: input,
							onChange: (event) => setInput(event.target.value),
							placeholder: quizActive ? "Gõ \"kết thúc\" để dừng luyện tập..." : hanziActive ? "Nhập chữ Hán..." : convoActive ? "Nói hoặc gõ tiếng Trung..." : translationActive ? "Nhập tiếng Việt để dịch sang tiếng Trung..." : "Hỏi từ vựng, gõ \"luyện tập\" hoặc \"luyện chữ Hán\"...",
							className: "flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100",
							disabled: loading
						}),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: !input.trim() || loading,
							className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white transition disabled:opacity-40",
							children: loading ? /* @__PURE__ */ jsx(Loader2, {
								size: 14,
								className: "animate-spin"
							}) : /* @__PURE__ */ jsx(Send, { size: 14 })
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "pb-2 text-center text-[10px] text-slate-300",
					children: "Powered by Van Dinh"
				})
			] })
		]
	}) : null] });
}
//#endregion
//#region app/components/Layout.tsx
function SiteLayout({ children, user }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);
	const location = useLocation();
	const { openLogin, openRegister } = useAuth();
	const isActive = (to) => {
		if (to === "/") return location.pathname === "/";
		return location.pathname.startsWith(to);
	};
	const desktopMenus = [
		{
			to: "/",
			label: "Trang chủ",
			icon: Home
		},
		{
			to: "/lessons",
			label: "Bài học",
			icon: BookOpen
		},
		{
			to: "/roadmap",
			label: "Lộ trình",
			icon: Map$1
		}
	];
	const bottomTabs = [
		{
			to: "/",
			label: "Trang chủ",
			icon: Home
		},
		{
			to: "/lessons",
			label: "Bài học",
			icon: BookOpen
		},
		{
			to: "/roadmap",
			label: "Lộ trình",
			icon: Map$1
		}
	];
	useEffect(() => {
		if (!menuOpen) return;
		const handleClickOutside = (event) => {
			if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col min-h-screen pb-24 md:pb-0",
		children: [
			/* @__PURE__ */ jsx("header", {
				className: "sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:py-4",
					children: [
						/* @__PURE__ */ jsxs(Link, {
							to: "/",
							prefetch: "render",
							className: "flex shrink-0 items-center gap-2",
							children: [/* @__PURE__ */ jsx("div", {
								className: "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm",
								children: /* @__PURE__ */ jsx(GraduationCap, { size: 22 })
							}), /* @__PURE__ */ jsx("div", {
								className: "text-left",
								children: /* @__PURE__ */ jsx("p", {
									className: "text-lg font-bold",
									children: "HSK Learning"
								})
							})]
						}),
						/* @__PURE__ */ jsx("nav", {
							className: "hidden items-center gap-1 md:flex",
							children: desktopMenus.map((item) => {
								const Icon = item.icon;
								const active = isActive(item.to);
								return /* @__PURE__ */ jsxs(NavLink, {
									to: item.to,
									prefetch: "render",
									className: `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${active ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-100"}`,
									children: [/* @__PURE__ */ jsx(Icon, { size: 16 }), item.label]
								}, item.to);
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "relative flex items-center gap-2",
							ref: menuRef,
							children: [
								!user ? /* @__PURE__ */ jsx("button", {
									onClick: openRegister,
									className: "hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 lg:flex",
									children: "Bắt đầu học"
								}) : null,
								user ? /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setMenuOpen((prev) => !prev),
									"aria-label": "Mở menu tài khoản",
									className: "flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50",
									children: /* @__PURE__ */ jsx(User, { size: 20 })
								}) : /* @__PURE__ */ jsx("button", {
									onClick: openLogin,
									className: "flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 md:hidden",
									children: /* @__PURE__ */ jsx(User, { size: 20 })
								}),
								user && menuOpen ? /* @__PURE__ */ jsxs("div", {
									className: "absolute right-4 top-[calc(100%-0.25rem)] w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-xl md:right-4",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "rounded-2xl bg-slate-50 px-4 py-3",
											children: [/* @__PURE__ */ jsx("p", {
												className: "text-sm font-bold text-slate-900",
												children: user.name
											}), user.email ? /* @__PURE__ */ jsx("p", {
												className: "mt-1 text-xs text-slate-500",
												children: user.email
											}) : null]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-2 space-y-1",
											children: [/* @__PURE__ */ jsxs(Link, {
												to: "/profile",
												prefetch: "intent",
												onClick: () => setMenuOpen(false),
												className: "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100",
												children: [/* @__PURE__ */ jsx(User, { size: 16 }), "Hồ sơ"]
											}), user?.role === "ADMIN" ? /* @__PURE__ */ jsxs(Link, {
												to: "/admin",
												prefetch: "intent",
												onClick: () => setMenuOpen(false),
												className: "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100",
												children: [/* @__PURE__ */ jsx(Shield, { size: 16 }), "Quản trị"]
											}) : null]
										}),
										/* @__PURE__ */ jsx(Form, {
											method: "post",
											action: "/api/auth/logout",
											className: "mt-2",
											children: /* @__PURE__ */ jsxs("button", {
												type: "submit",
												className: "flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50",
												children: [/* @__PURE__ */ jsx(LogOut, { size: 16 }), "Đăng xuất"]
											})
										})
									]
								}) : null
							]
						})
					]
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex-1",
				children
			}),
			/* @__PURE__ */ jsx(AIChatWidget, {}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden",
				children: /* @__PURE__ */ jsx("div", {
					className: "mx-auto grid max-w-md grid-cols-3 gap-2",
					children: bottomTabs.map((tab) => {
						const Icon = tab.icon;
						const active = isActive(tab.to);
						return /* @__PURE__ */ jsxs(NavLink, {
							to: tab.to,
							prefetch: "viewport",
							className: `flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold ${active ? "bg-red-50 text-red-600" : "text-slate-400"}`,
							children: [/* @__PURE__ */ jsx(Icon, {
								size: 22,
								strokeWidth: active ? 2.5 : 2
							}), /* @__PURE__ */ jsx("span", {
								className: "mt-1 leading-none",
								children: tab.label
							})]
						}, tab.to);
					})
				})
			}),
			/* @__PURE__ */ jsx("footer", {
				className: "mt-16 hidden border-t border-slate-200 bg-white md:block",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-7xl justify-between px-4 py-8 text-sm text-slate-500",
					children: [/* @__PURE__ */ jsx("p", { children: "© 2026 HSK Learning Platform" }), /* @__PURE__ */ jsx("p", { children: "Học theo lộ trình · Học HSK · Luyện quiz" })]
				})
			})
		]
	});
}
//#endregion
//#region app/lib/auth.server.ts
var auth_server_exports = /* @__PURE__ */ __exportAll({
	destroyUserSession: () => destroyUserSession,
	getSession: () => getSession,
	getUser: () => getUser,
	requireAdmin: () => requireAdmin,
	requireUser: () => requireUser,
	sessionStorage: () => sessionStorage
});
var sessionSecret = process.env.SESSION_SECRET?.trim();
if (process.env.NODE_ENV === "production" && !sessionSecret) throw new Error("Missing SESSION_SECRET in production environment.");
var sessionStorage = createCookieSessionStorage({ cookie: {
	name: "hsk_session",
	httpOnly: true,
	maxAge: 3600 * 24 * 7,
	path: "/",
	sameSite: "lax",
	secrets: [sessionSecret || "dev_secret_change_me"],
	secure: process.env.NODE_ENV === "production"
} });
async function getSession(request) {
	return sessionStorage.getSession(request.headers.get("Cookie"));
}
async function getUser(request) {
	const userId = (await getSession(request)).get("userId");
	if (!userId) return null;
	return prisma.user.findUnique({
		where: { id: String(userId) },
		select: {
			id: true,
			name: true,
			email: true,
			role: true
		}
	});
}
async function requireUser(request) {
	const user = await getUser(request);
	if (!user) throw redirect("/?auth=login");
	return user;
}
async function requireAdmin(request) {
	const user = await requireUser(request);
	if (user.role !== "ADMIN") throw redirect("/dashboard");
	return user;
}
function buildRedirectUrl(redirectTo, toast) {
	if (!toast?.message) return redirectTo;
	const url = new URL(redirectTo, "http://local.app");
	url.searchParams.set("toast", toast.message);
	url.searchParams.set("toastType", toast.type || "info");
	return `${url.pathname}${url.search}${url.hash}`;
}
async function destroyUserSession(request) {
	const session = await getSession(request);
	return redirect(buildRedirectUrl("/", {
		message: "Đăng xuất thành công.",
		type: "success"
	}), { headers: { "Set-Cookie": await sessionStorage.destroySession(session) } });
}
//#endregion
//#region app/routes/_index.tsx
var _index_exports = /* @__PURE__ */ __exportAll({
	default: () => _index_default,
	loader: () => loader$17
});
async function loader$17({ request }) {
	return {
		user: await getUser(request),
		featuredLessons: await prisma.lesson.findMany({
			where: { status: "PUBLISHED" },
			take: 6,
			include: {
				_count: { select: { vocabularies: true } },
				vocabularies: {
					take: 1,
					select: { imageUrl: true }
				}
			},
			orderBy: [{ level: "asc" }, { orderNo: "asc" }]
		}),
		sampleVocabularies: await prisma.vocabulary.findMany({
			take: 12,
			select: {
				id: true,
				chinese: true,
				pinyin: true,
				meaningVi: true,
				exampleChinese: true,
				exampleMeaning: true,
				level: true,
				imageUrl: true
			}
		}),
		stats: {
			totalLessons: await prisma.lesson.count({ where: { status: "PUBLISHED" } }),
			totalVocabularies: await prisma.vocabulary.count(),
			totalRoadmaps: await prisma.roadmapItem.count()
		}
	};
}
var _index_default = UNSAFE_withComponentProps(function Home({ loaderData }) {
	const { user, featuredLessons, sampleVocabularies, stats } = loaderData;
	const { openLogin, openRegister } = useAuth();
	const [vocabIndex, setVocabIndex] = useState(0);
	const currentVocabList = sampleVocabularies.length > 0 ? sampleVocabularies : [
		{
			chinese: "你好",
			pinyin: "nǐ hǎo",
			meaningVi: "Xin chào",
			exampleChinese: "你好，我叫小明。",
			exampleMeaning: "Xin chào, tôi tên là Tiểu Minh.",
			level: "HSK 1"
		},
		{
			chinese: "学习",
			pinyin: "xué xí",
			meaningVi: "Học tập",
			exampleChinese: "我很喜欢学习汉语。",
			exampleMeaning: "Tôi rất thích học tiếng Trung.",
			level: "HSK 1"
		},
		{
			chinese: "朋友",
			pinyin: "péng you",
			meaningVi: "Bạn bè",
			exampleChinese: "我们是好朋友。",
			exampleMeaning: "Chúng tôi là bạn tốt.",
			level: "HSK 2"
		}
	];
	const currentVocab = currentVocabList[vocabIndex % currentVocabList.length];
	const handleNextVocab = () => {
		setVocabIndex((prev) => (prev + 1) % currentVocabList.length);
	};
	const speakWord = (text) => {
		if (typeof window !== "undefined" && "speechSynthesis" in window) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = "zh-CN";
			utterance.rate = .85;
			window.speechSynthesis.speak(utterance);
		}
	};
	return /* @__PURE__ */ jsx(SiteLayout, {
		user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "bg-slate-50/60 pb-20",
			children: [
				/* @__PURE__ */ jsxs("section", {
					className: "relative overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white py-14 md:py-24 px-4",
					children: [
						/* @__PURE__ */ jsx("div", { className: "absolute -left-24 -top-24 h-96 w-96 rounded-full bg-rose-600/25 blur-3xl pointer-events-none" }),
						/* @__PURE__ */ jsx("div", { className: "absolute right-0 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" }),
						/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" }),
						/* @__PURE__ */ jsx("div", {
							className: "absolute right-10 top-1/2 -translate-y-1/2 text-9xl font-black text-white/[0.03] select-none pointer-events-none tracking-widest hidden xl:block",
							children: "中文学习"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "relative mx-auto max-w-7xl",
							children: /* @__PURE__ */ jsxs("div", {
								className: "grid gap-12 lg:grid-cols-12 lg:items-center",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "lg:col-span-7",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-rose-200 backdrop-blur border border-white/15 shadow-inner",
											children: [/* @__PURE__ */ jsx(Sparkles, {
												size: 15,
												className: "text-amber-400 animate-pulse"
											}), /* @__PURE__ */ jsx("span", { children: "Nền tảng học HSK & Lộ trình Tiếng Trung 2026" })]
										}),
										/* @__PURE__ */ jsxs("h1", {
											className: "mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight",
											children: [
												"Học Tiếng Trung ",
												/* @__PURE__ */ jsx("br", { className: "hidden sm:inline" }),
												/* @__PURE__ */ jsx("span", {
													className: "bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 bg-clip-text text-transparent",
													children: "Dễ Dàng & Hiệu Quả"
												})
											]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg",
											children: "Hệ thống bài học chuẩn hóa HSK 2.0 & 3.0 tích hợp lộ trình học bài bản, phiên âm Pinyin chuẩn, nghe phát âm và trắc nghiệm ghi nhớ thông minh."
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-8 flex flex-wrap items-center gap-3.5",
											children: [
												/* @__PURE__ */ jsxs(Link, {
													to: "/lessons",
													prefetch: "intent",
													className: "group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-950/30 transition-all hover:scale-105 hover:from-rose-500 hover:to-red-500",
													children: [
														/* @__PURE__ */ jsx(BookOpen, { size: 18 }),
														/* @__PURE__ */ jsx("span", { children: "Khám phá bài học" }),
														/* @__PURE__ */ jsx(ArrowRight, {
															size: 16,
															className: "transition-transform group-hover:translate-x-1"
														})
													]
												}),
												/* @__PURE__ */ jsxs(Link, {
													to: "/roadmap",
													prefetch: "intent",
													className: "inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur border border-white/20 transition-all hover:bg-white/20 hover:border-white/30",
													children: [/* @__PURE__ */ jsx(Map$1, {
														size: 18,
														className: "text-amber-400"
													}), /* @__PURE__ */ jsx("span", { children: "Lộ trình học" })]
												}),
												/* @__PURE__ */ jsxs(Link, {
													to: "/ai-practice",
													prefetch: "intent",
													className: "inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-rose-200 backdrop-blur border border-white/20 transition-all hover:bg-white/20",
													children: [/* @__PURE__ */ jsx(Bot, {
														size: 18,
														className: "text-rose-400"
													}), /* @__PURE__ */ jsx("span", { children: "Luyện cùng AI" })]
												})
											]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6",
											children: [
												/* @__PURE__ */ jsxs("div", {
													className: "flex items-center gap-2 text-xs font-semibold text-slate-300",
													children: [/* @__PURE__ */ jsx("span", { className: "flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" }), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
														className: "text-white text-sm font-black",
														children: stats.totalLessons
													}), " Bài học HSK"] })]
												}),
												/* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-white/10 hidden sm:block" }),
												/* @__PURE__ */ jsxs("div", {
													className: "flex items-center gap-2 text-xs font-semibold text-slate-300",
													children: [/* @__PURE__ */ jsx(BookMarked, {
														size: 16,
														className: "text-amber-400"
													}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
														className: "text-white text-sm font-black",
														children: stats.totalVocabularies
													}), " Từ vựng mẫu"] })]
												}),
												/* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-white/10 hidden sm:block" }),
												/* @__PURE__ */ jsxs("div", {
													className: "flex items-center gap-2 text-xs font-semibold text-slate-300",
													children: [/* @__PURE__ */ jsx(CheckCircle2, {
														size: 16,
														className: "text-rose-400"
													}), /* @__PURE__ */ jsx("span", { children: "Chuẩn HSK 2.0 & 3.0" })]
												})
											]
										})
									]
								}), /* @__PURE__ */ jsx("div", {
									className: "lg:col-span-5",
									children: /* @__PURE__ */ jsxs("div", {
										className: "group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-6 shadow-2xl backdrop-blur transition-all duration-300 hover:border-rose-500/40",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center justify-between border-b border-white/10 pb-4",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ jsx("span", { className: "flex h-3 w-3 rounded-full bg-rose-500" }), /* @__PURE__ */ jsx("span", {
														className: "text-xs font-bold uppercase tracking-wider text-rose-200",
														children: "Từ vựng học nhanh"
													})]
												}), currentVocab.level ? /* @__PURE__ */ jsx("span", {
													className: "rounded-xl bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30",
													children: currentVocab.level
												}) : null]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "my-6 text-center",
												children: [
													/* @__PURE__ */ jsx("h3", {
														className: "text-6xl font-black tracking-wide text-white drop-shadow-lg sm:text-7xl",
														children: currentVocab.chinese
													}),
													/* @__PURE__ */ jsx("p", {
														className: "mt-2 text-2xl font-bold text-rose-300",
														children: currentVocab.pinyin
													}),
													/* @__PURE__ */ jsx("p", {
														className: "mt-2 text-lg font-semibold text-slate-200",
														children: currentVocab.meaningVi
													}),
													/* @__PURE__ */ jsxs("button", {
														type: "button",
														onClick: () => speakWord(currentVocab.chinese),
														className: "mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur border border-white/15 transition hover:bg-rose-600 hover:border-rose-500",
														children: [/* @__PURE__ */ jsx(Volume2, {
															size: 16,
															className: "text-amber-300"
														}), /* @__PURE__ */ jsx("span", { children: "Phát âm Hán ngữ" })]
													})
												]
											}),
											currentVocab.exampleChinese ? /* @__PURE__ */ jsxs("div", {
												className: "rounded-2xl bg-white/5 p-4 border border-white/10 text-left",
												children: [
													/* @__PURE__ */ jsx("p", {
														className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
														children: "Ví dụ thực tế"
													}),
													/* @__PURE__ */ jsx("p", {
														className: "mt-1 text-sm font-bold text-white",
														children: currentVocab.exampleChinese
													}),
													/* @__PURE__ */ jsx("p", {
														className: "mt-0.5 text-xs text-slate-300",
														children: currentVocab.exampleMeaning
													})
												]
											}) : null,
											/* @__PURE__ */ jsxs("div", {
												className: "mt-5 flex items-center justify-between border-t border-white/10 pt-4",
												children: [/* @__PURE__ */ jsxs("span", {
													className: "text-xs font-medium text-slate-400",
													children: [
														"Từ ",
														vocabIndex % currentVocabList.length + 1,
														" / ",
														currentVocabList.length
													]
												}), /* @__PURE__ */ jsxs("button", {
													type: "button",
													onClick: handleNextVocab,
													className: "inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-rose-500",
													children: [/* @__PURE__ */ jsx(Shuffle, { size: 14 }), " Từ tiếp theo"]
												})]
											})
										]
									})
								})]
							})
						})
					]
				}),
				/* @__PURE__ */ jsx("section", {
					className: "mx-auto max-w-7xl px-4 -mt-8 relative z-20",
					children: /* @__PURE__ */ jsxs("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: [
							/* @__PURE__ */ jsx(LevelCard, {
								level: "HSK 1",
								title: "Nhập môn căn bản",
								desc: "Nắm vững 150-300 từ vựng ban đầu, mẫu câu giao tiếp cơ bản hằng ngày.",
								bgImg: "/images/hsk1.svg",
								color: "emerald",
								link: "/lessons?source=HSK20&level=HSK+1"
							}),
							/* @__PURE__ */ jsx(LevelCard, {
								level: "HSK 2",
								title: "Sơ cấp ứng dụng",
								desc: "Mở rộng 300-600 từ vựng, diễn đạt ý kiến và trao đổi thông tin cá nhân.",
								bgImg: "/images/hsk2.svg",
								color: "sky",
								link: "/lessons?source=HSK20&level=HSK+2"
							}),
							/* @__PURE__ */ jsx(LevelCard, {
								level: "HSK 3",
								title: "Trung cấp giao tiếp",
								desc: "Tích lũy 600-1000 từ vựng, tự tin hoàn thành các nhu cầu sinh hoạt & du lịch.",
								bgImg: "/images/hsk3.svg",
								color: "purple",
								link: "/lessons?source=HSK20&level=HSK+3"
							})
						]
					})
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "mx-auto max-w-7xl px-4 pt-16 md:pt-24",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "text-center max-w-3xl mx-auto",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-black text-slate-900 sm:text-4xl",
							children: "Tính Năng Học Tập Toàn Diện"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-3 text-slate-600 text-sm sm:text-base",
							children: "Được thiết kế tối ưu cho trải nghiệm học từ vựng, luyện nghe phát âm và kiểm tra kiến thức bài bản."
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ jsx(FeatureBox, {
								icon: BookOpen,
								title: "Bài Học HSK Chuẩn",
								desc: "Tổ chức từ vựng theo cấp độ HSK 2.0 & 3.0 giúp bạn học đúng mục tiêu.",
								color: "rose"
							}),
							/* @__PURE__ */ jsx(FeatureBox, {
								icon: Volume2,
								title: "Luyện Phát Âm Pinyin",
								desc: "Hỗ trợ nghe âm chuẩn Hán ngữ với tốc độ tùy chỉnh sinh động.",
								color: "amber"
							}),
							/* @__PURE__ */ jsx(FeatureBox, {
								icon: ListChecks,
								title: "Trắc Nghiệm Quiz",
								desc: "Củng cố kiến thức qua các bài quiz trắc nghiệm nhận diện mặt chữ & pinyin.",
								color: "emerald"
							}),
							/* @__PURE__ */ jsx(FeatureBox, {
								icon: BarChart3,
								title: "Lộ Trình Theo Lớp",
								desc: "Bám sát tiến độ học tập thực tế theo từng tuần và chặng học cần đạt.",
								color: "sky"
							})
						]
					})]
				}),
				featuredLessons.length > 0 ? /* @__PURE__ */ jsxs("section", {
					className: "mx-auto max-w-7xl px-4 pt-16 md:pt-24",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-2xl font-black text-slate-900 flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Flame, {
								className: "text-rose-600",
								size: 24
							}), /* @__PURE__ */ jsx("span", { children: "Bài Học Nổi Bật" })]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-slate-500 mt-1",
							children: "Bắt đầu bài học mới nhất được cập nhật trên hệ thống"
						})] }), /* @__PURE__ */ jsxs(Link, {
							to: "/lessons",
							prefetch: "intent",
							className: "inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition",
							children: ["Xem tất cả bài học ", /* @__PURE__ */ jsx(ArrowRight, { size: 14 })]
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
						children: featuredLessons.map((lesson) => /* @__PURE__ */ jsxs(Link, {
							to: `/lessons/${lesson.id}`,
							prefetch: "intent",
							className: "group overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl flex flex-col justify-between",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
										children: ["Bài ", lesson.orderNo]
									}), /* @__PURE__ */ jsx("span", {
										className: "rounded-xl bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600",
										children: lesson.level
									})]
								}),
								/* @__PURE__ */ jsx("h3", {
									className: "mt-4 text-lg font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors",
									children: lesson.title
								}),
								lesson.description ? /* @__PURE__ */ jsx("p", {
									className: "mt-2 line-clamp-2 text-xs text-slate-500",
									children: lesson.description
								}) : null
							] }), /* @__PURE__ */ jsxs("div", {
								className: "mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-500 group-hover:text-rose-600",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1 text-slate-400",
									children: [
										/* @__PURE__ */ jsx(BookMarked, {
											size: 14,
											className: "text-amber-500"
										}),
										lesson._count.vocabularies,
										" từ vựng"
									]
								}), /* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1",
									children: ["Học ngay ", /* @__PURE__ */ jsx(ArrowRight, {
										size: 14,
										className: "transition-transform group-hover:translate-x-1"
									})]
								})]
							})]
						}, lesson.id))
					})]
				}) : null,
				/* @__PURE__ */ jsx("section", {
					className: "mx-auto max-w-7xl px-4 pt-16 md:pt-24",
					children: /* @__PURE__ */ jsxs("div", {
						className: "relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 p-8 md:p-14 text-white shadow-2xl",
						children: [/* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" }), /* @__PURE__ */ jsxs("div", {
							className: "relative max-w-2xl",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur",
									children: [/* @__PURE__ */ jsx(Zap, {
										size: 14,
										className: "text-amber-300"
									}), " Khởi đầu ngay hôm nay"]
								}),
								/* @__PURE__ */ jsx("h2", {
									className: "mt-4 text-3xl font-black sm:text-4xl",
									children: "Sẵn Sàng Bắt Đầu Hành Trình Học Tiếng Trung?"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-3 text-sm sm:text-base text-rose-100 leading-relaxed",
									children: "Tạo tài khoản để theo dõi tiến độ học tập, lưu lại các từ vựng đã thuộc và chinh phục các cấp độ HSK."
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-8 flex flex-wrap items-center gap-4",
									children: [user ? /* @__PURE__ */ jsxs(Link, {
										to: "/lessons",
										prefetch: "intent",
										className: "inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-rose-700 shadow-lg transition hover:bg-rose-50",
										children: [/* @__PURE__ */ jsx(GraduationCap, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "Vào học ngay" })]
									}) : /* @__PURE__ */ jsxs("button", {
										onClick: openRegister,
										className: "inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-rose-700 shadow-lg transition hover:bg-rose-50",
										children: [/* @__PURE__ */ jsx(GraduationCap, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "Tạo tài khoản miễn phí" })]
									}), !user ? /* @__PURE__ */ jsx("button", {
										onClick: openLogin,
										className: "inline-flex items-center gap-2 rounded-2xl bg-rose-900/40 px-6 py-3.5 text-sm font-bold text-white backdrop-blur border border-white/20 hover:bg-rose-900/60",
										children: "Đăng nhập"
									}) : null]
								})
							]
						})]
					})
				})
			]
		})
	});
});
function LevelCard({ level, title, desc, bgImg, color, link }) {
	return /* @__PURE__ */ jsxs(Link, {
		to: link,
		prefetch: "intent",
		className: "group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "relative h-32 w-full overflow-hidden rounded-2xl bg-slate-900 mb-5",
				children: [
					/* @__PURE__ */ jsx("img", {
						src: bgImg,
						alt: level,
						className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
					}),
					/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" }),
					/* @__PURE__ */ jsx("div", {
						className: "absolute top-3 left-3",
						children: /* @__PURE__ */ jsx("span", {
							className: "rounded-xl bg-slate-950/80 px-3 py-1 text-xs font-black text-white backdrop-blur border border-white/10",
							children: level
						})
					})
				]
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-xs leading-relaxed text-slate-500",
				children: desc
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-rose-600",
				children: [/* @__PURE__ */ jsx("span", { children: "Vào bài học" }), /* @__PURE__ */ jsx(ArrowRight, {
					size: 14,
					className: "transition-transform group-hover:translate-x-1"
				})]
			})
		]
	});
}
function FeatureBox({ icon: Icon, title, desc, color }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300",
				children: /* @__PURE__ */ jsx(Icon, { size: 24 })
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-5 text-lg font-extrabold text-slate-900",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-xs leading-relaxed text-slate-500",
				children: desc
			})
		]
	});
}
//#endregion
//#region app/components/CustomSelect.tsx
function CustomSelect({ value, onChange, options, placeholder = "Tất cả", focusColor = "focus:border-red-400 focus:ring-red-100" }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	useEffect(() => {
		if (!open) return;
		const handle = (e) => {
			if (!ref.current?.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [open]);
	const current = options.find((o) => o.value === value);
	const label = current?.label || placeholder;
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "relative w-full",
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => setOpen((p) => !p),
			className: `min-h-12 w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition ${focusColor} focus:ring-4`,
			children: [/* @__PURE__ */ jsx("span", {
				className: current ? "text-slate-700" : "text-slate-400",
				children: label
			}), /* @__PURE__ */ jsx(ChevronDown, {
				size: 18,
				className: `text-slate-400 transition-transform ${open ? "rotate-180" : ""}`
			})]
		}), open ? /* @__PURE__ */ jsx("div", {
			className: "absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
			children: options.map((opt) => /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => {
					onChange(opt.value);
					setOpen(false);
				},
				className: `w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-slate-50 ${opt.value === value ? "bg-red-50 text-red-600" : "text-slate-700"}`,
				children: opt.label
			}, opt.value))
		}) : null]
	});
}
//#endregion
//#region app/routes/hsk20.tsx
var hsk20_exports = /* @__PURE__ */ __exportAll({
	default: () => hsk20_default,
	loader: () => loader$16
});
async function loader$16({ request }) {
	const url = new URL(request.url);
	const level = url.searchParams.get("level") || "";
	const q = url.searchParams.get("q") || "";
	const allLessons = await prisma.lesson.findMany({
		where: {
			status: "PUBLISHED",
			source: "HSK20"
		},
		orderBy: [{ level: "asc" }, { orderNo: "asc" }]
	});
	const levels = [...new Set(allLessons.map((l) => l.level).filter(Boolean))].sort();
	const filteredLessons = await prisma.lesson.findMany({
		where: {
			status: "PUBLISHED",
			source: "HSK20",
			...level ? { level } : {},
			...q ? { OR: [{ title: {
				contains: q,
				mode: "insensitive"
			} }, { description: {
				contains: q,
				mode: "insensitive"
			} }] } : {}
		},
		include: { _count: { select: { vocabularies: true } } },
		orderBy: [{ level: "asc" }, { orderNo: "asc" }]
	});
	return {
		user: await getUser(request),
		lessons: filteredLessons,
		levels,
		q,
		level
	};
}
var hsk20_default = UNSAFE_withComponentProps(function HSK20Page({ loaderData }) {
	const [params, setParams] = useSearchParams();
	const { lessons, levels, q, level } = loaderData;
	const setLevel = (lvl) => {
		const next = new URLSearchParams(params);
		if (lvl) next.set("level", lvl);
		else next.delete("level");
		setParams(next);
	};
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-7xl px-4 py-6 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-11 w-11 items-center justify-center rounded-full bg-red-50",
							children: /* @__PURE__ */ jsx(BookOpen, {
								size: 20,
								className: "text-red-600"
							})
						}), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", {
							className: "text-3xl font-black text-slate-900",
							children: "HSK 2.0"
						}) })]
					}) }), /* @__PURE__ */ jsxs("div", {
						className: "grid w-full grid-cols-[minmax(0,1fr)_10rem] gap-3 md:w-auto md:min-w-[34rem] md:items-end md:justify-end",
						children: [/* @__PURE__ */ jsx("label", {
							className: "min-w-0",
							children: /* @__PURE__ */ jsxs("form", {
								className: "relative w-full",
								children: [
									/* @__PURE__ */ jsx(Search, {
										className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400",
										size: 18
									}),
									/* @__PURE__ */ jsx("input", {
										name: "q",
										defaultValue: q,
										placeholder: "Tìm bài học...",
										className: "min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
									}),
									q ? /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => {
											const next = new URLSearchParams(params);
											next.delete("q");
											setParams(next);
										},
										className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600",
										children: /* @__PURE__ */ jsx(X, { size: 16 })
									}) : null
								]
							})
						}), levels.length > 0 ? /* @__PURE__ */ jsx(CustomSelect, {
							value: level,
							onChange: setLevel,
							options: [{
								value: "",
								label: "Tất cả"
							}, ...levels.map((lvl) => ({
								value: lvl,
								label: lvl
							}))],
							focusColor: "focus:border-red-400 focus:ring-red-100"
						}) : null]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: lessons.map((lesson) => /* @__PURE__ */ jsxs(Link, {
						to: `/lessons/${lesson.id}`,
						className: "group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md h-56",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("span", {
									className: "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600",
									children: lesson.level
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-xs font-bold text-slate-400",
									children: ["Bài ", lesson.orderNo]
								})]
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-4 text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors",
								children: lesson.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 line-clamp-2 text-sm leading-6 text-slate-500",
								children: lesson.description || "Bài học HSK 2.0."
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-auto flex items-center justify-between border-t border-slate-100 pt-4",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "text-sm font-semibold text-slate-400",
									children: [lesson._count.vocabularies, " từ vựng"]
								}), /* @__PURE__ */ jsx(ArrowRight, {
									size: 18,
									className: "text-red-400 group-hover:text-red-600 transition-colors"
								})]
							})
						]
					}, lesson.id))
				}),
				lessons.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "mt-12 text-center",
					children: [/* @__PURE__ */ jsx(BookOpen, {
						size: 48,
						className: "mx-auto text-slate-300"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-slate-500",
						children: "Chưa có bài học phù hợp."
					})]
				}) : null
			]
		})
	});
});
//#endregion
//#region app/routes/hsk30.tsx
var hsk30_exports = /* @__PURE__ */ __exportAll({
	default: () => hsk30_default,
	loader: () => loader$15
});
async function loader$15({ request }) {
	const url = new URL(request.url);
	const level = url.searchParams.get("level") || "";
	const q = url.searchParams.get("q") || "";
	const allLessons = await prisma.lesson.findMany({
		where: {
			status: "PUBLISHED",
			source: "HSK30"
		},
		orderBy: [{ level: "asc" }, { orderNo: "asc" }]
	});
	const levels = [...new Set(allLessons.map((l) => l.level).filter(Boolean))].sort();
	const filteredLessons = await prisma.lesson.findMany({
		where: {
			status: "PUBLISHED",
			source: "HSK30",
			...level ? { level } : {},
			...q ? { OR: [{ title: {
				contains: q,
				mode: "insensitive"
			} }, { description: {
				contains: q,
				mode: "insensitive"
			} }] } : {}
		},
		include: { _count: { select: { vocabularies: true } } },
		orderBy: [{ level: "asc" }, { orderNo: "asc" }]
	});
	return {
		user: await getUser(request),
		lessons: filteredLessons,
		levels,
		q,
		level
	};
}
var hsk30_default = UNSAFE_withComponentProps(function HSK30Page({ loaderData }) {
	const data = loaderData;
	const [params, setParams] = useSearchParams();
	const { lessons, levels, q, level } = data;
	const setLevel = (lvl) => {
		const next = new URLSearchParams(params);
		if (lvl) next.set("level", lvl);
		else next.delete("level");
		setParams(next);
	};
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: data.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-7xl px-4 py-6 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-11 w-11 items-center justify-center rounded-full bg-amber-50",
							children: /* @__PURE__ */ jsx(Sparkles, {
								size: 20,
								className: "text-amber-600"
							})
						}), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", {
							className: "text-3xl font-black text-slate-900",
							children: "HSK 3.0"
						}) })]
					}) }), /* @__PURE__ */ jsxs("div", {
						className: "grid w-full grid-cols-[minmax(0,1fr)_10rem] gap-3 md:w-auto md:min-w-[34rem] md:items-end md:justify-end",
						children: [/* @__PURE__ */ jsx("label", {
							className: "min-w-0",
							children: /* @__PURE__ */ jsxs("form", {
								className: "relative w-full",
								children: [
									/* @__PURE__ */ jsx(Search, {
										className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400",
										size: 18
									}),
									/* @__PURE__ */ jsx("input", {
										name: "q",
										defaultValue: q,
										placeholder: "Tìm bài học...",
										className: "min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
									}),
									q ? /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => {
											const next = new URLSearchParams(params);
											next.delete("q");
											setParams(next);
										},
										className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600",
										children: /* @__PURE__ */ jsx(X, { size: 16 })
									}) : null
								]
							})
						}), levels.length > 0 ? /* @__PURE__ */ jsx(CustomSelect, {
							value: level,
							onChange: setLevel,
							options: [{
								value: "",
								label: "Tất cả"
							}, ...levels.map((lvl) => ({
								value: lvl,
								label: lvl
							}))],
							focusColor: "focus:border-amber-400 focus:ring-amber-100"
						}) : null]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: lessons.map((lesson) => /* @__PURE__ */ jsxs(Link, {
						to: `/lessons/${lesson.id}`,
						className: "group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md h-56",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("span", {
									className: "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700",
									children: lesson.level
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-xs font-bold text-slate-400",
									children: ["Buổi ", lesson.orderNo]
								})]
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-4 text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors",
								children: lesson.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 line-clamp-2 text-sm leading-6 text-slate-500",
								children: lesson.description || "Bài học HSK 3.0."
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-auto flex items-center justify-between border-t border-slate-100 pt-4",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "text-sm font-semibold text-slate-400",
									children: [lesson._count.vocabularies, " từ vựng"]
								}), /* @__PURE__ */ jsx(ArrowRight, {
									size: 18,
									className: "text-amber-400 group-hover:text-amber-600 transition-colors"
								})]
							})
						]
					}, lesson.id))
				}),
				lessons.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "mt-12 text-center",
					children: [/* @__PURE__ */ jsx(Sparkles, {
						size: 48,
						className: "mx-auto text-slate-300"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-slate-500",
						children: "Chưa có bài học phù hợp."
					})]
				}) : null
			]
		})
	});
});
//#endregion
//#region app/routes/lessons._index.tsx
var lessons__index_exports = /* @__PURE__ */ __exportAll({
	default: () => lessons__index_default,
	loader: () => loader$14
});
async function loader$14({ request }) {
	const url = new URL(request.url);
	const source = url.searchParams.get("source") || "HSK20";
	const level = url.searchParams.get("level") || "";
	const q = url.searchParams.get("q") || "";
	const [user, lessons, lessonsForStats] = await Promise.all([
		getUser(request),
		prisma.lesson.findMany({
			where: {
				status: "PUBLISHED",
				source,
				...level ? { level } : {},
				...q ? { title: {
					contains: q,
					mode: "insensitive"
				} } : {}
			},
			include: {
				_count: { select: { vocabularies: true } },
				vocabularies: {
					take: 3,
					orderBy: { createdAt: "asc" }
				}
			},
			orderBy: [{ level: "asc" }, { orderNo: "asc" }]
		}),
		prisma.lesson.findMany({
			where: {
				status: "PUBLISHED",
				source
			},
			select: {
				level: true,
				_count: { select: { vocabularies: true } },
				vocabularies: {
					where: { imageUrl: { not: null } },
					take: 3,
					orderBy: { createdAt: "asc" },
					select: { imageUrl: true }
				}
			},
			orderBy: [{ level: "asc" }, { orderNo: "asc" }]
		})
	]);
	const statsByLevel = /* @__PURE__ */ new Map();
	for (const lesson of lessonsForStats) {
		const stat = statsByLevel.get(lesson.level) || {
			level: lesson.level,
			lessonCount: 0,
			wordCount: 0,
			sampleImages: []
		};
		stat.lessonCount += 1;
		stat.wordCount += lesson._count.vocabularies;
		for (const vocab of lesson.vocabularies) if (vocab.imageUrl && stat.sampleImages.length < 3) stat.sampleImages.push(vocab.imageUrl);
		statsByLevel.set(lesson.level, stat);
	}
	const levels = [...statsByLevel.keys()];
	const levelStats = [...statsByLevel.values()];
	return {
		user,
		lessons,
		levels,
		levelStats,
		source,
		level,
		q,
		totalLessonsInSource: levelStats.reduce((acc, curr) => acc + curr.lessonCount, 0),
		totalWordsInSource: levelStats.reduce((acc, curr) => acc + curr.wordCount, 0)
	};
}
var LEVEL_STYLES = {
	"HSK 1": {
		bg: "bg-emerald-50 hover:bg-emerald-100/60",
		border: "border-emerald-200 hover:border-emerald-400",
		text: "text-emerald-700",
		badge: "bg-emerald-500 text-white",
		gradient: "from-emerald-600 to-teal-700",
		defaultImage: "/images/hsk1.svg"
	},
	"HSK 2": {
		bg: "bg-sky-50 hover:bg-sky-100/60",
		border: "border-sky-200 hover:border-sky-400",
		text: "text-sky-700",
		badge: "bg-sky-500 text-white",
		gradient: "from-sky-600 to-blue-700",
		defaultImage: "/images/hsk2.svg"
	},
	"HSK 3": {
		bg: "bg-indigo-50 hover:bg-indigo-100/60",
		border: "border-indigo-200 hover:border-indigo-400",
		text: "text-indigo-700",
		badge: "bg-indigo-500 text-white",
		gradient: "from-indigo-600 to-violet-700",
		defaultImage: "/images/hsk3.svg"
	},
	"HSK 4": {
		bg: "bg-amber-50 hover:bg-amber-100/60",
		border: "border-amber-200 hover:border-amber-400",
		text: "text-amber-700",
		badge: "bg-amber-500 text-white",
		gradient: "from-amber-500 to-orange-600",
		defaultImage: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80"
	},
	"HSK 5": {
		bg: "bg-rose-50 hover:bg-rose-100/60",
		border: "border-rose-200 hover:border-rose-400",
		text: "text-rose-700",
		badge: "bg-rose-500 text-white",
		gradient: "from-rose-600 to-red-700",
		defaultImage: "/images/hsk_advanced.png"
	},
	"HSK 6": {
		bg: "bg-purple-50 hover:bg-purple-100/60",
		border: "border-purple-200 hover:border-purple-400",
		text: "text-purple-700",
		badge: "bg-purple-600 text-white",
		gradient: "from-purple-600 to-fuchsia-700",
		defaultImage: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80"
	}
};
function getLevelStyle(lvl) {
	const normalized = lvl.trim();
	if (LEVEL_STYLES[normalized]) return LEVEL_STYLES[normalized];
	return {
		bg: "bg-red-50 hover:bg-red-100/60",
		border: "border-red-200 hover:border-red-400",
		text: "text-red-700",
		badge: "bg-red-600 text-white",
		gradient: "from-red-600 to-rose-700",
		defaultImage: "/images/hsk_advanced.png"
	};
}
var lessons__index_default = UNSAFE_withComponentProps(function Lessons({ loaderData }) {
	const [params, setParams] = useSearchParams();
	const { lessons, levels, levelStats, source, level, q, totalLessonsInSource, totalWordsInSource } = loaderData;
	const setSource = (s) => {
		const next = new URLSearchParams(params);
		next.set("source", s);
		next.delete("level");
		setParams(next);
	};
	const setLevel = (lvl) => {
		const next = new URLSearchParams(params);
		lvl ? next.set("level", lvl) : next.delete("level");
		setParams(next);
	};
	const clearSearch = () => {
		const next = new URLSearchParams(params);
		next.delete("q");
		setParams(next);
	};
	const showAll = !level;
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("div", {
			className: "min-h-screen bg-slate-50/50 pb-16",
			children: [/* @__PURE__ */ jsxs("section", {
				className: "relative overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-white py-12 md:py-20 px-4",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "absolute left-8 top-1/2 -translate-y-1/2 text-9xl font-black text-white/[0.03] select-none pointer-events-none tracking-widest hidden lg:block",
						children: "汉语水平考试"
					}),
					/* @__PURE__ */ jsx("div", { className: "absolute -left-20 -top-20 h-96 w-96 rounded-full bg-rose-600/25 blur-3xl pointer-events-none" }),
					/* @__PURE__ */ jsx("div", { className: "absolute right-10 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" }),
					/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" }),
					/* @__PURE__ */ jsx("div", {
						className: "relative mx-auto max-w-7xl",
						children: /* @__PURE__ */ jsxs("div", {
							className: "grid gap-10 lg:grid-cols-12 lg:items-center",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "lg:col-span-7",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-rose-200 backdrop-blur border border-white/15 shadow-inner",
										children: [/* @__PURE__ */ jsx(Sparkles, {
											size: 15,
											className: "text-amber-400 animate-pulse"
										}), /* @__PURE__ */ jsx("span", { children: "Hệ Thống Học Từ Vựng HSK Chuẩn Hóa" })]
									}),
									/* @__PURE__ */ jsxs("h1", {
										className: "mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight",
										children: [
											"Chinh Phục ",
											/* @__PURE__ */ jsx("span", {
												className: "bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 bg-clip-text text-transparent",
												children: "HSK Từ Vựng"
											}),
											" Dễ Dàng"
										]
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-3 text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl",
										children: "Luyện ghi nhớ từ vựng, chữ Hán và phiên âm pinyin theo từng bài học cấu trúc từ dễ đến nâng cao."
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-6 max-w-xl",
										children: /* @__PURE__ */ jsxs("form", {
											className: "relative",
											children: [
												/* @__PURE__ */ jsx(Search, {
													className: "absolute left-4 top-1/2 -translate-y-1/2 text-rose-400",
													size: 20
												}),
												/* @__PURE__ */ jsx("input", {
													name: "q",
													defaultValue: q,
													placeholder: "Tìm bài học (VD: Bài 1, Gia đình, Công việc...)",
													className: "w-full rounded-2xl border border-white/20 bg-white/15 py-4 pl-12 pr-12 text-sm text-white placeholder-slate-400 backdrop-blur shadow-2xl transition duration-200 focus:border-rose-400 focus:bg-slate-900/90 focus:outline-none focus:ring-4 focus:ring-rose-500/20"
												}),
												q ? /* @__PURE__ */ jsx("button", {
													type: "button",
													onClick: clearSearch,
													className: "absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1 text-slate-300 hover:bg-white/30 hover:text-white",
													children: /* @__PURE__ */ jsx(X, { size: 16 })
												}) : null
											]
										})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-8 flex flex-wrap items-center gap-3",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm",
												children: [/* @__PURE__ */ jsx(BookOpen, {
													size: 18,
													className: "text-rose-400"
												}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
													className: "text-white text-sm font-black",
													children: totalLessonsInSource
												}), " Bài học"] })]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm",
												children: [/* @__PURE__ */ jsx(BookMarked, {
													size: 18,
													className: "text-amber-400"
												}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
													className: "text-white text-sm font-black",
													children: totalWordsInSource
												}), " Từ vựng"] })]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm",
												children: [/* @__PURE__ */ jsx(Layers, {
													size: 18,
													className: "text-emerald-400"
												}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
													className: "text-white text-sm font-black",
													children: levelStats.length
												}), " Cấp độ"] })]
											})
										]
									})
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "lg:col-span-5",
								children: /* @__PURE__ */ jsx("div", {
									className: "group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-2 shadow-2xl backdrop-blur transition-all duration-500 hover:border-rose-500/50 hover:shadow-rose-950/40",
									children: /* @__PURE__ */ jsxs("div", {
										className: "relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950",
										children: [
											/* @__PURE__ */ jsx("img", {
												src: "/images/hsk_hero.png",
												alt: "HSK Study Sanctuary 3D Illustration",
												className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
											}),
											/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" }),
											/* @__PURE__ */ jsx("div", {
												className: "absolute top-4 left-4",
												children: /* @__PURE__ */ jsxs("span", {
													className: "inline-flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-black text-amber-300 backdrop-blur border border-amber-500/30 shadow-lg",
													children: [/* @__PURE__ */ jsx(Flame, {
														size: 14,
														className: "text-amber-400"
													}), " Tiêu Chuẩn HSK 2026"]
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute bottom-4 left-4 right-4",
												children: /* @__PURE__ */ jsxs("div", {
													className: "flex items-center justify-between rounded-xl bg-slate-900/80 p-3 backdrop-blur border border-white/10",
													children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
														className: "text-xs font-bold text-white",
														children: "Lộ trình bài học bài bản"
													}), /* @__PURE__ */ jsx("p", {
														className: "text-[11px] text-slate-400",
														children: "Tự động lưu tiến độ & flashcard"
													})] }), /* @__PURE__ */ jsx("span", {
														className: "flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-md",
														children: /* @__PURE__ */ jsx(GraduationCap, { size: 18 })
													})]
												})
											})
										]
									})
								})
							})]
						})
					})
				]
			}), /* @__PURE__ */ jsxs("main", {
				className: "mx-auto max-w-7xl px-4 pt-8",
				children: [
					showAll && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "inline-flex rounded-2xl bg-slate-200/70 p-1.5 shadow-inner",
							children: [/* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => setSource("HSK20"),
								className: `flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${source === "HSK20" ? "bg-white text-rose-600 shadow-md shadow-rose-950/5 scale-[1.02]" : "text-slate-600 hover:text-slate-900"}`,
								children: [/* @__PURE__ */ jsx(BookOpen, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "HSK 2.0" })]
							}), /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => setSource("HSK30"),
								className: `flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${source === "HSK30" ? "bg-white text-rose-600 shadow-md shadow-rose-950/5 scale-[1.02]" : "text-slate-600 hover:text-slate-900"}`,
								children: [/* @__PURE__ */ jsx(Sparkles, {
									size: 18,
									className: "text-amber-500"
								}), /* @__PURE__ */ jsx("span", { children: "HSK 3.0" })]
							})]
						}), levels.length > 0 && /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1",
									children: [/* @__PURE__ */ jsx(Filter, { size: 14 }), " Cấp độ:"]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setLevel(""),
									className: `shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${!level ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`,
									children: "Tất cả"
								}),
								levels.map((lvl) => {
									const isSelected = level === lvl;
									const lvlStyle = getLevelStyle(lvl);
									return /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => setLevel(lvl),
										className: `shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition border ${isSelected ? `${lvlStyle.badge} border-transparent shadow-sm scale-105` : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`,
										children: lvl
									}, lvl);
								})
							]
						})]
					}),
					q && /* @__PURE__ */ jsxs("div", {
						className: "mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(Search, {
								size: 16,
								className: "text-amber-600"
							}), /* @__PURE__ */ jsxs("span", { children: [
								"Kết quả tìm kiếm cho: ",
								/* @__PURE__ */ jsxs("strong", {
									className: "font-bold",
									children: [
										"\"",
										q,
										"\""
									]
								}),
								" (",
								lessons.length,
								" bài học)"
							] })]
						}), /* @__PURE__ */ jsx("button", {
							onClick: clearSearch,
							className: "text-xs font-semibold text-amber-700 underline hover:text-amber-900",
							children: "Xóa tìm kiếm"
						})]
					}),
					showAll ? /* @__PURE__ */ jsxs("div", {
						className: "mt-8",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ jsxs("h2", {
								className: "text-xl font-bold text-slate-800 flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(GraduationCap, {
									className: "text-rose-600",
									size: 22
								}), /* @__PURE__ */ jsx("span", { children: "Chọn cấp độ bài học" })]
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-xs font-medium text-slate-500",
								children: [
									"Hiển thị ",
									levelStats.length,
									" cấp độ"
								]
							})]
						}), levelStats.length === 0 ? /* @__PURE__ */ jsxs("div", {
							className: "mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm",
							children: [
								/* @__PURE__ */ jsx(BookOpen, {
									size: 48,
									className: "mx-auto text-slate-300 mb-3"
								}),
								/* @__PURE__ */ jsx("h3", {
									className: "text-lg font-bold text-slate-700",
									children: "Chưa có bài học nào"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-sm text-slate-500",
									children: "Vui lòng chọn nguồn HSK khác hoặc thử lại sau."
								})
							]
						}) : /* @__PURE__ */ jsx("div", {
							className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
							children: levelStats.map((stat) => {
								const lvlStyle = getLevelStyle(stat.level);
								return /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => setLevel(stat.level),
									className: `group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${lvlStyle.border}`,
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "relative -mx-6 -mt-6 mb-5 h-40 overflow-hidden bg-slate-900",
											children: [
												stat.sampleImages.length > 0 ? /* @__PURE__ */ jsxs("div", {
													className: "flex h-full w-full gap-0.5",
													children: [stat.sampleImages.map((img, i) => /* @__PURE__ */ jsx("img", {
														src: img,
														alt: "",
														className: "h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110"
													}, i)), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" })]
												}) : /* @__PURE__ */ jsxs("div", {
													className: "relative h-full w-full",
													children: [/* @__PURE__ */ jsx("img", {
														src: lvlStyle.defaultImage,
														alt: stat.level,
														className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
													}), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/20" })]
												}),
												/* @__PURE__ */ jsx("div", {
													className: "absolute top-4 left-4 z-10",
													children: /* @__PURE__ */ jsxs("span", {
														className: `inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black shadow-md ${lvlStyle.badge}`,
														children: [
															/* @__PURE__ */ jsx(Flame, { size: 13 }),
															" ",
															stat.level
														]
													})
												}),
												/* @__PURE__ */ jsx("div", {
													className: "absolute right-4 bottom-3 z-10",
													children: /* @__PURE__ */ jsx("span", {
														className: "text-xl font-black text-white/90 drop-shadow-md",
														children: stat.level
													})
												})
											]
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ jsxs("h3", {
												className: "text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors",
												children: ["Cấp độ ", stat.level]
											}), /* @__PURE__ */ jsx("div", {
												className: "flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-200",
												children: /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-left",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
												className: "text-[11px] font-semibold text-slate-400 uppercase tracking-wider",
												children: "Bài học"
											}), /* @__PURE__ */ jsxs("p", {
												className: "text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1",
												children: [
													/* @__PURE__ */ jsx(BookOpen, {
														size: 15,
														className: "text-rose-500"
													}),
													stat.lessonCount,
													" bài"
												]
											})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
												className: "text-[11px] font-semibold text-slate-400 uppercase tracking-wider",
												children: "Từ vựng"
											}), /* @__PURE__ */ jsxs("p", {
												className: "text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1",
												children: [
													/* @__PURE__ */ jsx(BookMarked, {
														size: 15,
														className: "text-amber-500"
													}),
													stat.wordCount,
													" từ"
												]
											})] })]
										})] }),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 group-hover:text-rose-600",
											children: [/* @__PURE__ */ jsx("span", { children: "Khám phá các bài học" }), /* @__PURE__ */ jsxs("span", {
												className: "flex items-center gap-1",
												children: ["Xem ngay ", /* @__PURE__ */ jsx(ArrowRight, {
													size: 14,
													className: "transition-transform group-hover:translate-x-1"
												})]
											})]
										})
									]
								}, stat.level);
							})
						})]
					}) : /* @__PURE__ */ jsxs("div", {
						className: "mt-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => setLevel(""),
										className: "inline-flex items-center gap-1.5 bg-transparent px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:text-slate-900",
										children: /* @__PURE__ */ jsx(ChevronLeft, { size: 16 })
									}),
									/* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-slate-200" }),
									/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", {
										className: "text-2xl font-black text-slate-900 flex items-center gap-2",
										children: [/* @__PURE__ */ jsx("span", { children: "Danh sách bài học" }), /* @__PURE__ */ jsx("span", {
											className: `rounded-xl px-3 py-0.5 text-xs font-bold ${getLevelStyle(level).badge}`,
											children: level
										})]
									}) })
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-xs font-semibold text-slate-500",
								children: [
									"Hiển thị ",
									/* @__PURE__ */ jsx("strong", {
										className: "text-slate-900",
										children: lessons.length
									}),
									" bài học"
								]
							})]
						}), lessons.length === 0 ? /* @__PURE__ */ jsxs("div", {
							className: "mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm",
							children: [
								/* @__PURE__ */ jsx(BookOpen, {
									size: 48,
									className: "mx-auto text-slate-300 mb-3"
								}),
								/* @__PURE__ */ jsx("h3", {
									className: "text-lg font-bold text-slate-700",
									children: "Không tìm thấy bài học nào"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-sm text-slate-500",
									children: "Thử tìm kiếm với từ khóa khác hoặc bỏ lọc cấp độ."
								}),
								/* @__PURE__ */ jsx("button", {
									onClick: () => setLevel(""),
									className: "mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800"
								})
							]
						}) : /* @__PURE__ */ jsx("div", {
							className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
							children: lessons.map((lesson, idx) => {
								const images = (lesson.vocabularies || []).filter((v) => v.imageUrl).map((v) => v.imageUrl);
								getLevelStyle(lesson.level);
								return /* @__PURE__ */ jsxs(Link, {
									to: `/lessons/${lesson.id}`,
									prefetch: "intent",
									className: "group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
										className: "relative h-40 w-full overflow-hidden bg-slate-900",
										children: [
											images.length > 0 ? /* @__PURE__ */ jsxs("div", {
												className: "flex h-full w-full gap-0.5",
												children: [images.map((img, i) => /* @__PURE__ */ jsx("img", {
													src: img,
													alt: "",
													className: "h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110"
												}, i)), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" })]
											}) : /* @__PURE__ */ jsxs("div", {
												className: "relative h-full w-full",
												children: [/* @__PURE__ */ jsx("img", {
													src: "/images/hsk_intermediate.png",
													alt: lesson.title,
													className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
												}), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10" })]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute top-3 left-3 z-10",
												children: /* @__PURE__ */ jsxs("span", {
													className: "inline-flex items-center rounded-xl bg-slate-900/85 px-3 py-1 text-xs font-extrabold text-white backdrop-blur shadow-md border border-white/10",
													children: ["Bài ", lesson.orderNo < 10 ? `0${lesson.orderNo}` : lesson.orderNo]
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute top-3 right-3 z-10",
												children: /* @__PURE__ */ jsxs("span", {
													className: "inline-flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 backdrop-blur shadow-md",
													children: [
														/* @__PURE__ */ jsx(BookMarked, {
															size: 13,
															className: "text-rose-500"
														}),
														lesson._count?.vocabularies || 0,
														" từ"
													]
												})
											})
										]
									}), /* @__PURE__ */ jsxs("div", {
										className: "p-5",
										children: [
											/* @__PURE__ */ jsx("h3", {
												className: "text-lg font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1",
												children: lesson.title
											}),
											lesson.description ? /* @__PURE__ */ jsx("p", {
												className: "mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500",
												children: lesson.description
											}) : /* @__PURE__ */ jsxs("p", {
												className: "mt-2 text-xs italic text-slate-400",
												children: ["Bài học thuộc cấp độ ", lesson.level]
											}),
											lesson.vocabularies && lesson.vocabularies.length > 0 && /* @__PURE__ */ jsx("div", {
												className: "mt-4 flex flex-wrap gap-1.5",
												children: lesson.vocabularies.map((v) => /* @__PURE__ */ jsxs("span", {
													className: "rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60",
													children: [
														v.word,
														" ",
														v.pinyin ? `(${v.pinyin})` : ""
													]
												}, v.id))
											})
										]
									})] }), /* @__PURE__ */ jsxs("div", {
										className: "mx-5 mb-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-600 group-hover:text-rose-600",
										children: [/* @__PURE__ */ jsxs("span", {
											className: "flex items-center gap-1 text-slate-400",
											children: [
												/* @__PURE__ */ jsx(CheckCircle2, {
													size: 14,
													className: "text-emerald-500"
												}),
												" Tiêu chuẩn ",
												lesson.source
											]
										}), /* @__PURE__ */ jsxs("span", {
											className: "flex items-center gap-1",
											children: ["Bắt đầu học ", /* @__PURE__ */ jsx(ArrowRight, {
												size: 14,
												className: "transition-transform group-hover:translate-x-1"
											})]
										})]
									})]
								}, lesson.id);
							})
						})]
					})
				]
			})]
		})
	});
});
//#endregion
//#region app/components/BookFlip.tsx
function makePageHtml(page, isExample) {
	if (!isExample) return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;background:linear-gradient(135deg,#fefefe,#fdfaf5);box-sizing:border-box;font-family:Inter,sans-serif;"><p style="margin:0;font-size:clamp(42px,6vw,72px);font-weight:900;color:#dc2626;text-align:center;">${page.chinese}</p><p style="margin:8px 0 0;font-size:clamp(14px,2vw,20px);font-weight:600;color:#334155;">${page.pinyin}</p><p style="margin:12px 0 0;font-size:clamp(13px,1.8vw,18px);font-weight:700;color:#1e293b;background:#fef3c7;padding:4px 18px;border-radius:8px;">${page.meaningVi}</p></div>`;
	if (!page.exampleChinese) return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:linear-gradient(225deg,#fefefe,#fdfaf5);box-sizing:border-box;font-family:Inter,sans-serif;"><p style="font-size:clamp(28px,4vw,42px);font-weight:900;color:#dc2626;">${page.chinese}</p><p style="margin:4px 0;font-size:clamp(13px,2vw,16px);font-weight:600;color:#334155;">${page.pinyin}</p><p style="font-size:clamp(12px,1.8vw,15px);font-weight:700;color:#1e293b;background:#fef3c7;padding:3px 14px;border-radius:6px;">${page.meaningVi}</p><p style="margin-top:16px;font-size:12px;color:#94a3b8;">(Chưa có ví dụ)</p></div>`;
	return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:linear-gradient(225deg,#fefefe,#fdfaf5);box-sizing:border-box;font-family:Inter,sans-serif;">
    <p style="margin:0;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">📝 Ví dụ</p>
    <p style="margin:16px 0 0;font-size:clamp(18px,3vw,28px);font-weight:700;color:#1e293b;text-align:center;line-height:1.5;">${page.exampleChinese}</p>
    <p style="margin:10px 0 0;font-size:clamp(13px,2vw,16px);color:#dc2626;font-weight:500;">${page.examplePinyin || ""}</p>
    <p style="margin:8px 0 0;font-size:clamp(12px,1.8vw,15px);color:#64748b;">${page.exampleMeaning || ""}</p>
    <p style="margin:20px 0 0;font-size:clamp(24px,4vw,38px);font-weight:900;color:#dc2626;opacity:0.6;">${page.chinese}</p>
  </div>`;
}
function BookFlip({ pages, onPageChange }) {
	const containerRef = useRef(null);
	const pfRef = useRef(null);
	const cbRef = useRef(onPageChange);
	cbRef.current = onPageChange;
	useEffect(() => {
		if (typeof window === "undefined") return;
		const el = containerRef.current;
		if (!el || pages.length === 0) return;
		if (pfRef.current) {
			try {
				pfRef.current.destroy();
			} catch {}
			pfRef.current = null;
		}
		el.innerHTML = "";
		const items = [];
		pages.forEach((p, i) => {
			const frontDiv = document.createElement("div");
			frontDiv.setAttribute("data-density", i === 0 ? "hard" : "soft");
			frontDiv.innerHTML = makePageHtml(p, false);
			items.push(frontDiv);
			const backDiv = document.createElement("div");
			backDiv.setAttribute("data-density", "soft");
			backDiv.innerHTML = makePageHtml(p, true);
			items.push(backDiv);
		});
		if (items.length > 0) items[items.length - 1].setAttribute("data-density", "hard");
		const init = () => {
			if (!el) return;
			const St = window.St;
			if (!St?.PageFlip) {
				setTimeout(init, 100);
				return;
			}
			const pf = new St.PageFlip(el, {
				width: 420,
				height: 560,
				size: "stretch",
				minWidth: 300,
				maxWidth: 820,
				minHeight: 400,
				maxHeight: 680,
				drawShadow: true,
				flippingTime: 400,
				usePortrait: true,
				startPage: 0,
				showCover: false,
				mobileScrollSupport: false,
				swipeDistance: 30,
				maxShadowOpacity: .25
			});
			pf.loadFromHTML(items);
			pf.on("flip", (e) => {
				cbRef.current?.(Math.floor(e.data / 2));
			});
			pfRef.current = pf;
		};
		if (window.St?.PageFlip) init();
		else if (!document.querySelector("script[src=\"/page-flip.browser.js\"]")) {
			const s = document.createElement("script");
			s.src = "/page-flip.browser.js";
			s.onload = init;
			document.head.appendChild(s);
		} else {
			const iv = setInterval(() => {
				if (window.St?.PageFlip) {
					clearInterval(iv);
					init();
				}
			}, 100);
		}
		return () => {
			pfRef.current = null;
		};
	}, [pages.length]);
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		className: "mx-auto w-full",
		style: {
			maxWidth: "820px",
			height: "560px",
			minHeight: "440px"
		}
	});
}
//#endregion
//#region app/routes/lessons.$lessonId.tsx
var lessons_$lessonId_exports = /* @__PURE__ */ __exportAll({
	default: () => lessons_$lessonId_default,
	loader: () => loader$13
});
async function loader$13({ request, params }) {
	const [user, lesson] = await Promise.all([getUser(request), prisma.lesson.findUnique({
		where: { id: params.lessonId },
		include: {
			vocabularies: true,
			grammars: true,
			quizzes: true
		}
	})]);
	if (!lesson) throw data("Không tìm thấy bài học", { status: 404 });
	const vocabulariesWithImages = lesson.vocabularies.map((v) => ({
		...v,
		imageUrl: v.imageUrl || `/images/${encodeURIComponent(v.chinese)}.jpg`
	}));
	return {
		user,
		lesson: {
			...lesson,
			vocabularies: vocabulariesWithImages
		}
	};
}
function shuffleItems$1(items) {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
function speakChinese$1(text) {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "zh-CN";
	utterance.rate = .85;
	const zhVoice = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("zh")).sort((a) => a.name.toLowerCase().includes("chen") ? 1 : -1)[0];
	if (zhVoice) utterance.voice = zhVoice;
	window.speechSynthesis.speak(utterance);
}
function playSound$1(correct) {
	if (typeof window === "undefined") return;
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		if (correct) {
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, ctx.currentTime);
			osc.frequency.setValueAtTime(1100, ctx.currentTime + .1);
			gain.gain.setValueAtTime(.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(.01, ctx.currentTime + .3);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + .3);
		} else {
			osc.type = "square";
			osc.frequency.setValueAtTime(200, ctx.currentTime);
			gain.gain.setValueAtTime(.15, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(.01, ctx.currentTime + .25);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + .25);
		}
	} catch {}
}
var lessons_$lessonId_default = UNSAFE_withComponentProps(function LessonDetail({ loaderData }) {
	const { lesson } = loaderData;
	const [activeTab, setActiveTab] = useState("vocabulary");
	const [vocabPos, setVocabPos] = useState(0);
	const [vocabSk, setVocabSk] = useState(0);
	const [showMeaning, setShowMeaning] = useState(false);
	const [translationAnswer, setTranslationAnswer] = useState("");
	const [checkedTranslation, setCheckedTranslation] = useState(false);
	const [hanziAnswer, setHanziAnswer] = useState("");
	const [checkedHanzi, setCheckedHanzi] = useState(false);
	const [quizPos, setQuizPos] = useState(0);
	const [quizSk, setQuizSk] = useState(0);
	const [quizResponse, setQuizResponse] = useState("");
	const [quizMode, setQuizMode] = useState("meaning");
	const translationInputRef = useRef(null);
	const hanziInputRef = useRef(null);
	const vocabItems = lesson.vocabularies;
	const vocabOrder = useMemo(() => shuffleItems$1([...Array(vocabItems.length).keys()]), [vocabItems.length, vocabSk]);
	const vocabIdx = vocabOrder[vocabPos] ?? 0;
	const currentVocab = vocabItems[vocabIdx];
	const bookPages = useMemo(() => {
		return vocabOrder.map((i) => vocabItems[i]).map((v) => ({
			imageUrl: v.imageUrl || void 0,
			chinese: v.chinese,
			pinyin: v.pinyin,
			meaningVi: v.meaningVi,
			exampleChinese: v.exampleChinese || void 0,
			examplePinyin: v.examplePinyin || void 0,
			exampleMeaning: v.exampleMeaning || void 0
		}));
	}, [vocabItems, vocabOrder]);
	const handleBookPageChange = useCallback((pageIndex) => {
		setVocabPos(pageIndex);
	}, []);
	const quizItems = lesson.quizzes;
	useEffect(() => {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
		window.speechSynthesis.getVoices();
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
		window.speechSynthesis.cancel();
	}, []);
	const generatedQuizzes = useMemo(() => {
		return vocabItems.map((vocab) => {
			const distractors = vocabItems.filter((v) => v.chinese !== vocab.chinese).map((v) => {
				if (quizMode === "pinyin") return v.pinyin;
				if (quizMode === "recognition" || quizMode === "listening") return v.chinese;
				return v.meaningVi;
			}).filter(Boolean);
			const answer = quizMode === "pinyin" ? vocab.pinyin : quizMode === "recognition" || quizMode === "listening" ? vocab.chinese : vocab.meaningVi;
			const randomD = shuffleItems$1([...new Set(distractors.filter((x) => x !== answer))]).slice(0, 3);
			return {
				type: quizMode === "pinyin" ? "PINYIN" : quizMode === "recognition" || quizMode === "listening" ? "CHAR_RECOGNITION" : "MEANING",
				question: quizMode === "pinyin" ? `"${vocab.chinese}" đọc pinyin là gì?` : quizMode === "listening" ? "Nghe và chọn chữ Hán đúng" : quizMode === "recognition" ? `Chữ Hán nào có pinyin "${vocab.pinyin}"?` : `"${vocab.chinese}" nghĩa là gì?`,
				options: shuffleItems$1([answer, ...randomD]),
				answer,
				promptPinyin: vocab.pinyin
			};
		});
	}, [quizMode, vocabItems]);
	const practiceQuestions = quizItems.length && quizMode === "meaning" ? quizItems : generatedQuizzes;
	const quizOrder = useMemo(() => shuffleItems$1([...Array(practiceQuestions.length).keys()]), [practiceQuestions.length, quizSk]);
	const quizIdx = quizOrder[quizPos] ?? 0;
	const currentQuiz = practiceQuestions[quizIdx];
	const normalizedUserMeaning = translationAnswer.trim().toLowerCase();
	const translationCorrect = checkedTranslation && normalizedUserMeaning === (currentVocab?.meaningVi || "").trim().toLowerCase();
	const normalizedUserHanzi = hanziAnswer.trim();
	const normalizedCorrectHanzi = (currentVocab?.chinese || "").trim();
	const hanziCorrect = checkedHanzi && normalizedUserHanzi.length > 0 && normalizedUserHanzi === normalizedCorrectHanzi;
	const hasQuizAnswer = quizResponse.trim().length > 0;
	const quizCorrect = hasQuizAnswer && quizResponse.trim() === (currentQuiz?.answer || "").trim();
	useEffect(() => {
		if (checkedTranslation) playSound$1(translationCorrect);
	}, [checkedTranslation, translationCorrect]);
	useEffect(() => {
		if (checkedHanzi) playSound$1(hanziCorrect);
	}, [checkedHanzi, hanziCorrect]);
	useEffect(() => {
		if (hasQuizAnswer) playSound$1(quizCorrect);
	}, [hasQuizAnswer, quizCorrect]);
	useEffect(() => {
		setVocabPos(0);
		setVocabSk((k) => k + 1);
		setShowMeaning(false);
		setTranslationAnswer("");
		setCheckedTranslation(false);
		setHanziAnswer("");
		setCheckedHanzi(false);
		setQuizPos(0);
		setQuizSk((k) => k + 1);
		setQuizResponse("");
		setQuizMode("meaning");
	}, [activeTab]);
	useEffect(() => {
		if (activeTab === "quiz" && quizMode === "listening" && currentQuiz?.answer) speakChinese$1(currentQuiz.answer);
	}, [
		quizIdx,
		quizMode,
		activeTab,
		currentQuiz?.answer
	]);
	useEffect(() => {
		if (activeTab === "translation") translationInputRef.current?.focus();
		else if (activeTab === "hanzi") hanziInputRef.current?.focus();
	}, [vocabIdx, activeTab]);
	const switchTab = (tab) => {
		if (!vocabItems.length && tab !== "quiz") return;
		if (tab === "quiz" && !vocabItems.length && !quizItems.length) return;
		setActiveTab(tab);
	};
	const nextVocab = useCallback(() => {
		if (!vocabItems.length) return;
		if (vocabPos + 1 >= vocabOrder.length) {
			setVocabSk((k) => k + 1);
			setVocabPos(0);
		} else setVocabPos(vocabPos + 1);
		setShowMeaning(false);
		setTranslationAnswer("");
		setCheckedTranslation(false);
		setHanziAnswer("");
		setCheckedHanzi(false);
	}, [
		vocabItems.length,
		vocabPos,
		vocabOrder.length
	]);
	const prevVocab = useCallback(() => {
		if (!vocabItems.length) return;
		setVocabPos((vocabPos - 1 + vocabOrder.length) % vocabOrder.length);
		setShowMeaning(false);
		setTranslationAnswer("");
		setCheckedTranslation(false);
		setHanziAnswer("");
		setCheckedHanzi(false);
	}, [
		vocabItems.length,
		vocabPos,
		vocabOrder.length
	]);
	const nextQuiz = useCallback(() => {
		if (!practiceQuestions.length) return;
		setQuizResponse("");
		if (quizPos + 1 >= quizOrder.length) {
			setQuizSk((k) => k + 1);
			setQuizPos(0);
		} else setQuizPos(quizPos + 1);
	}, [
		practiceQuestions.length,
		quizPos,
		quizOrder.length
	]);
	const prevQuiz = useCallback(() => {
		if (!practiceQuestions.length) return;
		setQuizResponse("");
		setQuizPos((quizPos - 1 + quizOrder.length) % quizOrder.length);
	}, [
		practiceQuestions.length,
		quizPos,
		quizOrder.length
	]);
	useEffect(() => {
		const handleKeyDown = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				if (activeTab === "quiz") prevQuiz();
				else prevVocab();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				if (activeTab === "quiz") nextQuiz();
				else nextVocab();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		activeTab,
		prevVocab,
		nextVocab,
		prevQuiz,
		nextQuiz
	]);
	const tabTitle = activeTab === "vocabulary" ? "Học từ vựng" : activeTab === "translation" ? "Dịch nghĩa" : activeTab === "hanzi" ? "Chữ Hán" : "Luyện tập";
	const activeCount = activeTab === "quiz" ? practiceQuestions.length : vocabItems.length;
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsx("main", {
			className: "mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-8",
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-4 md:mt-6",
				children: /* @__PURE__ */ jsxs("section", {
					className: "overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:p-6",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-4 flex flex-col gap-3",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
									className: "text-lg font-bold sm:text-xl",
									children: lesson.title
								}), /* @__PURE__ */ jsx("p", {
									className: "mt-1 text-sm text-slate-500",
									children: lesson.description
								})] }),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("h2", {
										className: "text-lg font-bold sm:text-xl",
										children: tabTitle
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-slate-400 sm:text-sm",
										children: activeTab === "quiz" ? `Câu ${quizPos + 1}/${activeCount}` : `${vocabPos + 1}/${activeCount}`
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "-mx-1 flex flex-wrap justify-center gap-1",
									children: [
										"vocabulary",
										"translation",
										"hanzi",
										"quiz"
									].map((tab) => /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => switchTab(tab),
										disabled: !vocabItems.length && tab !== "quiz",
										className: `rounded-full px-3 py-1.5 text-[11px] font-bold transition sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${activeTab === tab ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"} disabled:cursor-not-allowed disabled:opacity-40`,
										children: tab === "vocabulary" ? "Từ Vựng" : tab === "translation" ? "Dịch Nghĩa" : tab === "hanzi" ? "Chữ Hán" : "Luyện Tập"
									}, tab))
								})
							]
						}),
						activeTab === "vocabulary" && vocabItems.length > 0 ? /* @__PURE__ */ jsx(BookFlip, {
							pages: bookPages,
							onPageChange: handleBookPageChange
						}) : activeTab === "vocabulary" ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400",
							children: "Bài này chưa có từ vựng."
						}) : null,
						activeTab === "translation" && currentVocab && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => speakChinese$1(currentVocab.chinese),
										className: "absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3",
										type: "button",
										children: /* @__PURE__ */ jsx(Volume2, { size: 18 })
									}),
									/* @__PURE__ */ jsx("p", {
										className: "break-all text-5xl font-black text-red-600 sm:text-6xl md:text-7xl",
										suppressHydrationWarning: true,
										children: currentVocab.chinese
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-3 break-words text-base font-bold text-slate-800 sm:mt-4 sm:text-xl",
										suppressHydrationWarning: true,
										children: currentVocab.pinyin
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-5",
										children: /* @__PURE__ */ jsx("input", {
											ref: translationInputRef,
											value: translationAnswer,
											onChange: (e) => setTranslationAnswer(e.target.value),
											placeholder: "Nhập nghĩa tiếng Việt...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${checkedTranslation ? translationCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													setCheckedTranslation(true);
													e.target.blur();
												}
											}
										})
									}),
									!checkedTranslation ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setCheckedTranslation(true),
										disabled: !translationAnswer.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
									}) : null,
									checkedTranslation ? /* @__PURE__ */ jsxs("div", {
										className: "mt-3 rounded-2xl bg-amber-50 p-3 text-left",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs font-bold uppercase tracking-wide text-amber-700",
											children: "Đáp án tham khảo"
										}), /* @__PURE__ */ jsx("p", {
											className: "mt-1 text-base font-extrabold text-slate-900",
											children: currentVocab.meaningVi
										})]
									}) : null,
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5",
										children: [/* @__PURE__ */ jsx(NavBtn, {
											onClick: prevVocab,
											label: "Trước"
										}), /* @__PURE__ */ jsx(NavBtn, {
											onClick: nextVocab,
											label: "Tiếp",
											next: true
										})]
									})
								]
							})
						}),
						activeTab === "hanzi" && currentVocab && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => speakChinese$1(currentVocab.chinese),
										className: "absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3",
										type: "button",
										children: /* @__PURE__ */ jsx(Volume2, { size: 18 })
									}),
									/* @__PURE__ */ jsx("p", {
										className: "break-all text-4xl font-black text-red-600 sm:text-5xl",
										suppressHydrationWarning: true,
										children: currentVocab.pinyin
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 text-base text-slate-500 sm:text-lg",
										suppressHydrationWarning: true,
										children: currentVocab.meaningVi
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-5",
										children: /* @__PURE__ */ jsx("input", {
											ref: hanziInputRef,
											value: hanziAnswer,
											onChange: (e) => setHanziAnswer(e.target.value),
											placeholder: "Nhập chữ Hán...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${checkedHanzi ? hanziCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													setCheckedHanzi(true);
													e.target.blur();
												}
											}
										})
									}),
									!checkedHanzi ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setCheckedHanzi(true),
										disabled: !hanziAnswer.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
									}) : null,
									checkedHanzi ? /* @__PURE__ */ jsxs("div", {
										className: "mt-3 rounded-2xl bg-amber-50 p-3 text-left",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs font-bold uppercase tracking-wide text-amber-700",
											children: "Đáp án"
										}), /* @__PURE__ */ jsx("p", {
											className: "mt-1 text-2xl font-black text-red-600",
											children: currentVocab.chinese
										})]
									}) : null,
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5",
										children: [/* @__PURE__ */ jsx(NavBtn, {
											onClick: prevVocab,
											label: "Trước"
										}), /* @__PURE__ */ jsx(NavBtn, {
											onClick: nextVocab,
											label: "Tiếp",
											next: true
										})]
									})
								]
							})
						}),
						activeTab === "quiz" && currentQuiz && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-md sm:rounded-[2rem] sm:p-6",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "-mx-1 mb-4 flex justify-center overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0",
										children: [
											"meaning",
											"pinyin",
											"recognition",
											"listening"
										].map((m) => /* @__PURE__ */ jsx("button", {
											onClick: () => {
												setQuizMode(m);
												setQuizPos(0);
												setQuizResponse("");
											},
											className: `mx-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${quizMode === m ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`,
											children: m === "meaning" ? "Nghĩa" : m === "pinyin" ? "Pinyin" : m === "recognition" ? "Chữ Hán" : "Nghe"
										}, m))
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "text-lg font-extrabold text-slate-900 sm:text-xl",
										children: currentQuiz.question
									}),
									quizMode === "listening" ? /* @__PURE__ */ jsxs("button", {
										onClick: () => speakChinese$1(currentQuiz.answer),
										className: "mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
										type: "button",
										children: [/* @__PURE__ */ jsx(Volume2, { size: 16 }), "Nghe lại"]
									}) : null,
									/* @__PURE__ */ jsx("div", {
										className: "mt-4 grid gap-2",
										children: currentQuiz.options.map((option) => {
											const isSelected = quizResponse === option;
											const isCorrectOpt = option === currentQuiz.answer;
											return /* @__PURE__ */ jsx("button", {
												type: "button",
												onClick: () => setQuizResponse(option),
												className: `rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${hasQuizAnswer ? isCorrectOpt ? "border-emerald-300 bg-emerald-50 text-emerald-700" : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500" : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`,
												children: option
											}, option);
										})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3",
										children: [/* @__PURE__ */ jsx(NavBtn, {
											onClick: prevQuiz,
											label: "Câu trước"
										}), /* @__PURE__ */ jsx(NavBtn, {
											onClick: nextQuiz,
											label: "Câu tiếp theo",
											next: true
										})]
									})
								]
							})
						}),
						activeTab !== "quiz" && !currentVocab ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400",
							children: "Bài này chưa có từ vựng."
						}) : null,
						activeTab === "quiz" && !currentQuiz ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400",
							children: "Bài này chưa có quiz."
						}) : null
					]
				})
			})
		})
	});
});
function NavBtn({ onClick, label, next }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick,
		type: "button",
		className: `flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${next ? "flex-row-reverse" : ""}`,
		children: [next ? /* @__PURE__ */ jsx(ChevronRight, {
			size: 16,
			className: "sm:w-[18px] sm:h-[18px]"
		}) : /* @__PURE__ */ jsx(ChevronLeft, {
			size: 16,
			className: "sm:w-[18px] sm:h-[18px]"
		}), label]
	});
}
//#endregion
//#region app/routes/roadmap.tsx
var roadmap_exports = /* @__PURE__ */ __exportAll({
	default: () => roadmap_default,
	loader: () => loader$12
});
var IMAGES_DIR = join(process.cwd(), "public", "images");
function getAvailableImages() {
	try {
		const files = readdirSync(IMAGES_DIR);
		return new Set(files);
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function vocabImageUrl(chinese, availableImages) {
	const filename = `${chinese}.jpg`;
	return availableImages.has(filename) ? `/images/${encodeURIComponent(chinese)}.jpg` : void 0;
}
async function loader$12({ request }) {
	const user = await requireUser(request);
	const url = new URL(request.url);
	const phase = url.searchParams.get("phase") || "";
	const q = url.searchParams.get("q") || "";
	const availableImages = getAvailableImages();
	const where = {
		...phase ? { phase } : {},
		...q ? { OR: [{ title: {
			contains: q,
			mode: "insensitive"
		} }, { description: {
			contains: q,
			mode: "insensitive"
		} }] } : {}
	};
	const [items, itemsForStats] = await Promise.all([prisma.roadmapItem.findMany({
		where,
		orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }]
	}), prisma.roadmapItem.findMany({
		select: {
			phase: true,
			vocabulary: true,
			phrases: true
		},
		orderBy: [
			{ phase: "asc" },
			{ orderNo: "asc" },
			{ createdAt: "asc" }
		]
	})]);
	const statsByPhase = /* @__PURE__ */ new Map();
	for (const item of itemsForStats) {
		const stat = statsByPhase.get(item.phase) || {
			phase: item.phase,
			lessonCount: 0,
			wordCount: 0,
			sampleImages: []
		};
		const entries = [...toRoadmapEntries(item.vocabulary, availableImages), ...toRoadmapEntries(item.phrases, availableImages)];
		stat.lessonCount += 1;
		stat.wordCount += entries.length;
		for (const entry of entries) if (entry.imageUrl && stat.sampleImages.length < 3) stat.sampleImages.push(entry.imageUrl);
		statsByPhase.set(item.phase, stat);
	}
	const phases = [...statsByPhase.keys()];
	const phaseStats = [...statsByPhase.values()];
	return {
		user,
		items,
		phases,
		phaseStats,
		q,
		phase,
		totalLessons: phaseStats.reduce((acc, s) => acc + s.lessonCount, 0),
		totalWords: phaseStats.reduce((acc, s) => acc + s.wordCount, 0),
		availableImageNames: [...availableImages]
	};
}
function toRoadmapEntries(value, availableImages) {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => Boolean(item) && typeof item === "object").map((item) => {
		const chinese = String(item.chinese || "");
		return {
			chinese,
			pinyin: String(item.pinyin || ""),
			meaningVi: String(item.meaningVi || item.meaning || ""),
			imageUrl: item.imageUrl ? String(item.imageUrl) : vocabImageUrl(chinese, availableImages)
		};
	}).filter((item) => item.chinese && item.meaningVi);
}
var PHASE_STYLES = {
	"Giai đoạn 1": {
		bg: "bg-emerald-50 hover:bg-emerald-100/60",
		border: "border-emerald-200 hover:border-emerald-400",
		text: "text-emerald-700",
		badge: "bg-emerald-500 text-white",
		gradient: "from-emerald-600 to-teal-700",
		defaultImage: "/images/hsk1.svg"
	},
	"Giai đoạn 2": {
		bg: "bg-sky-50 hover:bg-sky-100/60",
		border: "border-sky-200 hover:border-sky-400",
		text: "text-sky-700",
		badge: "bg-sky-500 text-white",
		gradient: "from-sky-600 to-blue-700",
		defaultImage: "/images/hsk2.svg"
	},
	"Giai đoạn 3": {
		bg: "bg-indigo-50 hover:bg-indigo-100/60",
		border: "border-indigo-200 hover:border-indigo-400",
		text: "text-indigo-700",
		badge: "bg-indigo-500 text-white",
		gradient: "from-indigo-600 to-violet-700",
		defaultImage: "/images/hsk3.svg"
	},
	"Giai đoạn 4": {
		bg: "bg-amber-50 hover:bg-amber-100/60",
		border: "border-amber-200 hover:border-amber-400",
		text: "text-amber-700",
		badge: "bg-amber-500 text-white",
		gradient: "from-amber-500 to-orange-600",
		defaultImage: "/images/hsk_beginner.png"
	},
	"Giai đoạn 5": {
		bg: "bg-rose-50 hover:bg-rose-100/60",
		border: "border-rose-200 hover:border-rose-400",
		text: "text-rose-700",
		badge: "bg-rose-500 text-white",
		gradient: "from-rose-600 to-red-700",
		defaultImage: "/images/hsk_intermediate.png"
	},
	"Giai đoạn 6": {
		bg: "bg-purple-50 hover:bg-purple-100/60",
		border: "border-purple-200 hover:border-purple-400",
		text: "text-purple-700",
		badge: "bg-purple-600 text-white",
		gradient: "from-purple-600 to-fuchsia-700",
		defaultImage: "/images/hsk_advanced.png"
	}
};
function getPhaseStyle(ph) {
	const normalized = ph.trim();
	if (PHASE_STYLES[normalized]) return PHASE_STYLES[normalized];
	return {
		bg: "bg-red-50 hover:bg-red-100/60",
		border: "border-red-200 hover:border-red-400",
		text: "text-red-700",
		badge: "bg-red-600 text-white",
		gradient: "from-red-600 to-rose-700",
		defaultImage: "/images/hsk_advanced.png"
	};
}
var roadmap_default = UNSAFE_withComponentProps(function RoadmapPage({ loaderData }) {
	const [params, setParams] = useSearchParams();
	const { items, phases, phaseStats, q, phase, totalLessons, totalWords, availableImageNames } = loaderData;
	const availableImages = useMemo(() => new Set(availableImageNames), [availableImageNames]);
	const setPhase = (p) => {
		const next = new URLSearchParams(params);
		p ? next.set("phase", p) : next.delete("phase");
		setParams(next);
	};
	const clearSearch = () => {
		const next = new URLSearchParams(params);
		next.delete("q");
		setParams(next);
	};
	const showAll = !phase;
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("div", {
			className: "min-h-screen bg-slate-50/50 pb-16",
			children: [/* @__PURE__ */ jsxs("section", {
				className: "relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white py-12 md:py-20 px-4",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "absolute left-8 top-1/2 -translate-y-1/2 text-9xl font-black text-white/[0.03] select-none pointer-events-none tracking-widest hidden lg:block",
						children: "学习路线"
					}),
					/* @__PURE__ */ jsx("div", { className: "absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" }),
					/* @__PURE__ */ jsx("div", { className: "absolute right-10 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" }),
					/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" }),
					/* @__PURE__ */ jsx("div", {
						className: "relative mx-auto max-w-7xl",
						children: /* @__PURE__ */ jsxs("div", {
							className: "grid gap-10 lg:grid-cols-12 lg:items-center",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "lg:col-span-7",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-blue-200 backdrop-blur border border-white/15 shadow-inner",
										children: [/* @__PURE__ */ jsx(Sparkles, {
											size: 15,
											className: "text-amber-400 animate-pulse"
										}), /* @__PURE__ */ jsx("span", { children: "Lộ Trình Học Tập Chuẩn Hóa" })]
									}),
									/* @__PURE__ */ jsxs("h1", {
										className: "mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight",
										children: [
											"Học Tiếng Trung",
											" ",
											/* @__PURE__ */ jsx("span", {
												className: "bg-gradient-to-r from-blue-400 via-amber-300 to-blue-200 bg-clip-text text-transparent",
												children: "Theo Lộ Trình"
											}),
											" ",
											"Bài Bản"
										]
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-3 text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl",
										children: "Học từ vựng, mẫu câu theo từng buổi học được thiết kế theo lộ trình từ cơ bản đến nâng cao."
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-6 max-w-xl",
										children: /* @__PURE__ */ jsxs("form", {
											className: "relative",
											children: [
												/* @__PURE__ */ jsx(Search, {
													className: "absolute left-4 top-1/2 -translate-y-1/2 text-blue-400",
													size: 20
												}),
												/* @__PURE__ */ jsx("input", {
													name: "q",
													defaultValue: q,
													placeholder: "Tìm trong lộ trình (VD: Buổi 1, Chào hỏi, Gia đình...)",
													className: "w-full rounded-2xl border border-white/20 bg-white/15 py-4 pl-12 pr-12 text-sm text-white placeholder-slate-400 backdrop-blur shadow-2xl transition duration-200 focus:border-blue-400 focus:bg-slate-900/90 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
												}),
												q ? /* @__PURE__ */ jsx("button", {
													type: "button",
													onClick: clearSearch,
													className: "absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1 text-slate-300 hover:bg-white/30 hover:text-white",
													children: /* @__PURE__ */ jsx(X, { size: 16 })
												}) : null
											]
										})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-8 flex flex-wrap items-center gap-3",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm",
												children: [/* @__PURE__ */ jsx(BookOpen, {
													size: 18,
													className: "text-blue-400"
												}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
													className: "text-white text-sm font-black",
													children: totalLessons
												}), " Buổi học"] })]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm",
												children: [/* @__PURE__ */ jsx(BookMarked, {
													size: 18,
													className: "text-amber-400"
												}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
													className: "text-white text-sm font-black",
													children: totalWords
												}), " Từ & Câu"] })]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm",
												children: [/* @__PURE__ */ jsx(Layers, {
													size: 18,
													className: "text-emerald-400"
												}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", {
													className: "text-white text-sm font-black",
													children: phaseStats.length
												}), " Giai đoạn"] })]
											})
										]
									})
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "lg:col-span-5",
								children: /* @__PURE__ */ jsx("div", {
									className: "group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-2 shadow-2xl backdrop-blur transition-all duration-500 hover:border-blue-500/50 hover:shadow-blue-950/40",
									children: /* @__PURE__ */ jsxs("div", {
										className: "relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950",
										children: [
											/* @__PURE__ */ jsx("img", {
												src: "/images/hsk_hero.png",
												alt: "Lộ trình học tập",
												className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
											}),
											/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" }),
											/* @__PURE__ */ jsx("div", {
												className: "absolute top-4 left-4",
												children: /* @__PURE__ */ jsxs("span", {
													className: "inline-flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-black text-amber-300 backdrop-blur border border-amber-500/30 shadow-lg",
													children: [/* @__PURE__ */ jsx(Flame, {
														size: 14,
														className: "text-amber-400"
													}), " Từ Cơ Bản Đến Nâng Cao"]
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute bottom-4 left-4 right-4",
												children: /* @__PURE__ */ jsxs("div", {
													className: "flex items-center justify-between rounded-xl bg-slate-900/80 p-3 backdrop-blur border border-white/10",
													children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
														className: "text-xs font-bold text-white",
														children: "Lộ trình từng buổi học"
													}), /* @__PURE__ */ jsx("p", {
														className: "text-[11px] text-slate-400",
														children: "Từ vựng & Mẫu câu theo chủ đề"
													})] }), /* @__PURE__ */ jsx("span", {
														className: "flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md",
														children: /* @__PURE__ */ jsx(GraduationCap, { size: 18 })
													})]
												})
											})
										]
									})
								})
							})]
						})
					})
				]
			}), /* @__PURE__ */ jsxs("main", {
				className: "mx-auto max-w-7xl px-4 pt-8",
				children: [q && /* @__PURE__ */ jsxs("div", {
					className: "mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Search, {
							size: 16,
							className: "text-amber-600"
						}), /* @__PURE__ */ jsxs("span", { children: [
							"Kết quả tìm kiếm cho: ",
							/* @__PURE__ */ jsxs("strong", {
								className: "font-bold",
								children: [
									"\"",
									q,
									"\""
								]
							}),
							" (",
							items.length,
							" buổi học)"
						] })]
					}), /* @__PURE__ */ jsx("button", {
						onClick: clearSearch,
						className: "text-xs font-semibold text-amber-700 underline hover:text-amber-900",
						children: "Xóa tìm kiếm"
					})]
				}), showAll ? /* @__PURE__ */ jsxs("div", {
					className: "mt-8",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between mb-4",
						children: [/* @__PURE__ */ jsxs("h2", {
							className: "text-xl font-bold text-slate-800 flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(GraduationCap, {
								className: "text-blue-600",
								size: 22
							}), /* @__PURE__ */ jsx("span", { children: "Chọn giai đoạn học" })]
						}), /* @__PURE__ */ jsxs("span", {
							className: "text-xs font-medium text-slate-500",
							children: [
								"Hiển thị ",
								phaseStats.length,
								" giai đoạn"
							]
						})]
					}), phaseStats.length === 0 ? /* @__PURE__ */ jsxs("div", {
						className: "mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm",
						children: [
							/* @__PURE__ */ jsx(BookOpen, {
								size: 48,
								className: "mx-auto text-slate-300 mb-3"
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "text-lg font-bold text-slate-700",
								children: "Chưa có dữ liệu lộ trình"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-1 text-sm text-slate-500",
								children: "Vui lòng thêm dữ liệu lộ trình để bắt đầu."
							})
						]
					}) : /* @__PURE__ */ jsx("div", {
						className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
						children: phaseStats.map((stat) => {
							const phStyle = getPhaseStyle(stat.phase);
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => setPhase(stat.phase),
								className: `group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${phStyle.border}`,
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "relative -mx-6 -mt-6 mb-5 h-40 overflow-hidden bg-slate-900",
										children: [
											stat.sampleImages.length > 0 ? /* @__PURE__ */ jsxs("div", {
												className: "flex h-full w-full gap-0.5",
												children: [stat.sampleImages.map((img, i) => /* @__PURE__ */ jsx("img", {
													src: img,
													alt: "",
													className: "h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110"
												}, i)), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" })]
											}) : /* @__PURE__ */ jsxs("div", {
												className: "relative h-full w-full",
												children: [/* @__PURE__ */ jsx("img", {
													src: phStyle.defaultImage,
													alt: stat.phase,
													className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
												}), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/20" })]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute top-4 left-4 z-10",
												children: /* @__PURE__ */ jsxs("span", {
													className: `inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black shadow-md ${phStyle.badge}`,
													children: [
														/* @__PURE__ */ jsx(Flame, { size: 13 }),
														" ",
														stat.phase
													]
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute right-4 bottom-3 z-10",
												children: /* @__PURE__ */ jsx("span", {
													className: "text-xl font-black text-white/90 drop-shadow-md",
													children: stat.phase
												})
											})
										]
									}),
									/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ jsx("h3", {
											className: "text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors",
											children: stat.phase
										}), /* @__PURE__ */ jsx("div", {
											className: "flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200",
											children: /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-left",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-[11px] font-semibold text-slate-400 uppercase tracking-wider",
											children: "Buổi học"
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1",
											children: [
												/* @__PURE__ */ jsx(BookOpen, {
													size: 15,
													className: "text-blue-500"
												}),
												stat.lessonCount,
												" buổi"
											]
										})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-[11px] font-semibold text-slate-400 uppercase tracking-wider",
											children: "Từ & Câu"
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1",
											children: [
												/* @__PURE__ */ jsx(BookMarked, {
													size: 15,
													className: "text-amber-500"
												}),
												stat.wordCount,
												" mục"
											]
										})] })]
									})] }),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 group-hover:text-blue-600",
										children: [/* @__PURE__ */ jsx("span", { children: "Khám phá các buổi học" }), /* @__PURE__ */ jsxs("span", {
											className: "flex items-center gap-1",
											children: ["Xem ngay ", /* @__PURE__ */ jsx(ArrowRight, {
												size: 14,
												className: "transition-transform group-hover:translate-x-1"
											})]
										})]
									})
								]
							}, stat.phase);
						})
					})]
				}) : /* @__PURE__ */ jsxs("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setPhase(""),
									className: "inline-flex items-center gap-1.5 bg-transparent px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:text-slate-900",
									children: /* @__PURE__ */ jsx(ChevronLeft, { size: 16 })
								}),
								/* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-slate-200" }),
								/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", {
									className: "text-2xl font-black text-slate-900 flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", { children: "Danh sách buổi học" }), /* @__PURE__ */ jsx("span", {
										className: `rounded-xl px-3 py-0.5 text-xs font-bold ${getPhaseStyle(phase).badge}`,
										children: phase
									})]
								}) })
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-xs font-semibold text-slate-500",
							children: [
								"Hiển thị ",
								/* @__PURE__ */ jsx("strong", {
									className: "text-slate-900",
									children: items.length
								}),
								" buổi học"
							]
						})]
					}), items.length === 0 ? /* @__PURE__ */ jsxs("div", {
						className: "mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm",
						children: [
							/* @__PURE__ */ jsx(BookOpen, {
								size: 48,
								className: "mx-auto text-slate-300 mb-3"
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "text-lg font-bold text-slate-700",
								children: "Không tìm thấy buổi học nào"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-1 text-sm text-slate-500",
								children: "Thử tìm kiếm với từ khóa khác hoặc bỏ lọc giai đoạn."
							}),
							/* @__PURE__ */ jsx("button", {
								onClick: () => setPhase(""),
								className: "mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800",
								children: "Xem tất cả giai đoạn"
							})
						]
					}) : /* @__PURE__ */ jsx("div", {
						className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
						children: items.map((item) => {
							const vocab = toRoadmapEntries(item.vocabulary, availableImages);
							const phrases = toRoadmapEntries(item.phrases, availableImages);
							const allWords = [...vocab, ...phrases];
							const totalCount = allWords.length;
							const images = allWords.filter((w) => w.imageUrl).slice(0, 3).map((w) => w.imageUrl);
							getPhaseStyle(item.phase);
							return /* @__PURE__ */ jsxs(Link, {
								to: `/roadmap/${item.id}`,
								prefetch: "intent",
								className: "group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
									className: "relative h-40 w-full overflow-hidden bg-slate-900",
									children: [
										images.length > 0 ? /* @__PURE__ */ jsxs("div", {
											className: "flex h-full w-full gap-0.5",
											children: [images.map((img, i) => /* @__PURE__ */ jsx("img", {
												src: img,
												alt: "",
												className: "h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110"
											}, i)), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" })]
										}) : /* @__PURE__ */ jsxs("div", {
											className: "relative h-full w-full",
											children: [/* @__PURE__ */ jsx("img", {
												src: "/images/hsk_hero_card.png",
												alt: item.title,
												className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
											}), /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10" })]
										}),
										/* @__PURE__ */ jsx("div", {
											className: "absolute top-3 left-3 z-10",
											children: /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center rounded-xl bg-slate-900/85 px-3 py-1 text-xs font-extrabold text-white backdrop-blur shadow-md border border-white/10",
												children: ["Buổi ", item.orderNo < 10 ? `0${item.orderNo}` : item.orderNo]
											})
										}),
										/* @__PURE__ */ jsx("div", {
											className: "absolute top-3 right-3 z-10",
											children: /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 backdrop-blur shadow-md",
												children: [
													/* @__PURE__ */ jsx(BookMarked, {
														size: 13,
														className: "text-blue-500"
													}),
													totalCount,
													" từ"
												]
											})
										})
									]
								}), /* @__PURE__ */ jsxs("div", {
									className: "p-5",
									children: [
										/* @__PURE__ */ jsx("h3", {
											className: "text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1",
											children: item.title
										}),
										item.description ? /* @__PURE__ */ jsx("p", {
											className: "mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500",
											children: item.description
										}) : /* @__PURE__ */ jsxs("p", {
											className: "mt-2 text-xs italic text-slate-400",
											children: ["Buổi học thuộc ", item.phase]
										}),
										allWords.length > 0 && /* @__PURE__ */ jsx("div", {
											className: "mt-4 flex flex-wrap gap-1.5",
											children: allWords.slice(0, 3).map((w, i) => /* @__PURE__ */ jsxs("span", {
												className: "rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60",
												children: [
													w.chinese,
													" ",
													w.pinyin ? `(${w.pinyin})` : ""
												]
											}, i))
										})
									]
								})] }), /* @__PURE__ */ jsxs("div", {
									className: "mx-5 mb-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-600 group-hover:text-blue-600",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-1 text-slate-400",
										children: [
											/* @__PURE__ */ jsx(BookMarked, {
												size: 14,
												className: "text-blue-500"
											}),
											" ",
											totalCount,
											" từ & câu",
											item.level ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
												className: "mx-1 text-slate-300",
												children: "•"
											}), item.level] }) : null
										]
									}), /* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-1",
										children: ["Bắt đầu học ", /* @__PURE__ */ jsx(ArrowRight, {
											size: 14,
											className: "transition-transform group-hover:translate-x-1"
										})]
									})]
								})]
							}, item.id);
						})
					})]
				})]
			})]
		})
	});
});
//#endregion
//#region app/routes/roadmap.$roadmapId.tsx
var roadmap_$roadmapId_exports = /* @__PURE__ */ __exportAll({
	default: () => roadmap_$roadmapId_default,
	loader: () => loader$11
});
async function loader$11({ request, params }) {
	const [user, roadmap] = await Promise.all([getUser(request), prisma.roadmapItem.findUnique({ where: { id: params.roadmapId } })]);
	if (!roadmap) throw data("Không tìm thấy buổi học", { status: 404 });
	const vocab = toEntries(roadmap.vocabulary);
	const phrases = toEntries(roadmap.phrases);
	const allVocab = [...vocab, ...phrases];
	return {
		user,
		lesson: {
			id: roadmap.id,
			title: roadmap.title,
			description: roadmap.description,
			level: roadmap.level || roadmap.phase || "HSK1",
			orderNo: roadmap.orderNo,
			status: "PUBLISHED",
			source: "",
			createdAt: roadmap.createdAt,
			updatedAt: roadmap.updatedAt,
			vocabularies: allVocab.map((v, i) => ({
				id: `rv-${i}`,
				chinese: v.chinese,
				pinyin: v.pinyin,
				meaningVi: v.meaningVi,
				meaningEn: v.meaningEn || null,
				exampleChinese: v.exampleChinese || null,
				examplePinyin: v.examplePinyin || null,
				exampleMeaning: v.exampleMeaning || null,
				imageUrl: v.imageUrl || `/images/${encodeURIComponent(v.chinese)}.jpg`,
				level: v.level || "",
				lessonId: roadmap.id,
				createdAt: /* @__PURE__ */ new Date()
			})),
			grammars: [],
			quizzes: []
		}
	};
}
function toEntries(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => Boolean(item) && typeof item === "object").map((item) => ({
		chinese: String(item.chinese || ""),
		pinyin: String(item.pinyin || ""),
		meaningVi: String(item.meaningVi || item.meaning || ""),
		meaningEn: item.meaningEn ? String(item.meaningEn) : void 0,
		level: item.level ? String(item.level) : void 0,
		exampleChinese: item.exampleChinese ? String(item.exampleChinese) : void 0,
		examplePinyin: item.examplePinyin ? String(item.examplePinyin) : void 0,
		exampleMeaning: item.exampleMeaning ? String(item.exampleMeaning) : void 0,
		imageUrl: item.imageUrl ? String(item.imageUrl) : void 0
	})).filter((item) => item.chinese && item.meaningVi);
}
function shuffleItems(items) {
	const s = [...items];
	for (let i = s.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[s[i], s[j]] = [s[j], s[i]];
	}
	return s;
}
function speakChinese(text) {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	window.speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(text);
	u.lang = "zh-CN";
	u.rate = .85;
	const zhVoice = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("zh")).sort((a) => a.name.toLowerCase().includes("chen") ? 1 : -1)[0];
	if (zhVoice) u.voice = zhVoice;
	window.speechSynthesis.speak(u);
}
function playSound(correct) {
	if (typeof window === "undefined") return;
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		if (correct) {
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, ctx.currentTime);
			osc.frequency.setValueAtTime(1100, ctx.currentTime + .1);
			gain.gain.setValueAtTime(.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(.01, ctx.currentTime + .3);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + .3);
		} else {
			osc.type = "square";
			osc.frequency.setValueAtTime(200, ctx.currentTime);
			gain.gain.setValueAtTime(.15, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(.01, ctx.currentTime + .25);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + .25);
		}
	} catch {}
}
var roadmap_$roadmapId_default = UNSAFE_withComponentProps(function RoadmapDetail({ loaderData }) {
	const { lesson } = loaderData;
	const [activeTab, setActiveTab] = useState(lesson.vocabularies.length ? "vocabulary" : "quiz");
	const [vocabPos, setVocabPos] = useState(0);
	const [vocabSk, setVocabSk] = useState(0);
	const [showMeaning, setShowMeaning] = useState(false);
	const [tlA, setTlA] = useState("");
	const [tlC, setTlC] = useState(false);
	const [hzA, setHzA] = useState("");
	const [hzC, setHzC] = useState(false);
	const [quizPos, setQuizPos] = useState(0);
	const [quizSk, setQuizSk] = useState(0);
	const [qzR, setQzR] = useState("");
	const [qzM, setQzM] = useState("meaning");
	const translationInputRef = useRef(null);
	const hanziInputRef = useRef(null);
	const sVocab = lesson.vocabularies;
	const vocabOrder = useMemo(() => shuffleItems([...Array(sVocab.length).keys()]), [sVocab.length, vocabSk]);
	const vocabIdx = vocabOrder[vocabPos] ?? 0;
	const bookPages = useMemo(() => {
		return vocabOrder.map((i) => sVocab[i]).map((v) => ({
			imageUrl: v.imageUrl || void 0,
			chinese: v.chinese,
			pinyin: v.pinyin,
			meaningVi: v.meaningVi,
			exampleChinese: v.exampleChinese || void 0,
			examplePinyin: v.examplePinyin || void 0,
			exampleMeaning: v.exampleMeaning || void 0
		}));
	}, [sVocab, vocabOrder]);
	const handleBookPageChange = useCallback((pageIndex) => {
		setVocabPos(pageIndex);
	}, []);
	useEffect(() => {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
		window.speechSynthesis.getVoices();
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
		window.speechSynthesis.cancel();
	}, []);
	const genQ = useMemo(() => {
		return sVocab.map((v) => {
			const d = sVocab.filter((x) => x.chinese !== v.chinese).map((x) => qzM === "pinyin" ? x.pinyin : qzM === "recognition" || qzM === "listening" ? x.chinese : x.meaningVi).filter(Boolean);
			const a = qzM === "pinyin" ? v.pinyin : qzM === "recognition" || qzM === "listening" ? v.chinese : v.meaningVi;
			const randomD = shuffleItems([...new Set(d.filter((x) => x !== a))]).slice(0, 3);
			return {
				type: qzM === "pinyin" ? "PINYIN" : qzM === "recognition" || qzM === "listening" ? "CHAR_RECOGNITION" : "MEANING",
				question: qzM === "pinyin" ? `"${v.chinese}" đọc pinyin là gì?` : qzM === "listening" ? "Nghe và chọn chữ Hán đúng" : qzM === "recognition" ? `Chữ Hán nào có pinyin "${v.pinyin}"?` : `"${v.chinese}" nghĩa là gì?`,
				options: shuffleItems([a, ...randomD]),
				answer: a,
				promptPinyin: v.pinyin
			};
		});
	}, [qzM, sVocab]);
	const quizOrder = useMemo(() => shuffleItems([...Array(genQ.length).keys()]), [genQ.length, quizSk]);
	const quizIdx = quizOrder[quizPos] ?? 0;
	const cVocab = sVocab[vocabIdx];
	const cQuiz = genQ[quizIdx];
	const tlOK = tlC && tlA.trim().toLowerCase() === (cVocab?.meaningVi || "").trim().toLowerCase();
	const hzOK = hzC && hzA.trim() === (cVocab?.chinese || "").trim();
	const qzHas = qzR.trim().length > 0;
	const qzOK = qzHas && qzR.trim() === (cQuiz?.answer || "").trim();
	useEffect(() => {
		if (tlC) playSound(tlOK);
	}, [tlC, tlOK]);
	useEffect(() => {
		if (hzC) playSound(hzOK);
	}, [hzC, hzOK]);
	useEffect(() => {
		if (qzHas) playSound(qzOK);
	}, [qzHas, qzOK]);
	useEffect(() => {
		setVocabPos(0);
		setVocabSk((k) => k + 1);
		setShowMeaning(false);
		setTlA("");
		setTlC(false);
		setHzA("");
		setHzC(false);
		setQuizPos(0);
		setQuizSk((k) => k + 1);
		setQzR("");
		setQzM("meaning");
	}, [activeTab]);
	useEffect(() => {
		if (activeTab === "quiz" && qzM === "listening" && cQuiz?.answer) speakChinese(cQuiz.answer);
	}, [
		quizIdx,
		qzM,
		activeTab,
		cQuiz?.answer
	]);
	useEffect(() => {
		if (activeTab === "translation") translationInputRef.current?.focus();
		else if (activeTab === "hanzi") hanziInputRef.current?.focus();
	}, [vocabIdx, activeTab]);
	const sw = (t) => {
		if (!sVocab.length && t !== "quiz") return;
		setActiveTab(t);
	};
	const nV = useCallback(() => {
		if (!sVocab.length) return;
		if (vocabPos + 1 >= vocabOrder.length) {
			setVocabSk((k) => k + 1);
			setVocabPos(0);
		} else setVocabPos(vocabPos + 1);
		setShowMeaning(false);
		setTlA("");
		setTlC(false);
		setHzA("");
		setHzC(false);
	}, [
		sVocab.length,
		vocabPos,
		vocabOrder.length
	]);
	const pV = useCallback(() => {
		if (!sVocab.length) return;
		setVocabPos((vocabPos - 1 + vocabOrder.length) % vocabOrder.length);
		setShowMeaning(false);
		setTlA("");
		setTlC(false);
		setHzA("");
		setHzC(false);
	}, [
		sVocab.length,
		vocabPos,
		vocabOrder.length
	]);
	const nQ = useCallback(() => {
		if (!genQ.length) return;
		setQzR("");
		if (quizPos + 1 >= quizOrder.length) {
			setQuizSk((k) => k + 1);
			setQuizPos(0);
		} else setQuizPos(quizPos + 1);
	}, [
		genQ.length,
		quizPos,
		quizOrder.length
	]);
	const pQ = useCallback(() => {
		if (!genQ.length) return;
		setQzR("");
		setQuizPos((quizPos - 1 + quizOrder.length) % quizOrder.length);
	}, [
		genQ.length,
		quizPos,
		quizOrder.length
	]);
	useEffect(() => {
		const handleKeyDown = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				if (activeTab === "quiz") pQ();
				else pV();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				if (activeTab === "quiz") nQ();
				else nV();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		activeTab,
		pV,
		nV,
		pQ,
		nQ
	]);
	const title = activeTab === "vocabulary" ? "Học từ vựng" : activeTab === "translation" ? "Dịch nghĩa" : activeTab === "hanzi" ? "Chữ Hán" : "Luyện tập";
	const cnt = activeTab === "quiz" ? genQ.length : sVocab.length;
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsx("main", {
			className: "mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-8",
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-4 md:mt-6",
				children: /* @__PURE__ */ jsxs("section", {
					className: "overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:p-6",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-4 flex flex-col gap-3",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
									className: "text-lg font-bold sm:text-xl",
									children: lesson.title
								}), /* @__PURE__ */ jsx("p", {
									className: "mt-1 text-sm text-slate-500",
									children: lesson.description
								})] }),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("h2", {
										className: "text-lg font-bold sm:text-xl",
										children: title
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-slate-400 sm:text-sm",
										children: activeTab === "quiz" ? `${quizPos + 1}/${cnt}` : `${vocabPos + 1}/${cnt}`
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "-mx-1 flex flex-wrap justify-center gap-1",
									children: [
										"vocabulary",
										"translation",
										"hanzi",
										"quiz"
									].map((t) => /* @__PURE__ */ jsx("button", {
										onClick: () => sw(t),
										disabled: !sVocab.length && t !== "quiz",
										className: `rounded-full px-3 py-1.5 text-[11px] font-bold sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${activeTab === t ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"} disabled:cursor-not-allowed disabled:opacity-40`,
										children: t === "vocabulary" ? "Từ Vựng" : t === "translation" ? "Dịch Nghĩa" : t === "hanzi" ? "Chữ Hán" : "Luyện Tập"
									}, t))
								})
							]
						}),
						activeTab === "vocabulary" && sVocab.length > 0 ? /* @__PURE__ */ jsx(BookFlip, {
							pages: bookPages,
							onPageChange: handleBookPageChange
						}) : activeTab === "vocabulary" ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400",
							children: "Bài này chưa có từ vựng."
						}) : null,
						activeTab === "translation" && cVocab && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => speakChinese(cVocab.chinese),
										className: "absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3",
										children: /* @__PURE__ */ jsx(Volume2, { size: 18 })
									}),
									/* @__PURE__ */ jsx("p", {
										className: "break-all text-5xl font-black text-red-600 sm:text-6xl md:text-7xl",
										suppressHydrationWarning: true,
										children: cVocab.chinese
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-xl",
										suppressHydrationWarning: true,
										children: cVocab.pinyin
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-5",
										children: /* @__PURE__ */ jsx("input", {
											ref: translationInputRef,
											value: tlA,
											onChange: (e) => setTlA(e.target.value),
											placeholder: "Nhập nghĩa tiếng Việt...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${tlC ? tlOK ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													setTlC(true);
													e.target.blur();
												}
											}
										})
									}),
									!tlC ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setTlC(true),
										disabled: !tlA.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
									}) : null,
									tlC ? /* @__PURE__ */ jsxs("div", {
										className: "mt-3 rounded-2xl bg-amber-50 p-3 text-left",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs font-bold uppercase tracking-wide text-amber-700",
											children: "Đáp án tham khảo"
										}), /* @__PURE__ */ jsx("p", {
											className: "mt-1 text-base font-extrabold text-slate-900",
											children: cVocab.meaningVi
										})]
									}) : null,
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5",
										children: [/* @__PURE__ */ jsx(Nb, {
											onClick: pV,
											label: "Trước"
										}), /* @__PURE__ */ jsx(Nb, {
											onClick: nV,
											label: "Tiếp",
											next: true
										})]
									})
								]
							})
						}),
						activeTab === "hanzi" && cVocab && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => speakChinese(cVocab.chinese),
										className: "absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3",
										children: /* @__PURE__ */ jsx(Volume2, { size: 18 })
									}),
									/* @__PURE__ */ jsx("p", {
										className: "break-all text-4xl font-black text-red-600 sm:text-5xl",
										children: cVocab.pinyin
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 text-base text-slate-500 sm:text-lg",
										children: cVocab.meaningVi
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-5",
										children: /* @__PURE__ */ jsx("input", {
											ref: hanziInputRef,
											value: hzA,
											onChange: (e) => setHzA(e.target.value),
											placeholder: "Nhập chữ Hán...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${hzC ? hzOK ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													setHzC(true);
													e.target.blur();
												}
											}
										})
									}),
									!hzC ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setHzC(true),
										disabled: !hzA.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
									}) : null,
									hzC ? /* @__PURE__ */ jsxs("div", {
										className: "mt-3 rounded-2xl bg-amber-50 p-3 text-left",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs font-bold uppercase tracking-wide text-amber-700",
											children: "Đáp án"
										}), /* @__PURE__ */ jsx("p", {
											className: "mt-1 text-2xl font-black text-red-600",
											children: cVocab.chinese
										})]
									}) : null,
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5",
										children: [/* @__PURE__ */ jsx(Nb, {
											onClick: pV,
											label: "Trước"
										}), /* @__PURE__ */ jsx(Nb, {
											onClick: nV,
											label: "Tiếp",
											next: true
										})]
									})
								]
							})
						}),
						activeTab === "quiz" && cQuiz && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-md sm:rounded-[2rem] sm:p-6",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "-mx-1 mb-4 flex flex-wrap justify-center gap-1",
										children: [
											"meaning",
											"pinyin",
											"recognition",
											"listening"
										].map((m) => /* @__PURE__ */ jsx("button", {
											onClick: () => {
												setQzM(m);
												setQuizPos(0);
												setQzR("");
											},
											className: `rounded-full px-3 py-1.5 text-[11px] font-bold sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${qzM === m ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`,
											children: m === "meaning" ? "Nghĩa" : m === "pinyin" ? "Pinyin" : m === "recognition" ? "Chữ Hán" : "Nghe"
										}, m))
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "text-lg font-extrabold text-slate-900 sm:text-xl",
										children: cQuiz.question
									}),
									qzM === "listening" ? /* @__PURE__ */ jsxs("button", {
										onClick: () => speakChinese(cQuiz.answer),
										className: "mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
										children: [/* @__PURE__ */ jsx(Volume2, { size: 16 }), "Nghe lại"]
									}) : null,
									/* @__PURE__ */ jsx("div", {
										className: "mt-4 grid gap-2",
										children: cQuiz.options.map((opt) => {
											const s = qzR === opt;
											const c = opt === cQuiz.answer;
											return /* @__PURE__ */ jsx("button", {
												onClick: () => setQzR(opt),
												className: `rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${qzHas ? c ? "border-emerald-300 bg-emerald-50 text-emerald-700" : s ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500" : s ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`,
												children: opt
											}, opt);
										})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3",
										children: [/* @__PURE__ */ jsx(Nb, {
											onClick: pQ,
											label: "Câu trước"
										}), /* @__PURE__ */ jsx(Nb, {
											onClick: nQ,
											label: "Câu tiếp theo",
											next: true
										})]
									})
								]
							})
						})
					]
				})
			})
		})
	});
});
function Nb({ onClick, label, next }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick,
		className: `flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${next ? "flex-row-reverse" : ""}`,
		children: [next ? /* @__PURE__ */ jsx(ChevronRight, { size: 16 }) : /* @__PURE__ */ jsx(ChevronLeft, { size: 16 }), label]
	});
}
//#endregion
//#region app/routes/profile.tsx
var profile_exports = /* @__PURE__ */ __exportAll({
	action: () => action$12,
	default: () => profile_default,
	loader: () => loader$10
});
async function loader$10({ request }) {
	const { requireUser } = await Promise.resolve().then(() => auth_server_exports);
	const { prisma } = await import("./assets/db.server-DEKLN1DV.js");
	const user = await requireUser(request);
	const [totalLessons, completedLessons, inProgressLessons, quizAttempts] = await Promise.all([
		prisma.lesson.count({ where: { status: "PUBLISHED" } }),
		prisma.userProgress.count({ where: {
			userId: user.id,
			completed: true
		} }),
		prisma.userProgress.count({ where: {
			userId: user.id,
			completed: false,
			progress: { gt: 0 }
		} }),
		prisma.quizAttempt.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" }
		})
	]);
	const avgQuizScore = quizAttempts.length ? Math.round(quizAttempts.reduce((s, a) => s + a.score / a.total * 100, 0) / quizAttempts.length) : 0;
	return {
		user,
		stats: {
			totalLessons,
			completedLessons,
			inProgressLessons,
			quizAttempts: quizAttempts.length,
			averageQuizScore: avgQuizScore
		}
	};
}
async function action$12({ request }) {
	const { requireUser } = await Promise.resolve().then(() => auth_server_exports);
	const { prisma } = await import("./assets/db.server-DEKLN1DV.js");
	const user = await requireUser(request);
	const form = await request.formData();
	const intent = String(form.get("intent") || "");
	if (intent === "updateName") {
		const name = String(form.get("name") || "").trim();
		if (name.length < 2) return { error: "Tên hiển thị phải có ít nhất 2 ký tự." };
		await prisma.user.update({
			where: { id: user.id },
			data: { name }
		});
		return { success: "Đã cập nhật tên hiển thị." };
	}
	if (intent === "changePassword") {
		const currentPassword = String(form.get("currentPassword") || "");
		const newPassword = String(form.get("newPassword") || "");
		if (!currentPassword || newPassword.length < 6) return { error: "Vui lòng nhập đủ thông tin, mật khẩu mới ít nhất 6 ký tự." };
		const { verifyPassword, hashPassword } = await Promise.resolve().then(() => password_server_exports);
		const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
		if (!dbUser || !await verifyPassword(currentPassword, dbUser.password)) return { error: "Mật khẩu hiện tại không đúng." };
		await prisma.user.update({
			where: { id: user.id },
			data: { password: await hashPassword(newPassword) }
		});
		return { success: "Đã đổi mật khẩu. Vui lòng đăng nhập lại." };
	}
	return { error: "Hành động không hợp lệ." };
}
var profile_default = UNSAFE_withComponentProps(function Profile({ loaderData }) {
	const { user, stats } = loaderData;
	const actionData = useActionData();
	const navigation = useNavigation();
	const { pushToast } = useToast();
	const [displayName, setDisplayName] = useState(user.name);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [showCurrentPw, setShowCurrentPw] = useState(false);
	const [showNewPw, setShowNewPw] = useState(false);
	useEffect(() => {
		if (actionData?.success) {
			pushToast(actionData.success, "success");
			if (actionData.success.includes("mật khẩu")) {
				setCurrentPassword("");
				setNewPassword("");
			}
		}
		if (actionData?.error) pushToast(actionData.error, "error");
	}, [actionData, pushToast]);
	const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
	const isSubmitting = navigation.state === "submitting";
	return /* @__PURE__ */ jsx(SiteLayout, {
		user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-3xl px-4 py-6 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", {
						className: "text-3xl font-black text-slate-900",
						children: "Tài khoản"
					}) }), /* @__PURE__ */ jsx("div", {
						className: "flex h-12 w-12 items-center justify-center rounded-full bg-red-50",
						children: /* @__PURE__ */ jsx(Star, {
							size: 22,
							className: "text-red-600"
						})
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 rounded-[2rem] bg-gradient-to-br from-red-600 to-red-500 p-6 text-white shadow-lg shadow-red-100",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-black",
							children: initials || "U"
						}), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-2xl font-black",
								children: user.name
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-red-100",
								children: user.email
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold",
								children: [/* @__PURE__ */ jsx(ShieldCheck, { size: 14 }), user.role === "ADMIN" ? "Quản trị viên" : "Học viên"]
							})
						] })]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-8",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-extrabold text-slate-900",
						children: "Cập nhật hồ sơ"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
						children: /* @__PURE__ */ jsxs(Form, {
							method: "post",
							children: [
								/* @__PURE__ */ jsx("input", {
									type: "hidden",
									name: "intent",
									value: "updateName"
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "block",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-sm font-bold text-slate-700",
										children: "Tên hiển thị"
									}), /* @__PURE__ */ jsx("input", {
										name: "name",
										value: displayName,
										onChange: (e) => setDisplayName(e.target.value),
										className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400",
										placeholder: "Nhập tên hiển thị"
									})]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "submit",
									disabled: isSubmitting || displayName.trim().length < 2,
									className: "mt-4 flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50",
									children: [isSubmitting ? /* @__PURE__ */ jsx(Activity, {
										size: 18,
										className: "animate-spin"
									}) : /* @__PURE__ */ jsx(Save, { size: 18 }), "Lưu tên hiển thị"]
								})
							]
						})
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-extrabold text-slate-900",
						children: "Đổi mật khẩu"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
						children: /* @__PURE__ */ jsxs(Form, {
							method: "post",
							children: [
								/* @__PURE__ */ jsx("input", {
									type: "hidden",
									name: "intent",
									value: "changePassword"
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "block",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-sm font-bold text-slate-700",
										children: "Mật khẩu hiện tại"
									}), /* @__PURE__ */ jsxs("div", {
										className: "relative mt-2",
										children: [/* @__PURE__ */ jsx("input", {
											name: "currentPassword",
											type: showCurrentPw ? "text" : "password",
											value: currentPassword,
											onChange: (e) => setCurrentPassword(e.target.value),
											className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400",
											placeholder: "Nhập mật khẩu hiện tại"
										}), /* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setShowCurrentPw((p) => !p),
											className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-600",
											children: showCurrentPw ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "mt-4 block",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-sm font-bold text-slate-700",
										children: "Mật khẩu mới"
									}), /* @__PURE__ */ jsxs("div", {
										className: "relative mt-2",
										children: [/* @__PURE__ */ jsx("input", {
											name: "newPassword",
											type: showNewPw ? "text" : "password",
											value: newPassword,
											onChange: (e) => setNewPassword(e.target.value),
											className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400",
											placeholder: "Ít nhất 6 ký tự"
										}), /* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setShowNewPw((p) => !p),
											className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-600",
											children: showNewPw ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "submit",
									disabled: isSubmitting || !currentPassword || newPassword.length < 6,
									className: "mt-4 flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50",
									children: [isSubmitting ? /* @__PURE__ */ jsx(Activity, {
										size: 18,
										className: "animate-spin"
									}) : /* @__PURE__ */ jsx(ShieldCheck, { size: 18 }), "Cập nhật mật khẩu"]
								})
							]
						})
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-extrabold text-slate-900",
						children: "Thông tin ứng dụng"
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4",
						children: [
							/* @__PURE__ */ jsx(InfoRow, {
								icon: Smartphone,
								label: "Tên ứng dụng",
								value: "HSK Learning"
							}),
							/* @__PURE__ */ jsx(InfoRow, {
								icon: User,
								label: "Nhà phát triển",
								value: "Van Dinh"
							}),
							/* @__PURE__ */ jsx(InfoRow, {
								icon: Info,
								label: "Version",
								value: "1.0.0"
							})
						]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-8 mb-8",
					children: /* @__PURE__ */ jsx(Form, {
						method: "post",
						action: "/api/auth/logout",
						children: /* @__PURE__ */ jsxs("button", {
							className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-600 hover:bg-red-100 transition",
							children: [/* @__PURE__ */ jsx(LogOut, { size: 18 }), "Đăng xuất"]
						})
					})
				})
			]
		})
	});
});
function InfoRow({ icon: Icon, label, value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ jsx("div", {
			className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50",
			children: /* @__PURE__ */ jsx(Icon, {
				size: 16,
				className: "text-red-600"
			})
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
			className: "text-xs font-bold text-slate-400",
			children: label
		}), /* @__PURE__ */ jsx("p", {
			className: "font-semibold text-slate-700",
			children: value
		})] })]
	});
}
//#endregion
//#region app/routes/dashboard.tsx
var dashboard_exports = /* @__PURE__ */ __exportAll({
	default: () => dashboard_default,
	loader: () => loader$9
});
async function loader$9({ request }) {
	const user = await requireUser(request);
	const [lessonCount, vocabCount, progressCount, attempts] = await Promise.all([
		prisma.lesson.count(),
		prisma.vocabulary.count(),
		prisma.userProgress.count({ where: {
			userId: user.id,
			completed: true
		} }),
		prisma.quizAttempt.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			take: 10
		})
	]);
	return {
		user,
		lessonCount,
		vocabCount,
		progressCount,
		avg: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score / a.total * 100, 0) / attempts.length) : 0
	};
}
var dashboard_default = UNSAFE_withComponentProps(function Dashboard({ loaderData }) {
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-7xl px-4 py-8 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("h1", {
					className: "text-3xl font-extrabold",
					children: ["Tiến độ học tập của ", loaderData.user.name]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-slate-600",
					children: "Trang này theo dõi kết quả học HSK của bạn. Phần lộ trình trên lớp đã được tách sang tab Lộ trình riêng."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ jsx(Stat$1, {
							icon: BookOpen,
							value: loaderData.lessonCount,
							label: "Tổng bài học"
						}),
						/* @__PURE__ */ jsx(Stat$1, {
							icon: CheckCircle2,
							value: loaderData.progressCount,
							label: "Bài hoàn thành"
						}),
						/* @__PURE__ */ jsx(Stat$1, {
							icon: GraduationCap,
							value: loaderData.vocabCount,
							label: "Từ vựng"
						}),
						/* @__PURE__ */ jsx(Stat$1, {
							icon: Trophy,
							value: `${loaderData.avg}%`,
							label: "Điểm trung bình"
						})
					]
				})
			]
		})
	});
});
function Stat$1({ icon: Icon, value, label }) {
	return /* @__PURE__ */ jsx("div", {
		className: "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-5",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-2 sm:flex-row sm:items-center",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600",
				children: /* @__PURE__ */ jsx(Icon, { size: 20 })
			}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-xl font-black md:text-3xl",
				children: value
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs font-medium text-slate-500 md:text-sm",
				children: label
			})] })]
		})
	});
}
//#endregion
//#region app/routes/ai-assistant.tsx
var ai_assistant_exports = /* @__PURE__ */ __exportAll({
	default: () => ai_assistant_default,
	loader: () => loader$8
});
async function loader$8({ request }) {
	return { user: await getUser(request) };
}
var WELCOME_MESSAGE = {
	id: "welcome",
	role: "assistant",
	content: "Xin chào! 👋 Tôi là trợ lý AI học tiếng Trung.\n\n💬 **Chat**: Hỏi về từ vựng, ngữ pháp, phát âm...\n🧠 **Luyện tập**: AI tạo câu hỏi trắc nghiệm từ dữ liệu HSK.\n\nNhấn nút **🧠 Luyện tập** ở góc phải để bắt đầu!"
};
var ai_assistant_default = UNSAFE_withComponentProps(function AIAssistant({ loaderData }) {
	const [messages, setMessages] = useState([WELCOME_MESSAGE]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState("chat");
	const [question, setQuestion] = useState(null);
	const [selectedAnswer, setSelectedAnswer] = useState("");
	const [checked, setChecked] = useState(false);
	const [isCorrect, setIsCorrect] = useState(false);
	const [checkFeedback, setCheckFeedback] = useState("");
	const [practicing, setPracticing] = useState(false);
	const [stats, setStats] = useState({
		total: 0,
		correct: 0,
		incorrect: 0
	});
	const scrollRef = useRef(null);
	const inputRef = useRef(null);
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth"
		});
	}, [
		messages,
		question,
		checked
	]);
	const sendMessage = async () => {
		const text = input.trim();
		if (!text || loading) return;
		const userMsg = {
			id: Date.now().toString(),
			role: "user",
			content: text
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);
		try {
			const allMsgs = [...messages, userMsg].filter((m) => m.id !== "welcome").map((m) => ({
				role: m.role,
				content: m.content
			}));
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "chat",
					messages: allMsgs
				})
			})).json();
			setMessages((prev) => [...prev, {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: data.reply || data.error || "Xin lỗi, có lỗi xảy ra."
			}]);
		} catch {
			setMessages((prev) => [...prev, {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "⚠️ Không thể kết nối đến AI."
			}]);
		} finally {
			setLoading(false);
			inputRef.current?.focus();
		}
	};
	const clearChat = () => {
		setMessages([WELCOME_MESSAGE]);
		setMode("chat");
		setQuestion(null);
		setSelectedAnswer("");
		setChecked(false);
		setPracticing(false);
		setStats({
			total: 0,
			correct: 0,
			incorrect: 0
		});
	};
	const startPractice = () => {
		setMode("practice");
		setPracticing(true);
		setQuestion(null);
		setSelectedAnswer("");
		setChecked(false);
		setStats({
			total: 0,
			correct: 0,
			incorrect: 0
		});
		setMessages((prev) => [...prev.filter((m) => m.id === "welcome" || m.id.startsWith("practice-")), {
			id: "practice-start",
			role: "assistant",
			content: "🧠 **Bắt đầu luyện tập!** AI sẽ tạo câu hỏi từ dữ liệu HSK. Trả lời để kiểm tra kiến thức nhé!"
		}]);
		setTimeout(() => generateQuestion(), 300);
	};
	const generateQuestion = async () => {
		setLoading(true);
		setQuestion(null);
		setSelectedAnswer("");
		setChecked(false);
		try {
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ intent: "practice_generate" })
			})).json();
			if (data.question) setQuestion(data.question);
			else {
				setMessages((prev) => [...prev, {
					id: `err-${Date.now()}`,
					role: "assistant",
					content: `⚠️ ${data.error || "Có lỗi."}`
				}]);
				setPracticing(false);
			}
		} catch {
			setMessages((prev) => [...prev, {
				id: `err-${Date.now()}`,
				role: "assistant",
				content: "⚠️ Không thể kết nối AI."
			}]);
			setPracticing(false);
		} finally {
			setLoading(false);
		}
	};
	const checkAnswer = async () => {
		if (!selectedAnswer || !question) return;
		setChecked(true);
		setLoading(true);
		try {
			const data = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "practice_check",
					userAnswer: selectedAnswer,
					question: question.question,
					correctAnswer: question.answer
				})
			})).json();
			setIsCorrect(data.correct);
			setCheckFeedback(data.feedback);
			setStats((prev) => ({
				total: prev.total + 1,
				correct: prev.correct + (data.correct ? 1 : 0),
				incorrect: prev.incorrect + (data.correct ? 0 : 1)
			}));
		} catch {
			setCheckFeedback("");
		} finally {
			setLoading(false);
		}
	};
	const nextQuestion = () => {
		setQuestion(null);
		setSelectedAnswer("");
		setChecked(false);
		generateQuestion();
	};
	const accuracy = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto flex max-w-3xl flex-col px-4 py-6 md:py-10",
			style: { height: "calc(100vh - 5rem)" },
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: `flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition ${mode === "practice" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-purple-500 to-pink-500"}`,
							children: mode === "practice" ? /* @__PURE__ */ jsx(Brain, { size: 22 }) : /* @__PURE__ */ jsx(Sparkles, { size: 22 })
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
							className: "text-xl font-black text-slate-900",
							children: mode === "practice" ? "Luyện tập AI" : "Trợ lý AI"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-slate-500",
							children: mode === "practice" ? "Trả lời câu hỏi trắc nghiệm" : "Hỏi đáp tiếng Trung thông minh"
						})] })]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("button", {
							onClick: mode === "practice" ? () => {
								setMode("chat");
								setQuestion(null);
								setPracticing(false);
							} : startPractice,
							className: `flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition border ${mode === "practice" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"}`,
							type: "button",
							children: [mode === "practice" ? /* @__PURE__ */ jsx(MessageCircle, { size: 16 }) : /* @__PURE__ */ jsx(Brain, { size: 16 }), mode === "practice" ? "Chat" : "Luyện tập"]
						}), messages.length > 1 || mode === "practice" ? /* @__PURE__ */ jsx("button", {
							onClick: clearChat,
							className: "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition",
							type: "button",
							children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
						}) : null]
					})]
				}),
				mode === "practice" && practicing ? /* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 text-xs font-bold",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "text-slate-500",
								children: ["Đã làm: ", stats.total]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "text-emerald-600",
								children: ["✓ ", stats.correct]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "text-red-500",
								children: ["✗ ", stats.incorrect]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-sm font-black text-slate-900",
							children: [accuracy, "%"]
						}), /* @__PURE__ */ jsx("div", {
							className: "h-2 w-16 overflow-hidden rounded-full bg-white",
							children: /* @__PURE__ */ jsx("div", {
								className: "h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all",
								style: { width: `${accuracy}%` }
							})
						})]
					})]
				}) : null,
				/* @__PURE__ */ jsx("div", {
					ref: scrollRef,
					className: "mt-3 flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm",
					children: /* @__PURE__ */ jsxs("div", {
						className: "space-y-4",
						children: [
							messages.filter((m) => m.id === "welcome" || mode === "chat" || m.id.startsWith("practice-")).map((msg) => /* @__PURE__ */ jsxs("div", {
								className: `flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`,
								children: [/* @__PURE__ */ jsx("div", {
									className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-red-100 text-red-600" : mode === "practice" ? "bg-emerald-100 text-emerald-600" : "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600"}`,
									children: msg.role === "user" ? /* @__PURE__ */ jsx(User, { size: 16 }) : mode === "practice" ? /* @__PURE__ */ jsx(Brain, { size: 16 }) : /* @__PURE__ */ jsx(Bot, { size: 16 })
								}), /* @__PURE__ */ jsx("div", {
									className: `max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-red-600 text-white" : mode === "practice" ? "bg-emerald-50 text-slate-700" : "bg-slate-50 text-slate-700"}`,
									children: /* @__PURE__ */ jsx("p", {
										className: "whitespace-pre-wrap",
										children: msg.content
									})
								})]
							}, msg.id)),
							mode === "practice" && question ? /* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700",
										children: question.type === "meaning" ? "Nghĩa" : question.type === "pinyin" ? "Pinyin" : "Chữ Hán"
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "mt-3 text-lg font-extrabold text-slate-900",
										children: question.question
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-4 grid gap-2",
										children: question.options.map((opt) => {
											const sel = selectedAnswer === opt;
											const correctOpt = opt === question.answer;
											return /* @__PURE__ */ jsx("button", {
												type: "button",
												onClick: () => !checked && setSelectedAnswer(opt),
												disabled: checked,
												className: `rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${checked ? correctOpt ? "border-emerald-300 bg-emerald-50 text-emerald-700" : sel ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500" : sel ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`,
												children: opt
											}, opt);
										})
									}),
									checked ? /* @__PURE__ */ jsxs("div", {
										className: `mt-4 rounded-2xl p-4 ${isCorrect ? "bg-emerald-50" : "bg-amber-50"}`,
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2 font-bold",
												children: [isCorrect ? /* @__PURE__ */ jsx(CheckCircle2, {
													size: 18,
													className: "text-emerald-600"
												}) : /* @__PURE__ */ jsx(XCircle, {
													size: 18,
													className: "text-red-500"
												}), /* @__PURE__ */ jsx("span", {
													className: isCorrect ? "text-emerald-700" : "text-red-600",
													children: isCorrect ? "Chính xác!" : "Chưa đúng"
												})]
											}),
											checkFeedback ? /* @__PURE__ */ jsx("p", {
												className: "mt-1 text-sm text-slate-600",
												children: checkFeedback
											}) : null,
											!isCorrect && question.explanation ? /* @__PURE__ */ jsx("p", {
												className: "mt-1 text-xs text-slate-500 italic",
												children: question.explanation
											}) : null
										]
									}) : null,
									/* @__PURE__ */ jsx("div", {
										className: "mt-4",
										children: !checked ? /* @__PURE__ */ jsxs("button", {
											onClick: checkAnswer,
											disabled: !selectedAnswer || loading,
											className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 transition",
											type: "button",
											children: [loading ? /* @__PURE__ */ jsx(Loader2, {
												size: 18,
												className: "animate-spin"
											}) : /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }), "Kiểm tra"]
										}) : /* @__PURE__ */ jsxs("button", {
											onClick: nextQuestion,
											className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition",
											type: "button",
											children: [/* @__PURE__ */ jsx(ChevronRight, { size: 18 }), "Câu tiếp theo"]
										})
									})
								]
							}) : null,
							mode === "practice" && loading && !question ? /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 rounded-2xl bg-emerald-50/50 px-4 py-3",
								children: [/* @__PURE__ */ jsx(Loader2, {
									size: 18,
									className: "animate-spin text-emerald-500"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-sm font-semibold text-slate-400",
									children: "AI đang tạo câu hỏi..."
								})]
							}) : null,
							mode === "chat" && loading ? /* @__PURE__ */ jsxs("div", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600",
									children: /* @__PURE__ */ jsx(Bot, { size: 16 })
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3",
									children: [/* @__PURE__ */ jsx(Loader2, {
										size: 16,
										className: "animate-spin text-purple-500"
									}), /* @__PURE__ */ jsx("span", {
										className: "text-sm text-slate-400",
										children: "Đang trả lời..."
									})]
								})]
							}) : null
						]
					})
				}),
				mode === "chat" && messages.length <= 1 ? /* @__PURE__ */ jsx("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						"Từ 你好 nghĩa là gì?",
						"Giải thích ngữ pháp 把",
						"Cách phân biệt 的 地 得",
						"Luyện HSK 3 cần học gì?"
					].map((q) => /* @__PURE__ */ jsx("button", {
						onClick: () => {
							setInput(q);
							inputRef.current?.focus();
						},
						className: "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition",
						type: "button",
						children: q
					}, q))
				}) : null,
				mode === "practice" && stats.total >= 5 && !question ? /* @__PURE__ */ jsx("div", {
					className: "mt-3 flex gap-2",
					children: /* @__PURE__ */ jsxs("button", {
						onClick: () => {
							setMode("chat");
							setQuestion(null);
							setPracticing(false);
							setStats({
								total: 0,
								correct: 0,
								incorrect: 0
							});
						},
						className: "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition",
						type: "button",
						children: [/* @__PURE__ */ jsx(RefreshCw, { size: 16 }), "Làm lại"]
					})
				}) : null,
				mode === "chat" ? /* @__PURE__ */ jsxs("form", {
					onSubmit: (e) => {
						e.preventDefault();
						sendMessage();
					},
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ jsx("input", {
						ref: inputRef,
						value: input,
						onChange: (e) => setInput(e.target.value),
						placeholder: "Hỏi về từ vựng, ngữ pháp, phát âm...",
						className: "flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100",
						disabled: loading
					}), /* @__PURE__ */ jsx("button", {
						type: "submit",
						disabled: !input.trim() || loading,
						className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 transition",
						children: loading ? /* @__PURE__ */ jsx(Loader2, {
							size: 18,
							className: "animate-spin"
						}) : /* @__PURE__ */ jsx(Send, { size: 18 })
					})]
				}) : null
			]
		})
	});
});
//#endregion
//#region app/routes/ai-practice.tsx
var ai_practice_exports = /* @__PURE__ */ __exportAll({
	default: () => ai_practice_default,
	loader: () => loader$7
});
async function loader$7({ request }) {
	return {
		user: await getUser(request),
		lessons: await prisma.lesson.findMany({
			where: { status: "PUBLISHED" },
			select: {
				id: true,
				title: true,
				level: true,
				source: true
			},
			orderBy: [{ level: "asc" }, { orderNo: "asc" }],
			take: 50
		})
	};
}
var ai_practice_default = UNSAFE_withComponentProps(function AIPractice({ loaderData }) {
	const [selectedLessons, setSelectedLessons] = useState([]);
	const [started, setStarted] = useState(false);
	const [question, setQuestion] = useState(null);
	const [selectedAnswer, setSelectedAnswer] = useState("");
	const [checked, setChecked] = useState(false);
	const [correct, setCorrect] = useState(false);
	const [feedback, setFeedback] = useState("");
	const [loading, setLoading] = useState(false);
	const [history, setHistory] = useState([]);
	const [stats, setStats] = useState({
		total: 0,
		correct: 0,
		incorrect: 0
	});
	const scrollRef = useRef(null);
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth"
		});
	}, [question, history]);
	const toggleLesson = (id) => {
		setSelectedLessons((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	};
	const generateQuestion = async () => {
		setLoading(true);
		setSelectedAnswer("");
		setChecked(false);
		setCorrect(false);
		setFeedback("");
		try {
			const data = await (await fetch("/api/ai/practice", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "generate",
					lessonIds: selectedLessons,
					history
				})
			})).json();
			if (data.question) setQuestion(data.question);
			else setFeedback(data.error || "Có lỗi xảy ra.");
		} catch {
			setFeedback("Không thể kết nối AI.");
		} finally {
			setLoading(false);
		}
	};
	const startPractice = () => {
		setStarted(true);
		setHistory([]);
		setStats({
			total: 0,
			correct: 0,
			incorrect: 0
		});
		setTimeout(() => generateQuestion(), 100);
	};
	const checkAnswer = async () => {
		if (!selectedAnswer || !question) return;
		setLoading(true);
		try {
			const newHistory = [...history, {
				q: question.question,
				a: question.answer,
				correct: false
			}];
			const data = await (await fetch("/api/ai/practice", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "check",
					questionId: question.id,
					userAnswer: selectedAnswer,
					history: newHistory
				})
			})).json();
			const isCorrect = selectedAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
			setCorrect(isCorrect);
			setChecked(true);
			setFeedback(data.feedback || (isCorrect ? "Chính xác! 🎉" : `Đáp án đúng: ${question.answer}`));
			setHistory((prev) => [...prev, {
				q: question.question,
				a: question.answer,
				correct: isCorrect
			}]);
			setStats((prev) => ({
				total: prev.total + 1,
				correct: prev.correct + (isCorrect ? 1 : 0),
				incorrect: prev.incorrect + (isCorrect ? 0 : 1)
			}));
		} catch {
			setFeedback("Có lỗi khi kiểm tra.");
		} finally {
			setLoading(false);
		}
	};
	const nextQuestion = () => {
		setSelectedAnswer("");
		setChecked(false);
		setCorrect(false);
		setFeedback("");
		generateQuestion();
	};
	const accuracy = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-3xl px-4 py-6 md:py-10",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm",
					children: /* @__PURE__ */ jsx(Brain, { size: 24 })
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-black text-slate-900",
					children: "Luyện tập với AI"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-slate-500",
					children: "AI tạo câu hỏi thông minh từ từ vựng của bạn"
				})] })]
			}), !started ? /* @__PURE__ */ jsxs("div", {
				className: "mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-bold text-slate-900",
						children: "Chọn bài học để luyện tập"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-slate-500",
						children: "Nếu không chọn, AI sẽ lấy từ vựng ngẫu nhiên trong toàn bộ dữ liệu."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-4 grid gap-2 sm:grid-cols-2",
						children: loaderData.lessons.map((lesson) => /* @__PURE__ */ jsxs("button", {
							onClick: () => toggleLesson(lesson.id),
							className: `rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedLessons.includes(lesson.id) ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`,
							type: "button",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "text-xs text-slate-400",
									children: lesson.source || "HSK"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-0.5",
									children: lesson.title
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-xs font-bold text-slate-400",
									children: lesson.level
								})
							]
						}, lesson.id))
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: startPractice,
						className: "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-4 font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition",
						type: "button",
						children: [/* @__PURE__ */ jsx(Sparkles, { size: 20 }), "Bắt đầu luyện tập với AI"]
					})
				]
			}) : /* @__PURE__ */ jsxs("div", {
				ref: scrollRef,
				className: "mt-6 space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 text-sm font-bold",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "text-slate-400",
									children: ["Đã làm: ", stats.total]
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "text-emerald-600",
									children: ["✓ ", stats.correct]
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "text-red-500",
									children: ["✗ ", stats.incorrect]
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "text-lg font-black text-slate-900",
								children: [accuracy, "%"]
							}), /* @__PURE__ */ jsx("div", {
								className: "h-2 w-20 overflow-hidden rounded-full bg-slate-100",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all",
									style: { width: `${accuracy}%` }
								})
							})]
						})]
					}),
					loading && !question ? /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12",
						children: [/* @__PURE__ */ jsx(Loader2, {
							size: 32,
							className: "animate-spin text-emerald-500"
						}), /* @__PURE__ */ jsx("span", {
							className: "ml-3 text-sm font-semibold text-slate-400",
							children: "AI đang tạo câu hỏi..."
						})]
					}) : question ? /* @__PURE__ */ jsxs("div", {
						className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700",
								children: question.type === "meaning" ? "Nghĩa" : question.type === "pinyin" ? "Pinyin" : "Chữ Hán"
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-4 text-xl font-extrabold text-slate-900",
								children: question.question
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-6 grid gap-3",
								children: question.options.map((opt) => {
									const isSelected = selectedAnswer === opt;
									const isCorrectOpt = opt === question.answer;
									return /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => !checked && setSelectedAnswer(opt),
										className: `rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${checked ? isCorrectOpt ? "border-emerald-300 bg-emerald-50 text-emerald-700" : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-600" : isSelected ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`,
										disabled: checked,
										children: opt
									}, opt);
								})
							}),
							checked ? /* @__PURE__ */ jsxs("div", {
								className: `mt-5 rounded-2xl p-4 ${correct ? "bg-emerald-50" : "bg-amber-50"}`,
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 font-bold",
										children: [correct ? /* @__PURE__ */ jsx(CheckCircle2, {
											size: 20,
											className: "text-emerald-600"
										}) : /* @__PURE__ */ jsx(XCircle, {
											size: 20,
											className: "text-red-500"
										}), /* @__PURE__ */ jsx("span", {
											className: correct ? "text-emerald-700" : "text-red-600",
											children: correct ? "Chính xác!" : "Chưa đúng"
										})]
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm leading-6 text-slate-600",
										children: feedback
									}),
									question.explanation ? /* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm text-slate-500 italic",
										children: question.explanation
									}) : null
								]
							}) : null,
							/* @__PURE__ */ jsx("div", {
								className: "mt-6 grid grid-cols-2 gap-2",
								children: !checked ? /* @__PURE__ */ jsxs("button", {
									onClick: checkAnswer,
									disabled: !selectedAnswer || loading,
									className: "col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 transition",
									type: "button",
									children: [loading ? /* @__PURE__ */ jsx(Loader2, {
										size: 18,
										className: "animate-spin"
									}) : /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }), "Kiểm tra"]
								}) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("button", {
									onClick: nextQuestion,
									className: "col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition",
									type: "button",
									children: [/* @__PURE__ */ jsx(ChevronRight, { size: 18 }), "Câu tiếp theo"]
								}) })
							})
						]
					}) : null,
					feedback && !question && !loading ? /* @__PURE__ */ jsx("div", {
						className: "rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600",
						children: feedback
					}) : null,
					stats.total >= 5 ? /* @__PURE__ */ jsxs("button", {
						onClick: () => {
							setStarted(false);
							setQuestion(null);
							setHistory([]);
							setStats({
								total: 0,
								correct: 0,
								incorrect: 0
							});
						},
						className: "flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition",
						type: "button",
						children: [/* @__PURE__ */ jsx(RefreshCw, { size: 18 }), "Làm lại từ đầu (chọn bài khác)"]
					}) : null
				]
			})]
		})
	});
});
//#endregion
//#region app/routes/admin.tsx
var admin_exports = /* @__PURE__ */ __exportAll({
	action: () => action$11,
	default: () => admin_default,
	loader: () => loader$6
});
async function loader$6({ request }) {
	const user = await requireAdmin(request);
	const [lessonCount, vocabCount, quizCount, userCount, roadmapCount, lessons, roadmapItems] = await Promise.all([
		prisma.lesson.count(),
		prisma.vocabulary.count(),
		prisma.quizQuestion.count(),
		prisma.user.count(),
		prisma.roadmapItem.count(),
		prisma.lesson.findMany({
			include: { _count: { select: {
				vocabularies: true,
				quizzes: true
			} } },
			orderBy: [{ level: "asc" }, { orderNo: "asc" }]
		}),
		prisma.roadmapItem.findMany({
			orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
			take: 20
		})
	]);
	return {
		user,
		lessonCount,
		vocabCount,
		quizCount,
		userCount,
		roadmapCount,
		lessons,
		roadmapItems
	};
}
async function action$11({ request }) {
	await requireAdmin(request);
	const form = await request.formData();
	const intent = String(form.get("intent") || "lesson-import");
	if (intent === "lesson-delete") return deleteLesson(form);
	if (intent === "lesson-delete-all") return deleteAllLessons();
	if (intent === "roadmap-delete") return deleteRoadmapItem(form);
	if (intent === "roadmap-import") return importRoadmap(form);
	return importLessons(form);
}
async function deleteLesson(form) {
	const lessonId = String(form.get("lessonId") || "").trim();
	if (!lessonId) return { deleteError: "Thiếu mã bài học để xóa." };
	await prisma.lesson.delete({ where: { id: lessonId } });
	return { deleteSuccess: "Đã xóa bài học." };
}
async function deleteAllLessons() {
	const deleted = await prisma.lesson.deleteMany();
	return { deleteSuccess: deleted.count > 0 ? `Đã xóa toàn bộ ${deleted.count} bài học.` : "Không có bài học nào để xóa." };
}
async function deleteRoadmapItem(form) {
	const roadmapItemId = String(form.get("roadmapItemId") || "").trim();
	if (!roadmapItemId) return { roadmapDeleteError: "Thiếu mã lộ trình để xóa." };
	await prisma.roadmapItem.delete({ where: { id: roadmapItemId } });
	return { roadmapDeleteSuccess: "Đã xóa mục lộ trình." };
}
async function importLessons(form) {
	const file = form.get("jsonFile");
	const source = String(form.get("source") || "HSK20").trim();
	if (!file || file.size === 0) return { error: "Vui lòng chọn file JSON." };
	try {
		const rawText = await file.text();
		const json = JSON.parse(rawText);
		const rawItems = Array.isArray(json) ? json : json.lessons || json.data || [];
		if (!rawItems.length) return { error: "File JSON rỗng." };
		let lessonCount = 0;
		let vocabCount = 0;
		for (const item of rawItems) {
			const record = item;
			const title = String(record.title || record.name || "Bài học").trim();
			const level = String(record.level || record.phase || "HSK1").trim();
			const orderNo = Number(record.orderNo || record.order || 1);
			const description = record.description ? String(record.description) : null;
			const vocabularies = (Array.isArray(record.vocabularies) ? record.vocabularies : Array.isArray(record.vocabulary) ? record.vocabulary : []).map((v) => {
				const w = v;
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
					level: String(w.level || level)
				};
			}).filter((v) => v != null);
			if (!vocabularies.length) continue;
			await prisma.lesson.create({ data: {
				title,
				description: description || `Bài học ${source}`,
				level,
				source,
				orderNo,
				status: "PUBLISHED",
				vocabularies: { create: vocabularies }
			} });
			lessonCount++;
			vocabCount += vocabularies.length;
		}
		return { success: `Đã import ${lessonCount} bài học, ${vocabCount} từ vựng.` };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Lỗi import file." };
	}
}
async function importRoadmap(form) {
	const file = form.get("roadmapFile");
	if (!file || file.size === 0) return { roadmapError: "Vui lòng chọn file JSON lộ trình." };
	const rawText = await file.text();
	const json = JSON.parse(rawText);
	const normalized = (Array.isArray(json) ? json : json.roadmap || json.items || json.data || []).map(normalizeRoadmapItem).filter((item) => Boolean(item));
	if (!normalized.length) return { roadmapError: "Không tìm thấy mục lộ trình hợp lệ." };
	await prisma.$transaction(normalized.map((item) => prisma.roadmapItem.create({ data: {
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
		phrases: item.phrases
	} })));
	return { roadmapSuccess: `Đã import ${normalized.length} mục vào lộ trình.` };
}
var admin_default = UNSAFE_withComponentProps(function Admin({ loaderData }) {
	const lessonImportFetcher = useFetcher();
	const roadmapImportFetcher = useFetcher();
	const revalidator = useRevalidator();
	const { pushToast } = useToast();
	const [lessonFile, setLessonFile] = useState(null);
	const [roadmapFile, setRoadmapFile] = useState(null);
	const [lessonInputKey, setLessonInputKey] = useState(0);
	const [roadmapInputKey, setRoadmapInputKey] = useState(0);
	const roadmapProgress = useRotatingStatus(roadmapImportFetcher.state !== "idle", [
		"Đang tải file lộ trình từ thiết bị lên...",
		"Đang chuẩn hóa dữ liệu lộ trình...",
		"Đang lưu các mục lộ trình vào hệ thống..."
	]);
	const roadmapItems = loaderData.roadmapItems;
	useFetcherToast(roadmapImportFetcher, {
		successKey: "roadmapSuccess",
		errorKey: "roadmapError",
		onSuccess: () => revalidator.revalidate()
	});
	useFetcherToast(lessonImportFetcher, {
		successKey: "success",
		errorKey: "error",
		onSuccess: () => {
			revalidator.revalidate();
			setLessonFile(null);
			setLessonInputKey((k) => k + 1);
		}
	});
	const lessonImportBusy = lessonImportFetcher.state !== "idle";
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-7xl px-4 py-8 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5",
					children: [
						/* @__PURE__ */ jsx(Stat, {
							icon: Users,
							value: loaderData.userCount,
							label: "Người dùng"
						}),
						/* @__PURE__ */ jsx(Stat, {
							icon: BookOpen,
							value: loaderData.lessonCount,
							label: "Bài học"
						}),
						/* @__PURE__ */ jsx(Stat, {
							icon: GraduationCap,
							value: loaderData.vocabCount,
							label: "Từ vựng"
						}),
						/* @__PURE__ */ jsx(Stat, {
							icon: ListChecks,
							value: loaderData.quizCount,
							label: "Câu hỏi"
						}),
						/* @__PURE__ */ jsx(Stat, {
							icon: GitBranch,
							value: loaderData.roadmapCount,
							label: "Mục lộ trình"
						})
					]
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "mt-6 grid gap-6 xl:grid-cols-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70",
						children: [/* @__PURE__ */ jsx("div", {
							className: "border-b border-slate-100 bg-gradient-to-r from-red-50 via-white to-white p-5 md:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600",
									children: /* @__PURE__ */ jsx(FileJson, { size: 22 })
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-xs font-black uppercase tracking-[0.22em] text-red-500",
									children: "Import"
								}), /* @__PURE__ */ jsx("h2", {
									className: "mt-1 text-xl font-black",
									children: "Import bài học HSK"
								})] })]
							})
						}), /* @__PURE__ */ jsx("div", {
							className: "p-5 md:p-6",
							children: /* @__PURE__ */ jsxs(lessonImportFetcher.Form, {
								action: "/api/admin/lesson-import",
								method: "post",
								encType: "multipart/form-data",
								className: "space-y-4",
								children: [
									/* @__PURE__ */ jsx("input", {
										type: "hidden",
										name: "intent",
										value: "lesson-import"
									}),
									/* @__PURE__ */ jsx(FilePickerField, {
										file: lessonFile,
										idleTitle: "Chọn JSON bài học",
										idleHint: "Bấm để chọn file từ thiết bị",
										onClear: () => {
											setLessonFile(null);
											setLessonInputKey((current) => current + 1);
										},
										children: /* @__PURE__ */ jsx("input", {
											type: "file",
											name: "jsonFile",
											accept: ".json,application/json",
											className: "hidden",
											onChange: (event) => setLessonFile(toFileSelection(event.currentTarget.files?.[0]))
										})
									}, lessonInputKey),
									/* @__PURE__ */ jsxs("label", {
										className: "block",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-sm font-bold text-slate-700",
											children: "Nguồn dữ liệu"
										}), /* @__PURE__ */ jsxs("select", {
											name: "source",
											defaultValue: "HSK20",
											className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-red-400",
											children: [/* @__PURE__ */ jsx("option", {
												value: "HSK20",
												children: "HSK 2.0"
											}), /* @__PURE__ */ jsx("option", {
												value: "HSK30",
												children: "HSK 3.0"
											})]
										})]
									}),
									/* @__PURE__ */ jsx("button", {
										disabled: lessonImportBusy,
										className: "w-full rounded-2xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70",
										children: lessonImportBusy ? "Đang xử lý..." : "Import bài học"
									})
								]
							})
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70",
						children: [/* @__PURE__ */ jsx("div", {
							className: "border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-white p-5 md:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600",
									children: /* @__PURE__ */ jsx(GitBranch, { size: 22 })
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-xs font-black uppercase tracking-[0.22em] text-amber-500",
									children: "Class Roadmap"
								}), /* @__PURE__ */ jsx("h2", {
									className: "mt-1 text-xl font-black",
									children: "Import lộ trình lớp"
								})] })]
							})
						}), /* @__PURE__ */ jsxs("div", {
							className: "p-5 md:p-6",
							children: [/* @__PURE__ */ jsxs(roadmapImportFetcher.Form, {
								method: "post",
								encType: "multipart/form-data",
								className: "space-y-4",
								children: [
									/* @__PURE__ */ jsx("input", {
										type: "hidden",
										name: "intent",
										value: "roadmap-import"
									}),
									/* @__PURE__ */ jsx(FilePickerField, {
										file: roadmapFile,
										idleTitle: "Chọn JSON lộ trình",
										idleHint: "Nhận file roadmap riêng, không lẫn với bài học",
										onClear: () => {
											setRoadmapFile(null);
											setRoadmapInputKey((current) => current + 1);
										},
										children: /* @__PURE__ */ jsx("input", {
											type: "file",
											name: "roadmapFile",
											accept: ".json,application/json",
											className: "hidden",
											onChange: (event) => setRoadmapFile(toFileSelection(event.currentTarget.files?.[0]))
										})
									}, roadmapInputKey),
									/* @__PURE__ */ jsx("button", {
										disabled: roadmapImportFetcher.state !== "idle",
										className: "w-full rounded-2xl bg-slate-900 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70",
										children: roadmapImportFetcher.state === "idle" ? "Import lộ trình" : "Đang xử lý..."
									})
								]
							}), roadmapImportFetcher.state !== "idle" ? /* @__PURE__ */ jsx("div", {
								className: "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700",
								children: roadmapProgress
							}) : null]
						})]
					})]
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "mt-6 grid gap-6 xl:grid-cols-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex h-[40rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-black uppercase tracking-[0.2em] text-slate-400",
								children: "Lessons"
							}), /* @__PURE__ */ jsx("h2", {
								className: "mt-1 text-lg font-black",
								children: "Danh sách bài học HSK"
							})] }), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200",
									children: [loaderData.lessons.length, " bài"]
								}), /* @__PURE__ */ jsx(DeleteAllLessonsButton, { disabled: !loaderData.lessons.length })]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "flex-1 overflow-auto",
							children: /* @__PURE__ */ jsxs("table", {
								className: "w-full min-w-[760px] text-left text-sm",
								children: [/* @__PURE__ */ jsx("thead", {
									className: "bg-slate-50 text-slate-500",
									children: /* @__PURE__ */ jsxs("tr", { children: [
										/* @__PURE__ */ jsx("th", {
											className: "px-6 py-4",
											children: "Tên bài"
										}),
										/* @__PURE__ */ jsx("th", {
											className: "px-6 py-4",
											children: "Cấp độ"
										}),
										/* @__PURE__ */ jsx("th", {
											className: "px-6 py-4",
											children: "Từ vựng"
										}),
										/* @__PURE__ */ jsx("th", {
											className: "px-6 py-4 text-right",
											children: "Thao tác"
										})
									] })
								}), /* @__PURE__ */ jsx("tbody", { children: loaderData.lessons.map((lesson) => /* @__PURE__ */ jsxs("tr", {
									className: "border-t border-slate-100",
									children: [
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-4 font-semibold",
											children: lesson.title
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-4",
											children: /* @__PURE__ */ jsx("span", {
												className: "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600",
												children: lesson.level
											})
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-4",
											children: lesson._count.vocabularies
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-4 text-right",
											children: /* @__PURE__ */ jsx(LessonDeleteButton, {
												lessonId: lesson.id,
												lessonTitle: lesson.title
											})
										})
									]
								}, lesson.id)) })]
							})
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex h-[40rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-black uppercase tracking-[0.2em] text-slate-400",
								children: "Roadmap"
							}), /* @__PURE__ */ jsx("h2", {
								className: "mt-1 text-lg font-black",
								children: "Danh sách lộ trình lớp"
							})] }), /* @__PURE__ */ jsxs("span", {
								className: "rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200",
								children: [roadmapItems.length, " mục"]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "flex-1 overflow-y-auto divide-y divide-slate-100",
							children: roadmapItems.map((item) => /* @__PURE__ */ jsxs("div", {
								className: "p-5",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex flex-wrap items-start justify-between gap-3",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
											className: "flex flex-wrap items-center gap-2",
											children: [
												/* @__PURE__ */ jsxs("span", {
													className: "rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white",
													children: ["Buổi ", item.orderNo]
												}),
												/* @__PURE__ */ jsx("span", {
													className: "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700",
													children: item.phase
												}),
												item.weekLabel ? /* @__PURE__ */ jsx("span", {
													className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600",
													children: item.weekLabel
												}) : null
											]
										}), /* @__PURE__ */ jsx("h3", {
											className: "mt-3 text-lg font-black",
											children: item.title
										})] }), item.duration ? /* @__PURE__ */ jsx("span", {
											className: "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600",
											children: item.duration
										}) : null]
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm leading-6 text-slate-600",
										children: item.description || "Chưa có mô tả."
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-3 flex flex-wrap gap-2 text-xs",
										children: [/* @__PURE__ */ jsxs("span", {
											className: "rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600",
											children: [countJsonArray(item.vocabulary), " từ"]
										}), /* @__PURE__ */ jsxs("span", {
											className: "rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600",
											children: [countJsonArray(item.phrases), " mẫu câu"]
										})]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-4",
										children: /* @__PURE__ */ jsx(RoadmapDeleteButton, {
											roadmapItemId: item.id,
											title: item.title
										})
									})
								]
							}, item.id))
						})]
					})]
				})
			]
		})
	});
});
function LessonDeleteButton({ lessonId, lessonTitle }) {
	const fetcher = useFetcher();
	const revalidator = useRevalidator();
	useFetcherToast(fetcher, {
		successKey: "deleteSuccess",
		errorKey: "deleteError",
		onSuccess: () => revalidator.revalidate()
	});
	return /* @__PURE__ */ jsxs(fetcher.Form, {
		method: "post",
		children: [
			/* @__PURE__ */ jsx("input", {
				type: "hidden",
				name: "intent",
				value: "lesson-delete"
			}),
			/* @__PURE__ */ jsx("input", {
				type: "hidden",
				name: "lessonId",
				value: lessonId
			}),
			/* @__PURE__ */ jsx("button", {
				type: "submit",
				disabled: fetcher.state !== "idle",
				className: "rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70",
				onClick: (event) => {
					if (!window.confirm(`Xóa bài học "${lessonTitle}"?`)) event.preventDefault();
				},
				children: fetcher.state === "idle" ? "Xóa" : "Đang xóa..."
			})
		]
	});
}
function RoadmapDeleteButton({ roadmapItemId, title }) {
	const fetcher = useFetcher();
	const revalidator = useRevalidator();
	useFetcherToast(fetcher, {
		successKey: "roadmapDeleteSuccess",
		errorKey: "roadmapDeleteError",
		onSuccess: () => revalidator.revalidate()
	});
	return /* @__PURE__ */ jsxs(fetcher.Form, {
		method: "post",
		children: [
			/* @__PURE__ */ jsx("input", {
				type: "hidden",
				name: "intent",
				value: "roadmap-delete"
			}),
			/* @__PURE__ */ jsx("input", {
				type: "hidden",
				name: "roadmapItemId",
				value: roadmapItemId
			}),
			/* @__PURE__ */ jsx("button", {
				type: "submit",
				disabled: fetcher.state !== "idle",
				className: "rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70",
				onClick: (event) => {
					if (!window.confirm(`Xóa mục lộ trình "${title}"?`)) event.preventDefault();
				},
				children: fetcher.state === "idle" ? "Xóa mục này" : "Đang xóa..."
			})
		]
	});
}
function DeleteAllLessonsButton({ disabled }) {
	const fetcher = useFetcher();
	const revalidator = useRevalidator();
	useFetcherToast(fetcher, {
		successKey: "deleteSuccess",
		errorKey: "deleteError",
		onSuccess: () => revalidator.revalidate()
	});
	return /* @__PURE__ */ jsxs(fetcher.Form, {
		method: "post",
		children: [/* @__PURE__ */ jsx("input", {
			type: "hidden",
			name: "intent",
			value: "lesson-delete-all"
		}), /* @__PURE__ */ jsx("button", {
			type: "submit",
			disabled: disabled || fetcher.state !== "idle",
			className: "rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
			onClick: (event) => {
				if (!window.confirm("Xóa toàn bộ bài học HSK đã import?")) event.preventDefault();
			},
			children: fetcher.state === "idle" ? "Xóa tất cả" : "Đang xóa..."
		})]
	});
}
function useRotatingStatus(active, messages) {
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
function useFetcherToast(fetcher, options) {
	const { pushToast } = useToast();
	const lastPayloadRef = useRef(null);
	const { successKey, errorKey, onSuccess } = options;
	useEffect(() => {
		if (fetcher.state !== "idle" || !fetcher.data) return;
		const payload = JSON.stringify(fetcher.data);
		if (payload === lastPayloadRef.current) return;
		lastPayloadRef.current = payload;
		const data = fetcher.data;
		const successMessage = data[successKey];
		const errorMessage = data[errorKey];
		if (typeof successMessage === "string" && successMessage) {
			pushToast(successMessage, "success");
			onSuccess?.();
			return;
		}
		if (typeof errorMessage === "string" && errorMessage) pushToast(errorMessage, "error");
	}, [
		errorKey,
		fetcher.data,
		fetcher.state,
		onSuccess,
		pushToast,
		successKey
	]);
}
function FilePickerField({ children, file, idleTitle, idleHint, onClear, className = "" }) {
	return /* @__PURE__ */ jsxs("label", {
		className: `group flex cursor-pointer items-center gap-4 rounded-[1.75rem] border px-4 py-4 transition ${file ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/40"} ${className}`,
		children: [
			/* @__PURE__ */ jsx("div", {
				className: `flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${file ? "bg-emerald-100 text-emerald-600" : "bg-white text-red-600"}`,
				children: /* @__PURE__ */ jsx(Upload, { size: 20 })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ jsx("p", {
					className: "truncate text-sm font-black text-slate-900",
					children: file ? file.name : idleTitle
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs font-medium text-slate-500",
					children: file ? `Đã chọn • ${file.sizeLabel}` : idleHint
				})]
			}),
			file ? /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: (event) => {
					event.preventDefault();
					onClear();
				},
				className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-red-600",
				"aria-label": "Bỏ chọn file",
				children: /* @__PURE__ */ jsx(X, { size: 16 })
			}) : /* @__PURE__ */ jsx("span", {
				className: "shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm",
				children: "JSON"
			}),
			children
		]
	});
}
function toFileSelection(file) {
	if (!file) return null;
	return {
		name: file.name,
		sizeLabel: formatFileSize(file.size)
	};
}
function formatFileSize(size) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
function Stat({ icon: Icon, value, label }) {
	return /* @__PURE__ */ jsx("div", {
		className: "rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600",
				children: /* @__PURE__ */ jsx(Icon, { size: 20 })
			}), /* @__PURE__ */ jsxs("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-xl font-black md:text-3xl",
					children: value
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400 md:text-[11px]",
					children: label
				})]
			})]
		})
	});
}
function normalizeRoadmapItem(item) {
	if (!item || typeof item !== "object") return null;
	const title = String(item.title || item.name || item.sessionTitle || "").trim();
	if (!title) return null;
	return {
		title,
		description: optionalString$1(item.description || item.desc || item.summary),
		phase: optionalString$1(item.phase || item.stage || item.module) || "Giai đoạn 1",
		weekLabel: optionalString$1(item.weekLabel || item.week || item.schedule),
		level: optionalString$1(item.level || item.classLevel || item.targetLevel),
		orderNo: Number(item.orderNo || item.order || item.sessionNo || item.buoi || 1),
		duration: optionalString$1(item.duration || item.durationLabel || item.time),
		objectives: toJsonArray(item.objectives || item.goals || item.targets),
		materials: toJsonArray(item.materials || item.resources || item.documents),
		vocabulary: toJsonObjectArray(item.vocabulary || item.vocabularies || item.words),
		phrases: toJsonObjectArray(item.phrases || item.sentences || item.patterns)
	};
}
function optionalString$1(value) {
	return (typeof value === "string" ? value.trim() : "") || null;
}
function toJsonArray(value) {
	if (Array.isArray(value)) return value.map((item) => String(item));
	if (typeof value === "string" && value.trim()) return [value.trim()];
}
function toJsonObjectArray(value) {
	if (!Array.isArray(value)) return void 0;
	const items = value.filter((item) => item && typeof item === "object").map((item) => item);
	return items.length ? items : void 0;
}
function countJsonArray(value) {
	return Array.isArray(value) ? value.length : 0;
}
//#endregion
//#region app/lib/password.server.ts
var password_server_exports = /* @__PURE__ */ __exportAll({
	hashPassword: () => hashPassword,
	verifyPassword: () => verifyPassword
});
function hashPassword(password) {
	return bcrypt.hash(password, 10);
}
function verifyPassword(password, hashedPassword) {
	return bcrypt.compare(password, hashedPassword);
}
//#endregion
//#region app/routes/api.auth.login.ts
var api_auth_login_exports = /* @__PURE__ */ __exportAll({ action: () => action$10 });
async function action$10({ request }) {
	const body = await request.json();
	const user = await prisma.user.findUnique({ where: { email: String(body.email || "").toLowerCase() } });
	if (!user || !await verifyPassword(String(body.password || ""), user.password)) return data({ message: "Email hoặc mật khẩu không đúng." }, { status: 401 });
	const session = await getSession(request);
	session.set("userId", user.id);
	return data({ user: {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role
	} }, { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } });
}
//#endregion
//#region app/routes/api.auth.register.ts
var api_auth_register_exports = /* @__PURE__ */ __exportAll({ action: () => action$9 });
async function action$9({ request }) {
	const body = await request.json();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim().toLowerCase();
	const password = String(body.password || "");
	if (!name || !email || password.length < 6) return data({ message: "Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự." }, { status: 400 });
	if (await prisma.user.findUnique({ where: { email } })) return data({ message: "Email đã tồn tại." }, { status: 409 });
	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: await hashPassword(password)
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true
		}
	});
	const session = await getSession(request);
	session.set("userId", user.id);
	return data({ user }, { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } });
}
//#endregion
//#region app/routes/api.auth.logout.ts
var api_auth_logout_exports = /* @__PURE__ */ __exportAll({ action: () => action$8 });
async function action$8({ request }) {
	return destroyUserSession(request);
}
//#endregion
//#region app/lib/mobile-auth.server.ts
var tokenSecret = process.env.SESSION_SECRET?.trim() || "dev_secret_change_me";
function toBase64Url(value) {
	return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(value) {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - normalized.length % 4);
	return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}
function sign(input) {
	return createHmac("sha256", tokenSecret).update(input).digest("base64url");
}
function createMobileToken(userId, expiresInDays = 30) {
	const payload = {
		userId,
		exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1e3
	};
	const encodedPayload = toBase64Url(JSON.stringify(payload));
	return `${encodedPayload}.${sign(encodedPayload)}`;
}
function verifyMobileToken(token) {
	const [encodedPayload, signature] = token.split(".");
	if (!encodedPayload || !signature) return null;
	const expectedSignature = sign(encodedPayload);
	if (!(signature.length === expectedSignature.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)))) return null;
	try {
		const payload = JSON.parse(fromBase64Url(encodedPayload));
		if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
		return payload;
	} catch {
		return null;
	}
}
async function requireMobileUser(request) {
	const authHeader = request.headers.get("Authorization") || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
	if (!token) return null;
	const payload = verifyMobileToken(token);
	if (!payload) return null;
	return prisma.user.findUnique({
		where: { id: payload.userId },
		select: {
			id: true,
			name: true,
			email: true,
			role: true
		}
	});
}
//#endregion
//#region app/routes/api.mobile.auth.login.ts
var api_mobile_auth_login_exports = /* @__PURE__ */ __exportAll({ action: () => action$7 });
async function action$7({ request }) {
	const body = await request.json();
	const email = String(body.email || "").trim().toLowerCase();
	const password = String(body.password || "");
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || !await verifyPassword(password, user.password)) return data({ message: "Email hoặc mật khẩu không đúng." }, { status: 401 });
	return data({
		token: createMobileToken(user.id),
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role
		}
	});
}
//#endregion
//#region app/routes/api.mobile.auth.register.ts
var api_mobile_auth_register_exports = /* @__PURE__ */ __exportAll({ action: () => action$6 });
async function action$6({ request }) {
	const body = await request.json();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim().toLowerCase();
	const password = String(body.password || "");
	if (!name || !email || password.length < 6) return data({ message: "Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự." }, { status: 400 });
	if (await prisma.user.findUnique({ where: { email } })) return data({ message: "Email đã tồn tại." }, { status: 409 });
	const user = await prisma.user.create({ data: {
		name,
		email,
		password: await hashPassword(password)
	} });
	return data({
		token: createMobileToken(user.id),
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role
		}
	});
}
//#endregion
//#region app/routes/api.mobile.auth.me.ts
var api_mobile_auth_me_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$5 });
async function loader$5({ request }) {
	const user = await requireMobileUser(request);
	if (!user) return data({ message: "Unauthorized" }, { status: 401 });
	return data({ user });
}
//#endregion
//#region app/routes/api.mobile.lessons.ts
var api_mobile_lessons_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$4 });
async function loader$4({ request }) {
	const url = new URL(request.url);
	const level = url.searchParams.get("level") || "";
	const q = url.searchParams.get("q") || "";
	return data({ lessons: (await prisma.lesson.findMany({
		where: {
			status: "PUBLISHED",
			...level ? { level } : {},
			...q ? { title: {
				contains: q,
				mode: "insensitive"
			} } : {}
		},
		include: { _count: { select: {
			vocabularies: true,
			quizzes: true
		} } },
		orderBy: [{ level: "asc" }, { orderNo: "asc" }]
	})).map((lesson) => ({
		id: lesson.id,
		title: lesson.title,
		description: lesson.description,
		level: lesson.level,
		orderNo: lesson.orderNo,
		vocabularyCount: lesson._count.vocabularies,
		quizCount: lesson._count.quizzes
	})) });
}
//#endregion
//#region app/lib/mobile-serializers.server.ts
function serializeQuizOptions(value) {
	if (!Array.isArray(value)) return [];
	return value.map((item) => String(item)).filter(Boolean);
}
function serializeRoadmapEntries(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => Boolean(item) && typeof item === "object").map((item) => ({
		chinese: String(item.chinese || ""),
		pinyin: String(item.pinyin || ""),
		meaningVi: String(item.meaningVi || item.meaning || ""),
		meaningEn: item.meaningEn ? String(item.meaningEn) : null,
		level: item.level ? String(item.level) : null,
		exampleChinese: item.exampleChinese ? String(item.exampleChinese) : null,
		examplePinyin: item.examplePinyin ? String(item.examplePinyin) : null,
		exampleMeaning: item.exampleMeaning ? String(item.exampleMeaning) : null
	})).filter((item) => item.chinese && item.meaningVi);
}
function serializeStringArray(value) {
	if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
	if (typeof value === "string" && value.trim()) return [value.trim()];
	return [];
}
//#endregion
//#region app/routes/api.mobile.lessons.$lessonId.ts
var api_mobile_lessons_$lessonId_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$3 });
async function loader$3({ params }) {
	const lesson = await prisma.lesson.findUnique({
		where: { id: params.lessonId },
		include: {
			vocabularies: true,
			grammars: true,
			quizzes: true
		}
	});
	if (!lesson) return data({ message: "Không tìm thấy bài học." }, { status: 404 });
	return data({ lesson: {
		id: lesson.id,
		title: lesson.title,
		description: lesson.description,
		level: lesson.level,
		orderNo: lesson.orderNo,
		vocabularies: lesson.vocabularies,
		grammars: lesson.grammars,
		quizzes: lesson.quizzes.map((quiz) => ({
			id: quiz.id,
			type: quiz.type,
			question: quiz.question,
			promptMeaning: quiz.promptMeaning,
			promptPinyin: quiz.promptPinyin,
			options: serializeQuizOptions(quiz.options),
			answer: quiz.answer
		}))
	} });
}
//#endregion
//#region app/routes/api.mobile.roadmap.ts
var api_mobile_roadmap_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$2 });
async function loader$2({ request }) {
	if (!await requireMobileUser(request)) return data({ message: "Unauthorized" }, { status: 401 });
	const url = new URL(request.url);
	const phase = url.searchParams.get("phase") || "";
	const q = url.searchParams.get("q") || "";
	return data({ items: (await prisma.roadmapItem.findMany({
		where: {
			...phase ? { phase } : {},
			...q ? { OR: [{ title: {
				contains: q,
				mode: "insensitive"
			} }, { description: {
				contains: q,
				mode: "insensitive"
			} }] } : {}
		},
		orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }]
	})).map((item) => ({
		id: item.id,
		title: item.title,
		description: item.description,
		phase: item.phase,
		weekLabel: item.weekLabel,
		level: item.level,
		orderNo: item.orderNo,
		duration: item.duration,
		vocabularyCount: serializeRoadmapEntries(item.vocabulary).length,
		phraseCount: serializeRoadmapEntries(item.phrases).length
	})) });
}
//#endregion
//#region app/routes/api.mobile.roadmap.$roadmapId.ts
var api_mobile_roadmap_$roadmapId_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$1 });
async function loader$1({ request, params }) {
	if (!await requireMobileUser(request)) return data({ message: "Unauthorized" }, { status: 401 });
	const roadmap = await prisma.roadmapItem.findUnique({ where: { id: params.roadmapId } });
	if (!roadmap) return data({ message: "Không tìm thấy lộ trình." }, { status: 404 });
	return data({ roadmap: {
		id: roadmap.id,
		title: roadmap.title,
		description: roadmap.description,
		phase: roadmap.phase,
		weekLabel: roadmap.weekLabel,
		level: roadmap.level,
		orderNo: roadmap.orderNo,
		duration: roadmap.duration,
		objectives: serializeStringArray(roadmap.objectives),
		materials: serializeStringArray(roadmap.materials),
		vocabulary: serializeRoadmapEntries(roadmap.vocabulary),
		phrases: serializeRoadmapEntries(roadmap.phrases)
	} });
}
//#endregion
//#region app/lib/vocab.server.ts
function normalizeVocabulary(item) {
	const chinese = item.chinese || item.word || item.hanzi || item.character || item.simplified;
	const pinyin = item.pinyin || item.pronunciation;
	const meaningVi = item.meaningVi || item.meaning_vi || item.vi || item.meaning || item.translation;
	if (!chinese || !pinyin || !meaningVi) return null;
	return {
		chinese: String(chinese).trim(),
		pinyin: String(pinyin).trim(),
		meaningVi: String(meaningVi).trim(),
		meaningEn: item.meaningEn || item.meaning_en || item.en || "",
		exampleChinese: item.exampleChinese || item.example_chinese || item.example || "",
		examplePinyin: item.examplePinyin || item.example_pinyin || "",
		exampleMeaning: item.exampleMeaning || item.example_meaning || item.exampleVi || "",
		level: item.level || item.hsk || "HSK1",
		lessonTitle: item.lessonTitle || item.lesson || item.lessonName || ""
	};
}
function splitByCount(items, wordsPerLesson, title) {
	const counters = {};
	return items.map((item) => {
		const level = item.level || "HSK1";
		counters[level] = counters[level] || 0;
		const lessonNumber = Math.floor(counters[level] / Math.max(1, wordsPerLesson)) + 1;
		counters[level] += 1;
		return {
			...item,
			lessonTitle: item.lessonTitle || `${level} - Bài ${lessonNumber}: ${title}`
		};
	});
}
//#endregion
//#region app/routes/api.vocabularies.import.ts
var api_vocabularies_import_exports = /* @__PURE__ */ __exportAll({ action: () => action$5 });
async function action$5({ request }) {
	await requireAdmin(request);
	const body = await request.json();
	const normalized = (Array.isArray(body.items) ? body.items : body.vocabularies || body.words || body.data || []).map(normalizeVocabulary).filter(Boolean);
	if (!normalized.length) return data({ message: "Không có từ vựng hợp lệ." }, { status: 400 });
	const finalItems = splitByCount(normalized, Number(body.wordsPerLesson || 20), body.lessonTitle || "Từ vựng cơ bản");
	const lessonMap = /* @__PURE__ */ new Map();
	for (const item of finalItems) {
		const key = item.lessonTitle || `${item.level} - Import`;
		lessonMap.set(key, [...lessonMap.get(key) || [], item]);
	}
	const lessons = [];
	for (const [title, items] of lessonMap) lessons.push(await prisma.lesson.create({
		data: {
			title,
			level: items[0]?.level || "HSK1",
			description: `Bài học import tự động với ${items.length} từ vựng.`,
			orderNo: 999,
			vocabularies: { create: items.map((v) => ({
				chinese: v.chinese,
				pinyin: v.pinyin,
				meaningVi: v.meaningVi,
				meaningEn: v.meaningEn,
				exampleChinese: v.exampleChinese,
				examplePinyin: v.examplePinyin,
				exampleMeaning: v.exampleMeaning,
				imageUrl: v.imageUrl || null,
				level: v.level || "HSK1"
			})) }
		},
		include: { vocabularies: true }
	}));
	return data({
		message: `Đã import ${finalItems.length} từ vào ${lessons.length} bài học.`,
		lessons
	});
}
//#endregion
//#region app/routes/api.ai.chat.ts
var api_ai_chat_exports = /* @__PURE__ */ __exportAll({ action: () => action$4 });
function getProviders() {
	const providers = [];
	const ollamaUrl = process.env.OLLAMA_URL?.trim();
	if (ollamaUrl) providers.push({
		name: "Ollama",
		type: "openai",
		apiKey: "ollama",
		baseUrl: ollamaUrl,
		model: process.env.OLLAMA_MODEL || "llama3.1:8b"
	});
	const googleKey = process.env.GOOGLE_API_KEY?.trim();
	if (googleKey) providers.push({
		name: "Google",
		type: "google",
		apiKey: googleKey,
		baseUrl: "https://generativelanguage.googleapis.com/v1beta",
		model: process.env.GOOGLE_MODEL || "gemini-2.0-flash"
	});
	const dsKey = process.env.DEEPSEEK_API_KEY?.trim();
	if (dsKey) providers.push({
		name: "DeepSeek",
		type: "openai",
		apiKey: dsKey,
		baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
		model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"
	});
	const oaKey = process.env.OPENAI_API_KEY?.trim();
	if (oaKey) providers.push({
		name: "OpenAI",
		type: "openai",
		apiKey: oaKey,
		baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com",
		model: process.env.OPENAI_MODEL || "gpt-4o-mini"
	});
	const gqKey = process.env.GROQ_API_KEY?.trim();
	if (gqKey) providers.push({
		name: "Groq",
		type: "openai",
		apiKey: gqKey,
		baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai",
		model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
	});
	const customKey = process.env.AI_CUSTOM_KEY?.trim();
	if (customKey) providers.push({
		name: process.env.AI_CUSTOM_NAME || "Custom",
		type: "openai",
		apiKey: customKey,
		baseUrl: process.env.AI_CUSTOM_BASE_URL || "https://api.openai.com",
		model: process.env.AI_CUSTOM_MODEL || "gpt-4o-mini"
	});
	return providers;
}
function shuffleArray(arr) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
async function callProvider(provider, messages, temperature) {
	if (provider.type === "google") {
		const systemMsg = messages.find((m) => m.role === "system");
		const body = {
			contents: messages.filter((m) => m.role !== "system").map((m) => ({
				role: m.role === "assistant" ? "model" : "user",
				parts: [{ text: m.content }]
			})),
			generationConfig: {
				temperature,
				maxOutputTokens: 2e3
			}
		};
		if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
		const res = await fetch(`${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const t = await res.text();
			throw new Error(`${provider.name} error ${res.status}: ${t.slice(0, 200)}`);
		}
		return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
	}
	const res = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${provider.apiKey}`
		},
		body: JSON.stringify({
			model: provider.model,
			messages,
			stream: false,
			temperature,
			max_tokens: 2e3
		})
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`${provider.name} error ${res.status}: ${t.slice(0, 200)}`);
	}
	return (await res.json()).choices?.[0]?.message?.content?.trim() || "";
}
async function callAI(messages, temperature = .7) {
	const providers = getProviders();
	if (providers.length === 0) throw new Error("Chưa cấu hình AI provider nào. Thêm DEEPSEEK_API_KEY, OPENAI_API_KEY, hoặc GROQ_API_KEY vào .env.");
	const errors = [];
	for (const provider of providers) try {
		const content = await callProvider(provider, messages, temperature);
		if (content) return content;
		errors.push(`${provider.name}: phản hồi rỗng`);
	} catch (err) {
		const msg = err?.message || String(err);
		errors.push(`${provider.name}: ${msg}`);
		console.warn(`AI fallback: ${msg}`);
	}
	throw new Error(`Tất cả AI provider đều lỗi:\n${errors.join("\n")}`);
}
function asJsonArray(value) {
	return Array.isArray(value) ? value.filter((item) => Boolean(item) && typeof item === "object") : [];
}
function formatJsonVocabulary(value) {
	return asJsonArray(value).map((item) => {
		const chinese = String(item.chinese || "").trim();
		const pinyin = String(item.pinyin || "").trim();
		const meaning = String(item.meaningVi || item.meaning || "").trim();
		if (!chinese || !meaning) return "";
		return `- ${chinese}${pinyin ? ` (${pinyin})` : ""}: ${meaning}`;
	}).filter(Boolean);
}
async function buildStudyContext(lessonIds = [], roadmapId) {
	const lines = [];
	if (lessonIds.length > 0) {
		const lessons = await prisma.lesson.findMany({
			where: { id: { in: lessonIds } },
			select: {
				title: true,
				description: true,
				level: true,
				vocabularies: {
					select: {
						chinese: true,
						pinyin: true,
						meaningVi: true,
						exampleChinese: true,
						examplePinyin: true,
						exampleMeaning: true
					},
					take: 80
				},
				grammars: {
					select: {
						title: true,
						structure: true,
						explanation: true,
						example: true,
						meaning: true
					},
					take: 20
				}
			}
		});
		for (const lesson of lessons) {
			lines.push(`Bài học: ${lesson.title} (${lesson.level})`);
			if (lesson.description) lines.push(`Mô tả: ${lesson.description}`);
			if (lesson.vocabularies.length) {
				lines.push("Từ vựng:");
				lines.push(...lesson.vocabularies.map((vocab) => {
					const example = vocab.exampleChinese ? ` Ví dụ: ${vocab.exampleChinese}${vocab.examplePinyin ? ` (${vocab.examplePinyin})` : ""}${vocab.exampleMeaning ? ` = ${vocab.exampleMeaning}` : ""}.` : "";
					return `- ${vocab.chinese} (${vocab.pinyin}): ${vocab.meaningVi}.${example}`;
				}));
			}
			if (lesson.grammars.length) {
				lines.push("Ngữ pháp:");
				lines.push(...lesson.grammars.map((grammar) => `- ${grammar.title}: ${grammar.structure}. ${grammar.explanation}${grammar.example ? ` Ví dụ: ${grammar.example}` : ""}${grammar.meaning ? ` = ${grammar.meaning}` : ""}`));
			}
		}
	}
	if (roadmapId) {
		const roadmap = await prisma.roadmapItem.findUnique({ where: { id: roadmapId } });
		if (roadmap) {
			lines.push(`Buổi học: ${roadmap.title}`);
			if (roadmap.level) lines.push(`Trình độ: ${roadmap.level}`);
			if (roadmap.description) lines.push(`Mô tả: ${roadmap.description}`);
			const vocab = formatJsonVocabulary(roadmap.vocabulary);
			const phrases = formatJsonVocabulary(roadmap.phrases);
			if (vocab.length) lines.push("Từ vựng:", ...vocab.slice(0, 80));
			if (phrases.length) lines.push("Mẫu câu:", ...phrases.slice(0, 60));
		}
	}
	return lines.join("\n").slice(0, 12e3);
}
function buildSystemPrompt(studyContext, mode = "chat") {
	const base = `Bạn là trợ lý AI học tiếng Trung, chuyên giúp người dùng học từ vựng, ngữ pháp, phát âm và luyện thi HSK.

Quy tắc:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.
- Khi giải thích từ vựng: đưa chữ Hán, pinyin, nghĩa tiếng Việt và ví dụ.
- Khi giải thích ngữ pháp: đưa cấu trúc, ví dụ có pinyin và nghĩa.
- Khi người dùng hỏi về cách viết chữ Hán: hướng dẫn thứ tự nét cơ bản.
- Ưu tiên dữ liệu trong "Ngữ cảnh bài đang học" nếu có.
- Nếu không chắc, nói rõ là chưa thấy trong bài hiện tại rồi đưa gợi ý học tiếp.
- Nếu câu hỏi không liên quan đến tiếng Trung, nhẹ nhàng gợi ý quay lại chủ đề học tập.`;
	const conversation = `\n\nChế độ hội thoại:
- Đóng vai bạn luyện nói tiếng Trung.
- Trả lời 1-3 câu ngắn.
- Sửa lỗi tiếng Trung của người học nếu có.
- Ưu tiên dùng từ vựng trong bài hiện tại.
- Với câu tiếng Trung, kèm pinyin và nghĩa tiếng Việt ngắn.`;
	const translate = `\n\nChế độ dịch:
- Người dùng nhập tiếng Việt, bạn hãy PHÂN TÍCH và DỊCH sang tiếng Trung.
- Phân tích theo cấu trúc:
  1. Chữ Hán (kết quả dịch)
  2. Pinyin
  3. Nghĩa tiếng Việt của từng từ/cụm từ chính
  4. Ví dụ câu ngắn bằng tiếng Trung (kèm pinyin và nghĩa tiếng Việt)
- Nếu người dùng nhập một từ đơn: giải thích từ đó, đưa các cách dùng và ví dụ.
- Nếu người dùng nhập cả câu: dịch toàn bộ câu, phân tích từ vựng chính trong câu.`;
	const context = studyContext ? `\n\nNgữ cảnh bài đang học:\n${studyContext}` : "\n\nNgữ cảnh bài đang học: chưa có bài cụ thể.";
	return `${base}${mode === "conversation" ? conversation : mode === "translate" ? translate : ""}${context}`;
}
async function action$4({ request }) {
	await requireUser(request);
	const body = await request.json();
	const intent = body.intent || "chat";
	if (intent === "chat") {
		const messages = body.messages || [];
		if (!messages.length) return data({ error: "Vui lòng gửi tin nhắn." }, { status: 400 });
		try {
			return data({ reply: await callAI([{
				role: "system",
				content: buildSystemPrompt(await buildStudyContext(body.lessonIds || [], body.roadmapId), body.mode || "chat")
			}, ...messages.slice(-20)]) });
		} catch (err) {
			console.error("AI Chat error:", err);
			return data({ error: "AI đang bận, vui lòng thử lại sau." }, { status: 502 });
		}
	}
	if (intent === "practice_generate") {
		const lessonIds = body.lessonIds || [];
		const roadmapId = body.roadmapId;
		let vocabularies = [];
		if (lessonIds.length > 0) vocabularies = await prisma.vocabulary.findMany({
			where: { lessonId: { in: lessonIds } },
			select: {
				chinese: true,
				pinyin: true,
				meaningVi: true
			},
			take: 50
		});
		if (vocabularies.length === 0 && roadmapId) {
			const roadmap = await prisma.roadmapItem.findUnique({ where: { id: roadmapId } });
			if (roadmap) {
				const rawVocab = roadmap.vocabulary || [];
				const rawPhrases = roadmap.phrases || [];
				vocabularies = [...rawVocab, ...rawPhrases].map((v) => ({
					chinese: v.chinese || "",
					pinyin: v.pinyin || "",
					meaningVi: v.meaningVi || v.meaning || ""
				}));
			}
		}
		if (vocabularies.length === 0) vocabularies = await prisma.vocabulary.findMany({
			select: {
				chinese: true,
				pinyin: true,
				meaningVi: true
			},
			take: 40,
			orderBy: { createdAt: "desc" }
		});
		const previousWords = body.previousWords || [];
		if (previousWords.length > 0) vocabularies = vocabularies.filter((v) => !previousWords.includes(v.chinese));
		if (vocabularies.length === 0) return data({ error: "Chưa có dữ liệu từ vựng để luyện tập." }, { status: 400 });
		const prompt = `Bạn là giáo viên tiếng Trung. Từ danh sách từ vựng sau, hãy chọn NGẪU NHIÊN 1 từ và tạo 1 câu hỏi trắc nghiệm.
QUAN TRỌNG: Mỗi lần gọi phải chọn từ KHÁC NHAU, không lặp lại từ đã dùng trước đó.
Chỉ trả về JSON (không markdown), format:
{"type":"meaning|pinyin|recognition","question":"câu hỏi","options":["A","B","C","D"],"answer":"đáp án","explanation":"giải thích"}

Danh sách từ:
${shuffleArray(vocabularies).map((v) => `${v.chinese} (${v.pinyin}) = ${v.meaningVi}`).join("\n")}`;
		try {
			const jsonMatch = (await callAI([{
				role: "system",
				content: "Trả về JSON thuần, không markdown. Mỗi lần chọn từ khác nhau."
			}, {
				role: "user",
				content: prompt
			}], 1)).match(/\{[\s\S]*\}/);
			if (!jsonMatch) return data({ error: "AI không tạo được câu hỏi." }, { status: 502 });
			const q = JSON.parse(jsonMatch[0]);
			return data({ question: {
				id: `q-${Date.now()}`,
				type: q.type || "meaning",
				question: q.question || "",
				options: Array.isArray(q.options) ? q.options : [],
				answer: q.answer || "",
				explanation: q.explanation || ""
			} });
		} catch {
			return data({ error: "AI trả về định dạng không hợp lệ." }, { status: 502 });
		}
	}
	if (intent === "practice_check") {
		const { userAnswer, question, correctAnswer } = body;
		if (!userAnswer?.trim() || !correctAnswer) return data({ error: "Thiếu thông tin." }, { status: 400 });
		const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[()（）]/g, "");
		const userNorm = normalize(userAnswer);
		const correctNorm = normalize(correctAnswer);
		const isCorrect = userNorm === correctNorm || userNorm.includes(correctNorm) || correctNorm.includes(userNorm);
		try {
			return data({
				correct: isCorrect,
				feedback: await callAI([{
					role: "system",
					content: "Bạn là giáo viên tiếng Trung vui tính. Phản hồi ngắn 1-2 câu bằng tiếng Việt."
				}, {
					role: "user",
					content: `Câu hỏi: "${question}"
Đáp án đúng: "${correctAnswer}"
Học viên trả lời: "${userAnswer}"
Kết quả: ${isCorrect ? "ĐÚNG" : "SAI"}
Hãy đưa ra phản hồi khuyến khích.`
				}]) || (isCorrect ? "Chính xác! 🎉" : `Đáp án đúng: ${correctAnswer}`)
			});
		} catch {
			return data({
				correct: isCorrect,
				feedback: ""
			});
		}
	}
	if (intent === "hanzi_sentence") {
		const lessonIds = body.lessonIds || [];
		const roadmapId = body.roadmapId;
		const previousSentences = body.previousSentences || [];
		let vocabData = [];
		if (lessonIds.length > 0) vocabData = await prisma.vocabulary.findMany({
			where: { lessonId: { in: lessonIds } },
			select: {
				chinese: true,
				pinyin: true,
				meaningVi: true
			},
			take: 50
		});
		if (vocabData.length === 0 && roadmapId) {
			const roadmap = await prisma.roadmapItem.findUnique({ where: { id: roadmapId } });
			if (roadmap) {
				const rawVocab = roadmap.vocabulary || [];
				const rawPhrases = roadmap.phrases || [];
				vocabData = [...rawVocab, ...rawPhrases].map((v) => ({
					chinese: v.chinese || "",
					pinyin: v.pinyin || "",
					meaningVi: v.meaningVi || v.meaning || ""
				}));
			}
		}
		if (vocabData.length === 0) vocabData = await prisma.vocabulary.findMany({
			select: {
				chinese: true,
				pinyin: true,
				meaningVi: true
			},
			take: 40,
			orderBy: { createdAt: "desc" }
		});
		const vocabList = shuffleArray(vocabData).map((v) => `${v.chinese} (${v.pinyin}) = ${v.meaningVi}`).join("\n");
		const prompt = `Bạn là giáo viên tiếng Trung. Dựa vào danh sách từ vựng sau, hãy tạo MỘT CÂU tiếng Trung ngắn (không phải từ đơn) sử dụng các từ trong danh sách.
Yêu cầu:
- Câu phải có ý nghĩa, tự nhiên, ngắn gọn (5-15 từ).
- MỖI LẦN GỌI PHẢI TẠO CÂU KHÁC NHAU, không lặp lại câu cũ.
- Đa dạng chủ đề: giới thiệu bản thân, gia đình, mua sắm, trường học, công việc, thời tiết, sở thích, du lịch, ăn uống...
- Cố gắng tăng dần độ khó, dùng nhiều từ vựng khác nhau trong danh sách.
- Kèm pinyin và nghĩa tiếng Việt.
- Chỉ trả về JSON thuần, không markdown.
Định dạng:
{"chinese":"câu tiếng Trung","pinyin":"pinyin","meaningVi":"nghĩa tiếng Việt"}

${previousSentences.length > 0 ? `CÁC CÂU ĐÃ DÙNG (KHÔNG ĐƯỢC LẶP LẠI):\n${previousSentences.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` : ""}Danh sách từ:
${vocabList}`;
		try {
			const jsonMatch = (await callAI([{
				role: "system",
				content: "Trả về JSON thuần, không markdown. Mỗi lần tạo câu tiếng Trung KHÁC NHAU, đa dạng chủ đề, không lặp lại câu cũ."
			}, {
				role: "user",
				content: prompt
			}], 1.2)).match(/\{[\s\S]*\}/);
			if (!jsonMatch) return data({ error: "AI không tạo được câu." }, { status: 502 });
			const s = JSON.parse(jsonMatch[0]);
			if (!s.chinese || !s.pinyin || !s.meaningVi) return data({ error: "AI trả về định dạng không hợp lệ." }, { status: 502 });
			return data({ sentence: {
				chinese: s.chinese,
				pinyin: s.pinyin,
				meaningVi: s.meaningVi
			} });
		} catch {
			return data({ error: "AI trả về định dạng không hợp lệ." }, { status: 502 });
		}
	}
	if (intent === "hanzi_check") {
		const { userAnswer, sentence } = body;
		if (!userAnswer?.trim() || !sentence?.chinese) return data({ error: "Thiếu thông tin." }, { status: 400 });
		const normalize = (s) => s.trim().replace(/[\s,，。.!！?？;；：、]/g, "").toLowerCase();
		const isCorrect = normalize(userAnswer) === normalize(sentence.chinese);
		try {
			return data({
				correct: isCorrect,
				feedback: await callAI([{
					role: "system",
					content: "Bạn là giáo viên tiếng Trung. Phản hồi ngắn 1-2 câu bằng tiếng Việt, kiểm tra chữ Hán người dùng viết có đúng không. Nếu sai, chỉ ra lỗi và nhắc đáp án đúng. Khuyến khích học viên."
				}, {
					role: "user",
					content: `Câu đúng: "${sentence.chinese}" (${sentence.pinyin}) = ${sentence.meaningVi}
Học viên viết: "${userAnswer}"
Kết quả: ${isCorrect ? "ĐÚNG" : "SAI"}
Hãy đưa ra phản hồi.`
				}]) || (isCorrect ? "Chính xác! 🎉" : `Chưa đúng. Câu đúng là: ${sentence.chinese}`)
			});
		} catch {
			return data({
				correct: isCorrect,
				feedback: ""
			});
		}
	}
	return data({ error: "intent không hợp lệ." }, { status: 400 });
}
//#endregion
//#region app/routes/api.ai.practice.ts
var api_ai_practice_exports = /* @__PURE__ */ __exportAll({ action: () => action$3 });
function getConfig() {
	return {
		apiKey: process.env.DEEPSEEK_API_KEY?.trim() || "",
		baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
		model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"
	};
}
async function callDeepSeek$1(messages) {
	const { apiKey, baseUrl, model } = getConfig();
	const res = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			messages,
			stream: false,
			temperature: .8,
			max_tokens: 2e3
		})
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`DeepSeek error ${res.status}: ${t}`);
	}
	return (await res.json()).choices?.[0]?.message?.content?.trim() || "";
}
async function action$3({ request }) {
	await requireUser(request);
	const body = await request.json();
	if (body.intent === "generate") {
		const lessonIds = body.lessonIds || [];
		let vocabularies = [];
		if (lessonIds.length > 0) vocabularies = await prisma.vocabulary.findMany({
			where: { lessonId: { in: lessonIds } },
			select: {
				chinese: true,
				pinyin: true,
				meaningVi: true,
				meaningEn: true
			},
			take: 50
		});
		if (vocabularies.length === 0) vocabularies = await prisma.vocabulary.findMany({
			select: {
				chinese: true,
				pinyin: true,
				meaningVi: true,
				meaningEn: true
			},
			take: 30,
			orderBy: { createdAt: "desc" }
		});
		if (vocabularies.length === 0) return data({ error: "Chưa có dữ liệu từ vựng để luyện tập." }, { status: 400 });
		const jsonMatch = (await callDeepSeek$1([{
			role: "system",
			content: `Bạn là giáo viên tiếng Trung. Hãy tạo 1 câu hỏi luyện tập từ danh sách từ vựng sau.
Trả về JSON (không markdown) theo định dạng:
{"type":"meaning|pinyin|recognition","question":"câu hỏi","options":["A","B","C","D"],"answer":"đáp án đúng","explanation":"giải thích ngắn"}

- type=meaning: đưa chữ Hán, hỏi nghĩa
- type=pinyin: đưa chữ Hán, hỏi pinyin
- type=recognition: đưa nghĩa/pinyin, hỏi chữ Hán phù hợp
- options: 4 đáp án, 1 đúng, 3 sai (lấy từ danh sách có sẵn)
- answer: đáp án đúng, chính xác từ danh sách trên
- explanation: giải thích ngắn bằng tiếng Việt`
		}, {
			role: "user",
			content: `Danh sách từ vựng:\n${vocabularies.map((v) => `${v.chinese} (${v.pinyin}) = ${v.meaningVi}`).join("\n")}\n\nHãy tạo 1 câu hỏi. Trả về JSON thuần.`
		}])).match(/\{[\s\S]*\}/);
		if (!jsonMatch) return data({ error: "AI không tạo được câu hỏi." }, { status: 502 });
		try {
			const question = JSON.parse(jsonMatch[0]);
			return data({ question: {
				id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
				type: question.type || "meaning",
				question: question.question || "",
				options: Array.isArray(question.options) ? question.options : [],
				answer: question.answer || "",
				explanation: question.explanation || ""
			} });
		} catch {
			return data({ error: "AI trả về định dạng không hợp lệ." }, { status: 502 });
		}
	}
	if (body.intent === "check") {
		const { questionId, userAnswer, history } = body;
		if (!userAnswer?.trim()) return data({ error: "Vui lòng nhập câu trả lời." }, { status: 400 });
		const lastQ = history?.[history.length - 1];
		const correct = userAnswer.trim().toLowerCase() === lastQ?.a.trim().toLowerCase();
		return data({
			correct,
			feedback: await callDeepSeek$1([{
				role: "system",
				content: "Bạn là giáo viên tiếng Trung vui tính."
			}, {
				role: "user",
				content: `Học viên trả lời câu hỏi: "${lastQ?.q}"
Đáp án đúng: "${lastQ?.a}"
Câu trả lời của học viên: "${userAnswer}"
Kết quả: ${correct ? "ĐÚNG" : "SAI"}

Hãy đưa ra phản hồi ngắn (1-2 câu) bằng tiếng Việt, khuyến khích học viên. Nếu sai, giải thích nhẹ nhàng.`
			}]),
			correctAnswer: lastQ?.a || ""
		});
	}
	return data({ error: "intent không hợp lệ." }, { status: 400 });
}
//#endregion
//#region app/lib/ai.server.ts
function extractJson(text) {
	const match = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
	const raw = match ? match[1] : text;
	return JSON.parse(raw.trim());
}
function getDeepSeekConfig() {
	const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
	if (!apiKey) throw new Error("Thiếu DEEPSEEK_API_KEY để phân bài và tạo quiz bằng AI.");
	return {
		apiKey,
		baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
		model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"
	};
}
async function callDeepSeek(messages) {
	const { apiKey, baseUrl, model } = getDeepSeekConfig();
	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			messages,
			stream: false
		})
	});
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`DeepSeek API lỗi: ${response.status} ${errorText}`);
	}
	const content = (await response.json()).choices?.[0]?.message?.content?.trim();
	if (!content) throw new Error("DeepSeek không trả về nội dung hợp lệ.");
	return content;
}
function optionalString(value) {
	return String(value || "").trim() || void 0;
}
async function splitLessonsByAI(vocabularies, courseTitle) {
	const totalWords = vocabularies.length;
	const groups = extractJson(await callDeepSeek([{
		role: "system",
		content: "Bạn chỉ được trả về JSON hợp lệ."
	}, {
		role: "user",
		content: `Bạn là chuyên gia thiết kế giáo trình tiếng Trung HSK.
Hãy phân nhóm danh sách từ vựng thành các bài học theo chủ đề.
Yêu cầu:
- Nhóm từ theo chủ đề tự nhiên, ngữ cảnh học và độ liên quan.
- Không được chia quá vụn thành nhiều bài nhỏ.
- Mỗi bài nên có khoảng 6-12 từ.
- Tránh tạo bài dưới 5 từ, trừ khi đó là nhóm từ rất đặc thù và thực sự cần tách riêng.
- Ưu tiên gộp các nhóm gần nhau về ngữ nghĩa thay vì tách quá chi tiết.
- Với tập khoảng 50 từ, số bài hợp lý thường nằm trong khoảng 5-8 bài.
- Với tập ít từ hơn, số bài phải giảm tương ứng.
- Mỗi bài phải có tiêu đề tiếng Việt rõ ràng.
- Mỗi bài có mô tả ngắn 1 câu.
- Giữ nguyên toàn bộ từ vựng, không được bỏ sót, không được thêm từ mới.
- Tổng số từ trong tất cả bài cộng lại phải đúng bằng ${totalWords}.
- Chỉ trả về JSON hợp lệ, không giải thích.
Định dạng:
[{"level":"HSK1","title":"HSK1 - Bài 1: Chào hỏi","description":"...","vocabularies":[{"chinese":"你好","pinyin":"nǐ hǎo","meaningVi":"xin chào","meaningEn":"hello"}]}]
Ngữ cảnh khóa học: ${courseTitle || "HSK tổng hợp"}
Số từ đầu vào: ${totalWords}
Danh sách từ vựng: ${JSON.stringify(vocabularies)}`
	}]));
	if (!Array.isArray(groups) || !groups.length) throw new Error("AI không phân được bài học hợp lệ.");
	return groups.map((group) => ({
		level: String(group.level || "HSK1").trim() || "HSK1",
		title: String(group.title || "").trim(),
		description: optionalString(group.description) || "Bài học được phân tự động bằng AI.",
		vocabularies: Array.isArray(group.vocabularies) ? group.vocabularies : []
	})).filter((group) => group.title && group.vocabularies.length);
}
//#endregion
//#region app/routes/api.ai.split-lessons.ts
var api_ai_split_lessons_exports = /* @__PURE__ */ __exportAll({ action: () => action$2 });
async function action$2({ request }) {
	await requireAdmin(request);
	const body = await request.json();
	const vocabularies = (Array.isArray(body.vocabularies) ? body.vocabularies : []).map(normalizeVocabulary).filter(Boolean);
	if (!vocabularies.length) return data({ message: "Danh sách từ vựng rỗng." }, { status: 400 });
	return data({ lessons: await splitLessonsByAI(vocabularies) });
}
//#endregion
//#region app/routes/api.ai.tts.ts
var api_ai_tts_exports = /* @__PURE__ */ __exportAll({ action: () => action$1 });
async function action$1({ request }) {
	await requireUser(request);
	const body = await request.json();
	const text = body.text?.trim();
	if (!text) return data({ error: "Thiếu nội dung." }, { status: 400 });
	const googleKey = process.env.GOOGLE_API_KEY?.trim();
	if (!googleKey) return data({ error: "Chưa cấu hình GOOGLE_API_KEY." }, { status: 400 });
	const lang = body.lang || "vi-VN";
	const voiceName = lang === "zh-CN" ? "cmn-CN-Standard-A" : "vi-VN-Standard-A";
	try {
		const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				input: { text },
				voice: {
					languageCode: lang,
					name: voiceName
				},
				audioConfig: {
					audioEncoding: "MP3",
					speakingRate: 1
				}
			})
		});
		if (!res.ok) {
			await res.text();
			return data({ error: `Google TTS lỗi: ${res.status}` }, { status: 502 });
		}
		const result = await res.json();
		if (!result.audioContent) return data({ error: "Không tạo được audio." }, { status: 502 });
		return data({ audio: result.audioContent });
	} catch {
		return data({ error: "Lỗi kết nối Google TTS." }, { status: 502 });
	}
}
//#endregion
//#region app/routes/api.admin.lesson-import.ts
var api_admin_lesson_import_exports = /* @__PURE__ */ __exportAll({ action: () => action });
async function action({ request }) {
	await requireAdmin(request);
	const form = await request.formData();
	const file = form.get("jsonFile");
	const source = String(form.get("source") || "HSK20").trim();
	if (!file || file.size === 0) return data({ error: "Vui lòng chọn file JSON." }, { status: 400 });
	try {
		const rawText = await file.text();
		const json = JSON.parse(rawText);
		const rawItems = Array.isArray(json) ? json : json.lessons || json.data || [];
		if (!rawItems.length) return data({ error: "File JSON rỗng." }, { status: 400 });
		let lessonCount = 0;
		let vocabCount = 0;
		for (const item of rawItems) {
			const record = item;
			const title = String(record.title || record.name || "Bài học").trim();
			const level = String(record.level || record.phase || "HSK1").trim();
			const orderNo = Number(record.orderNo || record.order || 1);
			const description = record.description ? String(record.description) : null;
			const vocabularies = (Array.isArray(record.vocabularies) ? record.vocabularies : Array.isArray(record.vocabulary) ? record.vocabulary : []).map((v) => {
				const w = v;
				const chinese = String(w.chinese || w.word || w.hanzi || "").trim();
				const pinyin = String(w.pinyin || "").trim();
				const meaningVi = String(w.meaningVi || w.meaning_vi || w.vi || w.meaning || w.translation || "").trim();
				if (!chinese || !pinyin || !meaningVi) return null;
				return {
					chinese,
					pinyin,
					meaningVi,
					meaningEn: w.meaningEn ? String(w.meaningEn) : "",
					exampleChinese: w.exampleChinese ? String(w.exampleChinese) : "",
					examplePinyin: w.examplePinyin ? String(w.examplePinyin) : "",
					exampleMeaning: w.exampleMeaning ? String(w.exampleMeaning) : "",
					level: String(w.level || level)
				};
			}).filter((v) => v != null);
			if (!vocabularies.length) continue;
			await prisma.lesson.create({ data: {
				title,
				description: description || `Bài học ${source}`,
				level,
				source,
				orderNo,
				status: "PUBLISHED",
				vocabularies: { create: vocabularies }
			} });
			lessonCount++;
			vocabCount += vocabularies.length;
		}
		return data({ message: `Đã import ${lessonCount} bài học, ${vocabCount} từ vựng vào ${source === "HSK30" ? "HSK 3.0" : "HSK 2.0"}.` });
	} catch (error) {
		return data({ error: error instanceof Error ? error.message : "Lỗi import file." }, { status: 500 });
	}
}
//#endregion
//#region app/lib/lesson-import-job.server.ts
var jobs = global.__lessonImportJobs || /* @__PURE__ */ new Map();
global.__lessonImportJobs = jobs;
function getLessonImportJob(jobId) {
	return jobs.get(jobId) || null;
}
//#endregion
//#region app/routes/api.admin.lesson-import-status.ts
var api_admin_lesson_import_status_exports = /* @__PURE__ */ __exportAll({ loader: () => loader });
async function loader({ request }) {
	await requireAdmin(request);
	const jobId = new URL(request.url).searchParams.get("jobId") || "";
	if (!jobId) return data({ error: "Thiếu jobId." }, { status: 400 });
	const job = getLessonImportJob(jobId);
	if (!job) return data({ error: "Không tìm thấy job import." }, { status: 404 });
	return data({
		jobId: job.id,
		status: job.status,
		progress: job.progress,
		result: job.result || null,
		error: job.error || null
	});
}
//#endregion
//#region \0virtual:react-router/server-manifest
var server_manifest_default = {
	"entry": {
		"module": "/assets/entry.client-B9woUEYR.js",
		"imports": ["/assets/jsx-runtime-x_uBJh-L.js"],
		"css": []
	},
	"routes": {
		"root": {
			"id": "root",
			"parentId": void 0,
			"path": "",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": true,
			"module": "/assets/root-D5IZfjy1.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/Toast-CPW3K6uh.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/_index": {
			"id": "routes/_index",
			"parentId": "root",
			"path": void 0,
			"index": true,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/_index-DHJtV4By.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/arrow-right-CCnXkLjS.js",
				"/assets/flame-RTUIUEQS.js",
				"/assets/bot-DK8vOjzx.js",
				"/assets/list-checks-DGsGmSVV.js",
				"/assets/sparkles-BZL1hzS-.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/hsk20": {
			"id": "routes/hsk20",
			"parentId": "root",
			"path": "hsk20",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/hsk20-B0Byu9zX.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/CustomSelect-CuCCMV5Z.js",
				"/assets/arrow-right-CCnXkLjS.js",
				"/assets/search-CaKGQdWQ.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/hsk30": {
			"id": "routes/hsk30",
			"parentId": "root",
			"path": "hsk30",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/hsk30-DlQ1DNz9.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/CustomSelect-CuCCMV5Z.js",
				"/assets/arrow-right-CCnXkLjS.js",
				"/assets/search-CaKGQdWQ.js",
				"/assets/sparkles-BZL1hzS-.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/lessons._index": {
			"id": "routes/lessons._index",
			"parentId": "root",
			"path": "lessons",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/lessons._index-D-Mj4h-F.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/arrow-right-CCnXkLjS.js",
				"/assets/flame-RTUIUEQS.js",
				"/assets/chevron-left-BFrZaua-.js",
				"/assets/layers-CVIXMQGG.js",
				"/assets/search-CaKGQdWQ.js",
				"/assets/sparkles-BZL1hzS-.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/lessons.$lessonId": {
			"id": "routes/lessons.$lessonId",
			"parentId": "root",
			"path": "lessons/:lessonId",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/lessons._lessonId-BN9B4R7O.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/BookFlip-CaZIQAY7.js",
				"/assets/chevron-left-BFrZaua-.js",
				"/assets/chevron-right-CAMAkgOr.js",
				"/assets/AuthProvider-B5X6v7kr.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/roadmap": {
			"id": "routes/roadmap",
			"parentId": "root",
			"path": "roadmap",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/roadmap-CnxhZTM3.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/arrow-right-CCnXkLjS.js",
				"/assets/flame-RTUIUEQS.js",
				"/assets/chevron-left-BFrZaua-.js",
				"/assets/layers-CVIXMQGG.js",
				"/assets/search-CaKGQdWQ.js",
				"/assets/sparkles-BZL1hzS-.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/roadmap.$roadmapId": {
			"id": "routes/roadmap.$roadmapId",
			"parentId": "root",
			"path": "roadmap/:roadmapId",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/roadmap._roadmapId-DP9oVQ_u.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/BookFlip-CaZIQAY7.js",
				"/assets/chevron-left-BFrZaua-.js",
				"/assets/chevron-right-CAMAkgOr.js",
				"/assets/AuthProvider-B5X6v7kr.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/profile": {
			"id": "routes/profile",
			"parentId": "root",
			"path": "profile",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/profile-DBU474q2.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/Toast-CPW3K6uh.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/dashboard": {
			"id": "routes/dashboard",
			"parentId": "root",
			"path": "dashboard",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/dashboard-Crwk5SBi.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/ai-assistant": {
			"id": "routes/ai-assistant",
			"parentId": "root",
			"path": "ai-assistant",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ai-assistant-Dcb27lMt.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/bot-DK8vOjzx.js",
				"/assets/refresh-cw-WAJiCIJy.js",
				"/assets/chevron-right-CAMAkgOr.js",
				"/assets/sparkles-BZL1hzS-.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/ai-practice": {
			"id": "routes/ai-practice",
			"parentId": "root",
			"path": "ai-practice",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ai-practice-DZ1-U1Nz.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/refresh-cw-WAJiCIJy.js",
				"/assets/chevron-right-CAMAkgOr.js",
				"/assets/sparkles-BZL1hzS-.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/admin": {
			"id": "routes/admin",
			"parentId": "root",
			"path": "admin",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/admin-CGaqCcgW.js",
			"imports": [
				"/assets/jsx-runtime-x_uBJh-L.js",
				"/assets/Layout-BJVhCzwp.js",
				"/assets/AuthProvider-B5X6v7kr.js",
				"/assets/Toast-CPW3K6uh.js",
				"/assets/list-checks-DGsGmSVV.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.auth.login": {
			"id": "routes/api.auth.login",
			"parentId": "root",
			"path": "api/auth/login",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.auth.login-DPVGhMve.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.auth.register": {
			"id": "routes/api.auth.register",
			"parentId": "root",
			"path": "api/auth/register",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.auth.register-BVvfROD3.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.auth.logout": {
			"id": "routes/api.auth.logout",
			"parentId": "root",
			"path": "api/auth/logout",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.auth.logout-D7c7PqdD.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.auth.login": {
			"id": "routes/api.mobile.auth.login",
			"parentId": "root",
			"path": "api/mobile/auth/login",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.auth.login-LRbjLnjl.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.auth.register": {
			"id": "routes/api.mobile.auth.register",
			"parentId": "root",
			"path": "api/mobile/auth/register",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.auth.register-C1S3Yumm.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.auth.me": {
			"id": "routes/api.mobile.auth.me",
			"parentId": "root",
			"path": "api/mobile/auth/me",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.auth.me-wez2Lq7O.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.lessons": {
			"id": "routes/api.mobile.lessons",
			"parentId": "root",
			"path": "api/mobile/lessons",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.lessons-BftZF5tX.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.lessons.$lessonId": {
			"id": "routes/api.mobile.lessons.$lessonId",
			"parentId": "root",
			"path": "api/mobile/lessons/:lessonId",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.lessons._lessonId-B1RwwqCG.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.roadmap": {
			"id": "routes/api.mobile.roadmap",
			"parentId": "root",
			"path": "api/mobile/roadmap",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.roadmap-BbXHidF_.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.mobile.roadmap.$roadmapId": {
			"id": "routes/api.mobile.roadmap.$roadmapId",
			"parentId": "root",
			"path": "api/mobile/roadmap/:roadmapId",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.mobile.roadmap._roadmapId-B2ZEYQab.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.vocabularies.import": {
			"id": "routes/api.vocabularies.import",
			"parentId": "root",
			"path": "api/vocabularies/import",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.vocabularies.import-CX06YV_-.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.ai.chat": {
			"id": "routes/api.ai.chat",
			"parentId": "root",
			"path": "api/ai/chat",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.ai.chat-De-DdQhn.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.ai.practice": {
			"id": "routes/api.ai.practice",
			"parentId": "root",
			"path": "api/ai/practice",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.ai.practice-DV3xoo3v.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.ai.split-lessons": {
			"id": "routes/api.ai.split-lessons",
			"parentId": "root",
			"path": "api/ai/split-lessons",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.ai.split-lessons-DsDr17Dh.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.ai.tts": {
			"id": "routes/api.ai.tts",
			"parentId": "root",
			"path": "api/ai/tts",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.ai.tts-6AZ2w4Ju.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.lesson-import": {
			"id": "routes/api.admin.lesson-import",
			"parentId": "root",
			"path": "api/admin/lesson-import",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.lesson-import-vM2TU3fq.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.admin.lesson-import-status": {
			"id": "routes/api.admin.lesson-import-status",
			"parentId": "root",
			"path": "api/admin/lesson-import-status",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.admin.lesson-import-status-BdMtE0cs.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-e2d4d748.js",
	"version": "e2d4d748",
	"sri": void 0
};
//#endregion
//#region \0virtual:react-router/server-build
var assetsBuildDirectory = "build\\client";
var basename = "/";
var future = {
	"unstable_optimizeDeps": false,
	"v8_passThroughRequests": false,
	"unstable_trailingSlashAwareDataRequests": false,
	"unstable_previewServerPrerendering": false,
	"v8_middleware": false,
	"v8_splitRouteModules": false,
	"v8_viteEnvironmentApi": false
};
var ssr = true;
var isSpaMode = false;
var prerender = [];
var routeDiscovery = {
	"mode": "lazy",
	"manifestPath": "/__manifest"
};
var publicPath = "/";
var entry = { module: entry_server_node_exports };
var routes = {
	"root": {
		id: "root",
		parentId: void 0,
		path: "",
		index: void 0,
		caseSensitive: void 0,
		module: root_exports
	},
	"routes/_index": {
		id: "routes/_index",
		parentId: "root",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: _index_exports
	},
	"routes/hsk20": {
		id: "routes/hsk20",
		parentId: "root",
		path: "hsk20",
		index: void 0,
		caseSensitive: void 0,
		module: hsk20_exports
	},
	"routes/hsk30": {
		id: "routes/hsk30",
		parentId: "root",
		path: "hsk30",
		index: void 0,
		caseSensitive: void 0,
		module: hsk30_exports
	},
	"routes/lessons._index": {
		id: "routes/lessons._index",
		parentId: "root",
		path: "lessons",
		index: void 0,
		caseSensitive: void 0,
		module: lessons__index_exports
	},
	"routes/lessons.$lessonId": {
		id: "routes/lessons.$lessonId",
		parentId: "root",
		path: "lessons/:lessonId",
		index: void 0,
		caseSensitive: void 0,
		module: lessons_$lessonId_exports
	},
	"routes/roadmap": {
		id: "routes/roadmap",
		parentId: "root",
		path: "roadmap",
		index: void 0,
		caseSensitive: void 0,
		module: roadmap_exports
	},
	"routes/roadmap.$roadmapId": {
		id: "routes/roadmap.$roadmapId",
		parentId: "root",
		path: "roadmap/:roadmapId",
		index: void 0,
		caseSensitive: void 0,
		module: roadmap_$roadmapId_exports
	},
	"routes/profile": {
		id: "routes/profile",
		parentId: "root",
		path: "profile",
		index: void 0,
		caseSensitive: void 0,
		module: profile_exports
	},
	"routes/dashboard": {
		id: "routes/dashboard",
		parentId: "root",
		path: "dashboard",
		index: void 0,
		caseSensitive: void 0,
		module: dashboard_exports
	},
	"routes/ai-assistant": {
		id: "routes/ai-assistant",
		parentId: "root",
		path: "ai-assistant",
		index: void 0,
		caseSensitive: void 0,
		module: ai_assistant_exports
	},
	"routes/ai-practice": {
		id: "routes/ai-practice",
		parentId: "root",
		path: "ai-practice",
		index: void 0,
		caseSensitive: void 0,
		module: ai_practice_exports
	},
	"routes/admin": {
		id: "routes/admin",
		parentId: "root",
		path: "admin",
		index: void 0,
		caseSensitive: void 0,
		module: admin_exports
	},
	"routes/api.auth.login": {
		id: "routes/api.auth.login",
		parentId: "root",
		path: "api/auth/login",
		index: void 0,
		caseSensitive: void 0,
		module: api_auth_login_exports
	},
	"routes/api.auth.register": {
		id: "routes/api.auth.register",
		parentId: "root",
		path: "api/auth/register",
		index: void 0,
		caseSensitive: void 0,
		module: api_auth_register_exports
	},
	"routes/api.auth.logout": {
		id: "routes/api.auth.logout",
		parentId: "root",
		path: "api/auth/logout",
		index: void 0,
		caseSensitive: void 0,
		module: api_auth_logout_exports
	},
	"routes/api.mobile.auth.login": {
		id: "routes/api.mobile.auth.login",
		parentId: "root",
		path: "api/mobile/auth/login",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_auth_login_exports
	},
	"routes/api.mobile.auth.register": {
		id: "routes/api.mobile.auth.register",
		parentId: "root",
		path: "api/mobile/auth/register",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_auth_register_exports
	},
	"routes/api.mobile.auth.me": {
		id: "routes/api.mobile.auth.me",
		parentId: "root",
		path: "api/mobile/auth/me",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_auth_me_exports
	},
	"routes/api.mobile.lessons": {
		id: "routes/api.mobile.lessons",
		parentId: "root",
		path: "api/mobile/lessons",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_lessons_exports
	},
	"routes/api.mobile.lessons.$lessonId": {
		id: "routes/api.mobile.lessons.$lessonId",
		parentId: "root",
		path: "api/mobile/lessons/:lessonId",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_lessons_$lessonId_exports
	},
	"routes/api.mobile.roadmap": {
		id: "routes/api.mobile.roadmap",
		parentId: "root",
		path: "api/mobile/roadmap",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_roadmap_exports
	},
	"routes/api.mobile.roadmap.$roadmapId": {
		id: "routes/api.mobile.roadmap.$roadmapId",
		parentId: "root",
		path: "api/mobile/roadmap/:roadmapId",
		index: void 0,
		caseSensitive: void 0,
		module: api_mobile_roadmap_$roadmapId_exports
	},
	"routes/api.vocabularies.import": {
		id: "routes/api.vocabularies.import",
		parentId: "root",
		path: "api/vocabularies/import",
		index: void 0,
		caseSensitive: void 0,
		module: api_vocabularies_import_exports
	},
	"routes/api.ai.chat": {
		id: "routes/api.ai.chat",
		parentId: "root",
		path: "api/ai/chat",
		index: void 0,
		caseSensitive: void 0,
		module: api_ai_chat_exports
	},
	"routes/api.ai.practice": {
		id: "routes/api.ai.practice",
		parentId: "root",
		path: "api/ai/practice",
		index: void 0,
		caseSensitive: void 0,
		module: api_ai_practice_exports
	},
	"routes/api.ai.split-lessons": {
		id: "routes/api.ai.split-lessons",
		parentId: "root",
		path: "api/ai/split-lessons",
		index: void 0,
		caseSensitive: void 0,
		module: api_ai_split_lessons_exports
	},
	"routes/api.ai.tts": {
		id: "routes/api.ai.tts",
		parentId: "root",
		path: "api/ai/tts",
		index: void 0,
		caseSensitive: void 0,
		module: api_ai_tts_exports
	},
	"routes/api.admin.lesson-import": {
		id: "routes/api.admin.lesson-import",
		parentId: "root",
		path: "api/admin/lesson-import",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_lesson_import_exports
	},
	"routes/api.admin.lesson-import-status": {
		id: "routes/api.admin.lesson-import-status",
		parentId: "root",
		path: "api/admin/lesson-import-status",
		index: void 0,
		caseSensitive: void 0,
		module: api_admin_lesson_import_status_exports
	}
};
var allowedActionOrigins = false;
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
