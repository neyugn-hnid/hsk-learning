import { t as prisma } from "./assets/db.server-D6yr2Dzs.js";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { Form, Link, Links, Meta, NavLink, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, UNSAFE_withErrorBoundaryProps, createCookieSessionStorage, data, isRouteErrorResponse, redirect, useActionData, useFetcher, useLocation, useNavigate, useNavigation, useRevalidator, useRouteError, useSearchParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, FileJson, GitBranch, GraduationCap, Home, Info, ListChecks, Loader2, LogOut, Map as Map$1, Mic, MicOff, RotateCcw, Save, Search, Send, Shield, ShieldCheck, Smartphone, Sparkles, Star, TriangleAlert, Trophy, Upload, User, Users, Volume2, X } from "lucide-react";
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
//#region app/styles/app.css?url
var app_default = "/assets/app-pD-NOi7c.css";
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
				/* @__PURE__ */ jsx(ToastProvider, { children }),
				/* @__PURE__ */ jsx(ScrollRestoration, {}),
				/* @__PURE__ */ jsx(Scripts, {})
			]
		})]
	});
}
var root_default = UNSAFE_withComponentProps(function App() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ToastSearchBridge, {}), /* @__PURE__ */ jsx(Outlet, {})] });
});
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
	content: "Xin chào! Tôi là trợ lý AI học tiếng Trung.\n\n• Hỏi tôi về từ vựng, ngữ pháp, phát âm...\n• Gõ luyện tập để AI tạo câu hỏi trắc nghiệm.\n• Gõ hội thoại để luyện nói tiếng Trung.\n\nBắt đầu ngay nhé!"
};
function AIChatWidget() {
	const location = useLocation();
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState([WELCOME]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [quizSel, setQuizSel] = useState({});
	const [quizChecking, setQuizChecking] = useState({});
	const [quizActive, setQuizActive] = useState(false);
	const quizActiveRef = useRef(false);
	const [listening, setListening] = useState(false);
	const [convoActive, setConvoActive] = useState(false);
	const convoActiveRef = useRef(false);
	const recognitionRef = useRef(null);
	const scrollRef = useRef(null);
	const inputRef = useRef(null);
	const prevWordsRef = useRef([]);
	const setQuizActiveState = (v) => {
		setQuizActive(v);
		quizActiveRef.current = v;
	};
	const setConvoActiveState = (v) => {
		setConvoActive(v);
		convoActiveRef.current = v;
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
		const rec = new SpeechRecognition();
		rec.lang = "zh-CN";
		rec.interimResults = false;
		rec.continuous = false;
		rec.onresult = (e) => {
			const transcript = e.results[0][0].transcript;
			setInput((p) => p + transcript);
		};
		rec.onerror = () => setListening(false);
		rec.onend = () => setListening(false);
		recognitionRef.current = rec;
		rec.start();
		setListening(true);
	};
	useEffect(() => {
		return () => recognitionRef.current?.stop();
	}, []);
	const lessonMatch = location.pathname.match(/^\/lessons\/([^/]+)/);
	const roadmapMatch = location.pathname.match(/^\/roadmap\/([^/]+)/);
	const currentLessonId = lessonMatch ? lessonMatch[1] : null;
	const currentRoadmapId = roadmapMatch ? roadmapMatch[1] : null;
	useEffect(() => {
		if (open) {
			scrollRef.current?.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth"
			});
			setTimeout(() => inputRef.current?.focus(), 300);
		}
	}, [
		open,
		messages,
		quizSel,
		quizChecking
	]);
	const genQuiz = async () => {
		setLoading(true);
		try {
			const body = { intent: "practice_generate" };
			if (currentLessonId) body.lessonIds = [currentLessonId];
			if (currentRoadmapId) body.roadmapId = currentRoadmapId;
			if (prevWordsRef.current.length > 0) body.previousWords = prevWordsRef.current;
			const d = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})).json();
			if (d.question) {
				const word = d.question.answer?.replace(/[()（）].*/g, "").trim();
				if (word && !prevWordsRef.current.includes(word)) prevWordsRef.current.push(word);
				setMessages((p) => [...p, {
					id: `q${Date.now()}`,
					role: "assistant",
					content: d.question.question,
					quiz: d.question
				}]);
			} else {
				setMessages((p) => [...p, {
					id: `a${Date.now()}`,
					role: "assistant",
					content: d.error || "Không tạo được câu hỏi."
				}]);
				setQuizActiveState(false);
			}
		} catch {
			setMessages((p) => [...p, {
				id: `a${Date.now()}`,
				role: "assistant",
				content: "⚠️ Lỗi kết nối."
			}]);
			setQuizActiveState(false);
		} finally {
			setLoading(false);
		}
	};
	const sendMessage = async () => {
		const text = input.trim();
		if (!text || loading) return;
		setMessages((p) => [...p, {
			id: `u${Date.now()}`,
			role: "user",
			content: text
		}]);
		setInput("");
		setLoading(true);
		try {
			if (/^(kết thúc|dừng|stop|end|thoát)/i.test(text)) {
				setQuizActiveState(false);
				setConvoActiveState(false);
				const label = quizActiveRef.current ? "luyện tập" : "hội thoại";
				setMessages((p) => [...p, {
					id: `a${Date.now()}`,
					role: "assistant",
					content: `Đã kết thúc ${label}. Gõ luyện tập hoặc hội thoại để bắt đầu!`
				}]);
				setLoading(false);
				return;
			}
			if (/^(hội thoại|nói chuyện|hoi thoai|conversation|对话|đối thoại)/i.test(text)) {
				setConvoActiveState(true);
				setQuizActiveState(false);
				const label = currentLessonId || currentRoadmapId ? "bài này" : "tiếng Trung";
				setMessages((p) => [...p, {
					id: `a${Date.now()}`,
					role: "assistant",
					content: `Bắt đầu hội thoại về ${label}! Hãy nói hoặc gõ tiếng Trung. Gõ kết thúc để dừng.`
				}]);
				setLoading(false);
				const body = {
					intent: "chat",
					messages: [{
						role: "user",
						content: `Hãy bắt đầu một cuộc hội thoại tiếng Trung về chủ đề: ${label}. Nói 1-2 câu bằng tiếng Trung kèm pinyin.`
					}]
				};
				if (currentLessonId) body.lessonIds = [currentLessonId];
				if (currentRoadmapId) body.roadmapId = currentRoadmapId;
				setTimeout(async () => {
					setLoading(true);
					try {
						const d = await (await fetch("/api/ai/chat", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(body)
						})).json();
						setMessages((p) => [...p, {
							id: `a${Date.now()}`,
							role: "assistant",
							content: d.reply || d.error || "Lỗi."
						}]);
					} catch {
						setMessages((p) => [...p, {
							id: `a${Date.now()}`,
							role: "assistant",
							content: "⚠️ Lỗi."
						}]);
					} finally {
						setLoading(false);
					}
				}, 500);
				return;
			}
			if (/^(luyện tập|luyen tap|luyện|practice|quiz|ôn tập|kiem tra|kiểm tra)/i.test(text)) {
				setQuizActiveState(true);
				prevWordsRef.current = [];
				setMessages((p) => [...p, {
					id: `a${Date.now()}`,
					role: "assistant",
					content: "Bắt đầu chuỗi luyện tập! Trả lời từng câu, gõ kết thúc để dừng."
				}]);
				setLoading(false);
				setTimeout(() => genQuiz(), 400);
				return;
			}
			const d = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "chat",
					messages: [{
						role: "user",
						content: text
					}]
				})
			})).json();
			setMessages((p) => [...p, {
				id: `a${Date.now()}`,
				role: "assistant",
				content: d.reply || d.error || "Lỗi."
			}]);
		} catch {
			setMessages((p) => [...p, {
				id: `a${Date.now()}`,
				role: "assistant",
				content: "⚠️ Lỗi kết nối."
			}]);
		} finally {
			setLoading(false);
			inputRef.current?.focus();
		}
	};
	const checkQuiz = async (msgId, quiz, answer) => {
		setQuizChecking((p) => ({
			...p,
			[msgId]: true
		}));
		try {
			const d = await (await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "practice_check",
					userAnswer: answer,
					question: quiz.question,
					correctAnswer: quiz.answer
				})
			})).json();
			setMessages((p) => p.map((m) => m.id === msgId ? {
				...m,
				quizChecked: true,
				quizCorrect: d.correct,
				content: `Đáp án: ${quiz.answer} — ${d.feedback || (d.correct ? "Chính xác!" : "Chưa đúng!")}`
			} : m));
			setQuizChecking((p) => ({
				...p,
				[msgId]: false
			}));
			if (quizActiveRef.current) setTimeout(() => genQuiz(), 600);
		} catch {
			setMessages((p) => p.map((m) => m.id === msgId ? {
				...m,
				quizChecked: true,
				quizCorrect: false
			} : m));
			setQuizChecking((p) => ({
				...p,
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
		prevWordsRef.current = [];
	};
	const [speaking, setSpeaking] = useState(false);
	const audioRef = useRef(null);
	const speakText = async (text) => {
		if (speaking) {
			audioRef.current?.pause();
			setSpeaking(false);
			return;
		}
		const clean = text.replace(/\*\*|__|`|[*_~]/g, "").replace(/[ABCD]\)/g, "").slice(0, 500);
		setSpeaking(true);
		try {
			const chineseChars = clean.match(/[\u4e00-\u9fff]/g);
			const lang = chineseChars && chineseChars.length > clean.length * .3 ? "zh-CN" : "vi-VN";
			const d = await (await fetch("/api/ai/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: clean,
					lang
				})
			})).json();
			if (d.audio) {
				const audio = new Audio(`data:audio/mp3;base64,${d.audio}`);
				audio.onended = () => setSpeaking(false);
				audio.onerror = () => setSpeaking(false);
				audioRef.current = audio;
				audio.play();
			} else {
				setSpeaking(false);
				fallbackSpeak(clean, lang);
			}
		} catch {
			setSpeaking(false);
			fallbackSpeak(clean, "vi-VN");
		}
	};
	const fallbackSpeak = (text, lang) => {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
		window.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		u.lang = lang;
		u.rate = 1;
		const match = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.split("-")[0]));
		if (match) u.voice = match;
		window.speechSynthesis.speak(u);
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [!open ? /* @__PURE__ */ jsx("button", {
		onClick: () => setOpen(true),
		className: "fixed bottom-20 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-all hover:scale-110 md:bottom-6 md:right-6",
		type: "button",
		"aria-label": "Mở trợ lý AI",
		children: /* @__PURE__ */ jsx(GraduationCap, { size: 24 })
	}) : null, open ? /* @__PURE__ */ jsxs("div", {
		className: "fixed bottom-24 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl md:bottom-24 md:right-6",
		style: { height: "min(600px, calc(100vh - 8rem))" },
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: `flex items-center justify-between rounded-t-3xl px-4 py-3 text-white ${quizActive ? "bg-red-500" : convoActive ? "bg-blue-500" : "bg-red-500"}`,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(GraduationCap, { size: 20 }), /* @__PURE__ */ jsx("span", {
						className: "text-sm font-bold",
						children: quizActive ? "Đang luyện tập" : convoActive ? "Đang hội thoại" : "HSK Learning"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: reset,
						className: "rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition",
						type: "button",
						title: "Làm mới",
						children: /* @__PURE__ */ jsx(RotateCcw, { size: 14 })
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setOpen(false),
						className: "rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition",
						type: "button",
						title: "Đóng",
						children: /* @__PURE__ */ jsx(X, { size: 16 })
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				ref: scrollRef,
				className: "flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:hidden",
				style: { scrollbarWidth: "none" },
				children: [messages.map((msg) => /* @__PURE__ */ jsxs("div", {
					className: `flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`,
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600",
						children: msg.role === "user" ? /* @__PURE__ */ jsx(User, { size: 14 }) : /* @__PURE__ */ jsx(GraduationCap, { size: 14 })
					}), /* @__PURE__ */ jsxs("div", {
						className: `max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap relative group ${msg.role === "user" ? "bg-red-600 text-white" : "bg-slate-50 text-slate-700"}`,
						children: [msg.quiz && !msg.quizChecked ? /* @__PURE__ */ jsxs("div", {
							className: "w-56",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700",
									children: msg.quiz.type === "pinyin" ? "Pinyin" : msg.quiz.type === "recognition" ? "Chữ Hán" : "Nghĩa"
								}),
								" ",
								"-",
								/* @__PURE__ */ jsx("span", {
									className: "mt-1.5 text-xs font-extrabold text-slate-900",
									children: msg.quiz.question
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-2 grid gap-1",
									children: msg.quiz.options.map((opt) => {
										return /* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setQuizSel((p) => ({
												...p,
												[msg.id]: opt
											})),
											className: `rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition truncate ${quizSel[msg.id] === opt ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`,
											children: opt
										}, opt);
									})
								}),
								/* @__PURE__ */ jsxs("button", {
									onClick: () => {
										const ans = quizSel[msg.id];
										if (ans) checkQuiz(msg.id, msg.quiz, ans);
									},
									disabled: !quizSel[msg.id] || quizChecking[msg.id],
									className: "mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 py-2 text-[11px] font-bold text-white disabled:opacity-40 transition",
									children: [quizChecking[msg.id] ? /* @__PURE__ */ jsx(Loader2, {
										size: 12,
										className: "animate-spin"
									}) : /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }), "Kiểm tra"]
								})
							]
						}) : msg.quiz && msg.quizChecked ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
							className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${msg.quizCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`,
							children: [msg.quizCorrect ? /* @__PURE__ */ jsx(CheckCircle2, { size: 10 }) : /* @__PURE__ */ jsx(X, { size: 10 }), msg.quizCorrect ? "Chính xác" : "Chưa đúng"]
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] font-medium",
							children: msg.content
						})] }) : typeof msg.content === "string" ? msg.content.replace(/\*\*/g, "") : msg.content, msg.role === "assistant" && msg.id !== "welcome" ? /* @__PURE__ */ jsxs("button", {
							onClick: () => speakText(msg.content),
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
				}, msg.id)), loading ? /* @__PURE__ */ jsxs("div", {
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
						"Luyện tập",
						"Hội thoại",
						"Giải thích từ",
						"Cho ví dụ",
						"Ngữ pháp"
					].map((q) => /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => {
							setInput(q);
							inputRef.current?.focus();
						},
						className: "shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition",
						children: q
					}, q))
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: (e) => {
						e.preventDefault();
						sendMessage();
					},
					className: "flex gap-2 border-t border-slate-100 p-3",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: toggleMic,
							className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${listening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"}`,
							title: "Nhập giọng nói",
							children: listening ? /* @__PURE__ */ jsx(MicOff, { size: 14 }) : /* @__PURE__ */ jsx(Mic, { size: 14 })
						}),
						/* @__PURE__ */ jsx("input", {
							ref: inputRef,
							value: input,
							onChange: (e) => setInput(e.target.value),
							placeholder: quizActive ? "Gõ \"kết thúc\" để dừng luyện tập..." : convoActive ? "Nói hoặc gõ tiếng Trung..." : "Hỏi từ vựng hoặc gõ \"luyện tập\"...",
							className: "flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100",
							disabled: loading
						}),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: !input.trim() || loading,
							className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white disabled:opacity-40 transition",
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
			to: "/hsk20",
			label: "HSK 2.0",
			icon: BookOpen
		},
		{
			to: "/hsk30",
			label: "HSK 3.0",
			icon: Sparkles
		},
		{
			to: "/roadmap",
			label: "Lộ trình",
			icon: Map$1
		}
	];
	const bottomTabs = [
		{
			to: "/hsk20",
			label: "HSK 2.0",
			icon: BookOpen
		},
		{
			to: "/hsk30",
			label: "HSK 3.0",
			icon: Sparkles
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
									className: `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${active ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-100"}`,
									children: [/* @__PURE__ */ jsx(Icon, { size: 16 }), item.label]
								}, item.to);
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "relative flex items-center gap-2",
							ref: menuRef,
							children: [
								!user ? /* @__PURE__ */ jsx(Link, {
									to: "/register",
									className: "hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 lg:flex",
									children: "Bắt đầu học"
								}) : null,
								user ? /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setMenuOpen((prev) => !prev),
									"aria-label": "Mở menu tài khoản",
									className: "flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50",
									children: /* @__PURE__ */ jsx(User, { size: 20 })
								}) : /* @__PURE__ */ jsx(Link, {
									to: "/login",
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
												onClick: () => setMenuOpen(false),
												className: "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100",
												children: [/* @__PURE__ */ jsx(User, { size: 16 }), "Hồ sơ"]
											}), user?.role === "ADMIN" ? /* @__PURE__ */ jsxs(Link, {
												to: "/admin",
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
	createUserSession: () => createUserSession,
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
	if (!user) throw redirect("/login");
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
async function createUserSession(request, userId, redirectTo = "/", toast) {
	const session = await getSession(request);
	session.set("userId", userId);
	return redirect(buildRedirectUrl(redirectTo, toast), { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } });
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
	loader: () => loader$16
});
async function loader$16({ request }) {
	return { user: await getUser(request) };
}
var _index_default = UNSAFE_withComponentProps(function Home({ loaderData }) {
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", { children: [/* @__PURE__ */ jsxs("section", {
			className: "mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-24",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-red-700",
					children: "Học tiếng Trung có lộ trình rõ ràng"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-6xl",
					children: "Học tiếng Trung dễ dàng hơn mỗi ngày"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg md:leading-8",
					children: "Tab Lộ trình dùng dữ liệu riêng để bám sát tiến độ trên lớp. Tab Bài học là khu học HSK riêng, nơi bạn học từ vựng, pinyin, ngữ pháp và quiz."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-8 flex flex-wrap gap-3",
					children: [
						/* @__PURE__ */ jsx(Link, {
							to: "/hsk20",
							className: "flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-100 hover:bg-red-700",
							children: "Học HSK 2.0"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/hsk30",
							className: "flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-100 hover:bg-amber-700",
							children: "Học HSK 3.0"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/roadmap",
							className: "rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50",
							children: "Xem lộ trình lớp"
						})
					]
				})
			] }), /* @__PURE__ */ jsx("div", {
				className: "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl",
				children: /* @__PURE__ */ jsxs("div", {
					className: "rounded-3xl bg-gradient-to-br from-red-50 to-amber-50 p-8",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-center text-6xl font-black text-red-600 sm:text-8xl",
							children: "你好"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-center text-2xl font-semibold text-slate-800",
							children: "nǐ hǎo"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-center text-lg text-slate-600",
							children: "Xin chào"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-8 rounded-2xl bg-white p-4 shadow-sm",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "font-semibold",
									children: "Ví dụ"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-xl text-bold",
									children: "你好，我叫小明。"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-slate-500",
									children: "Xin chào, tôi tên là Tiểu Minh."
								})
							]
						})
					]
				})
			})]
		}), /* @__PURE__ */ jsx("section", {
			className: "mx-auto max-w-7xl px-4 pb-20",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(Feature, {
						icon: BookOpen,
						title: "Bài học HSK",
						text: "Học theo bộ bài HSK, dễ tìm và dễ ôn lại."
					}),
					/* @__PURE__ */ jsx(Feature, {
						icon: Volume2,
						title: "Luyện pinyin",
						text: "Hiển thị pinyin rõ ràng, hỗ trợ học phát âm."
					}),
					/* @__PURE__ */ jsx(Feature, {
						icon: ListChecks,
						title: "Làm quiz",
						text: "Củng cố kiến thức bằng câu hỏi trắc nghiệm."
					}),
					/* @__PURE__ */ jsx(Feature, {
						icon: BarChart3,
						title: "Lộ trình trên lớp",
						text: "Dùng dữ liệu riêng cho từng buổi học, chặng học và mục tiêu cần đạt."
					})
				]
			})
		})] })
	});
});
function Feature({ icon: Icon, title, text }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600",
				children: /* @__PURE__ */ jsx(Icon, { size: 22 })
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-5 text-lg font-bold",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm leading-6 text-slate-600",
				children: text
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
	loader: () => loader$15
});
async function loader$15({ request }) {
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
	loader: () => loader$14
});
async function loader$14({ request }) {
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
	loader: () => loader$13
});
async function loader$13({ request }) {
	const url = new URL(request.url);
	const level = url.searchParams.get("level") || "Tất cả";
	const q = url.searchParams.get("q") || "";
	const lessons = await prisma.lesson.findMany({
		where: {
			status: "PUBLISHED",
			...level !== "Tất cả" ? { level } : {},
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
	});
	return {
		user: await getUser(request),
		lessons,
		level,
		q
	};
}
var lessons__index_default = UNSAFE_withComponentProps(function Lessons({ loaderData }) {
	const [params, setParams] = useSearchParams();
	const levels = [
		"Tất cả",
		"HSK1",
		"HSK2",
		"HSK3",
		"HSK4",
		"HSK5",
		"HSK6"
	];
	const setLevel = (level) => {
		const next = new URLSearchParams(params);
		level === "Tất cả" ? next.delete("level") : next.set("level", level);
		setParams(next);
	};
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-7xl px-4 py-8 md:py-10",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col justify-between gap-5 md:flex-row md:items-end",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-extrabold md:text-3xl",
					children: "Danh sách bài học"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-2 text-slate-600",
					children: "Chọn bài học phù hợp với cấp độ của bạn."
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "grid w-full grid-cols-[minmax(0,1fr)_9.5rem] gap-3 md:w-auto md:min-w-[32rem] md:items-end md:justify-end",
					children: [/* @__PURE__ */ jsx("label", {
						className: "min-w-0",
						children: /* @__PURE__ */ jsxs("form", {
							className: "relative w-full",
							children: [/* @__PURE__ */ jsx(Search, {
								className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400",
								size: 18
							}), /* @__PURE__ */ jsx("input", {
								name: "q",
								defaultValue: loaderData.q,
								placeholder: "Tìm bài học...",
								className: "min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
							})]
						})
					}), /* @__PURE__ */ jsx("label", {
						className: "min-w-0",
						children: /* @__PURE__ */ jsxs("div", {
							className: "relative w-full",
							children: [/* @__PURE__ */ jsxs("select", {
								value: loaderData.level,
								onChange: (event) => setLevel(event.target.value),
								className: "min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100",
								children: [/* @__PURE__ */ jsx("option", {
									value: "",
									disabled: true,
									children: "Cấp độ"
								}), levels.map((level) => /* @__PURE__ */ jsx("option", {
									value: level,
									children: level
								}, level))]
							}), /* @__PURE__ */ jsx(ChevronDown, {
								className: "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400",
								size: 18
							})]
						})
					})]
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: loaderData.lessons.map((lesson) => /* @__PURE__ */ jsxs(Link, {
					to: `/lessons/${lesson.id}`,
					className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "flex items-start justify-between",
							children: /* @__PURE__ */ jsx("span", {
								className: "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600",
								children: lesson.level
							})
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-5 text-xl font-bold",
							children: lesson.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 line-clamp-2 text-sm leading-6 text-slate-600",
							children: lesson.description
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-5 flex gap-4 text-sm text-slate-500",
							children: [/* @__PURE__ */ jsxs("span", { children: [lesson._count.vocabularies, " từ vựng"] }), /* @__PURE__ */ jsxs("span", { children: [lesson._count.quizzes, " câu quiz"] })]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-center font-semibold text-white hover:bg-red-600",
							children: "Vào học"
						})
					]
				}, lesson.id))
			})]
		})
	});
});
//#endregion
//#region app/routes/lessons.$lessonId.tsx
var lessons_$lessonId_exports = /* @__PURE__ */ __exportAll({
	default: () => lessons_$lessonId_default,
	loader: () => loader$12
});
async function loader$12({ request, params }) {
	const lesson = await prisma.lesson.findUnique({
		where: { id: params.lessonId },
		include: {
			vocabularies: true,
			grammars: true,
			quizzes: true
		}
	});
	if (!lesson) throw data("Không tìm thấy bài học", { status: 404 });
	return {
		user: await getUser(request),
		lesson
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
	window.speechSynthesis.speak(utterance);
}
var lessons_$lessonId_default = UNSAFE_withComponentProps(function LessonDetail({ loaderData }) {
	const { lesson } = loaderData;
	const [activeTab, setActiveTab] = useState("vocabulary");
	const [vocabIndex, setVocabIndex] = useState(0);
	const [showMeaning, setShowMeaning] = useState(false);
	const [translationAnswer, setTranslationAnswer] = useState("");
	const [checkedTranslation, setCheckedTranslation] = useState(false);
	const [hanziAnswer, setHanziAnswer] = useState("");
	const [checkedHanzi, setCheckedHanzi] = useState(false);
	const [quizIndex, setQuizIndex] = useState(0);
	const [quizResponse, setQuizResponse] = useState("");
	const [quizMode, setQuizMode] = useState("meaning");
	const [shuffledVocab] = useState(() => shuffleItems$1(lesson.vocabularies));
	const [shuffledQuizzes] = useState(() => shuffleItems$1(lesson.quizzes));
	const generatedQuizzes = useMemo(() => {
		return shuffledVocab.map((vocab) => {
			const distractors = shuffledVocab.filter((v) => v.chinese !== vocab.chinese).map((v) => {
				if (quizMode === "pinyin") return v.pinyin;
				if (quizMode === "recognition" || quizMode === "listening") return v.chinese;
				return v.meaningVi;
			}).filter(Boolean);
			const answer = quizMode === "pinyin" ? vocab.pinyin : quizMode === "recognition" || quizMode === "listening" ? vocab.chinese : vocab.meaningVi;
			const options = shuffleItems$1([...new Set([answer, ...distractors])].slice(0, 4));
			return {
				type: quizMode === "pinyin" ? "PINYIN" : quizMode === "recognition" || quizMode === "listening" ? "CHAR_RECOGNITION" : "MEANING",
				question: quizMode === "pinyin" ? `"${vocab.chinese}" đọc pinyin là gì?` : quizMode === "listening" ? "Nghe và chọn chữ Hán đúng" : quizMode === "recognition" ? `Chữ Hán nào có pinyin "${vocab.pinyin}"?` : `"${vocab.chinese}" nghĩa là gì?`,
				options,
				answer,
				promptPinyin: vocab.pinyin
			};
		});
	}, [quizMode, shuffledVocab]);
	const practiceQuestions = shuffledQuizzes.length && quizMode === "meaning" ? shuffledQuizzes : generatedQuizzes;
	const currentVocab = shuffledVocab[vocabIndex];
	const currentQuiz = practiceQuestions[quizIndex];
	const normalizedUserMeaning = translationAnswer.trim().toLowerCase();
	const normalizedCorrectMeaning = (currentVocab?.meaningVi || "").trim().toLowerCase();
	const translationCorrect = checkedTranslation && normalizedUserMeaning.length > 0 && (normalizedUserMeaning === normalizedCorrectMeaning || normalizedCorrectMeaning.includes(normalizedUserMeaning) || normalizedUserMeaning.includes(normalizedCorrectMeaning));
	const normalizedUserHanzi = hanziAnswer.trim();
	const normalizedCorrectHanzi = (currentVocab?.chinese || "").trim();
	const hanziCorrect = checkedHanzi && normalizedUserHanzi.length > 0 && normalizedUserHanzi === normalizedCorrectHanzi;
	const hasQuizAnswer = quizResponse.trim().length > 0;
	hasQuizAnswer && (quizResponse.trim(), (currentQuiz?.answer || "").trim());
	useEffect(() => {
		setVocabIndex(0);
		setShowMeaning(false);
		setTranslationAnswer("");
		setCheckedTranslation(false);
		setHanziAnswer("");
		setCheckedHanzi(false);
		setQuizIndex(0);
		setQuizResponse("");
		setQuizMode("meaning");
	}, [activeTab]);
	useEffect(() => {
		setQuizIndex(0);
		setQuizResponse("");
	}, [quizMode]);
	useEffect(() => {
		setQuizResponse("");
	}, [quizIndex]);
	useEffect(() => {
		if (activeTab === "quiz" && quizMode === "listening" && currentQuiz?.answer) speakChinese$1(currentQuiz.answer);
	}, [
		quizIndex,
		quizMode,
		activeTab,
		currentQuiz?.answer
	]);
	const switchTab = (tab) => {
		if (!shuffledVocab.length && tab !== "quiz") return;
		if (tab === "quiz" && !shuffledVocab.length && !shuffledQuizzes.length) return;
		setActiveTab(tab);
	};
	const randomOther = (current, total) => {
		if (total <= 1) return 0;
		let next;
		do
			next = Math.floor(Math.random() * total);
		while (next === current);
		return next;
	};
	const nextVocab = () => {
		if (!shuffledVocab.length) return;
		setVocabIndex(randomOther(vocabIndex, shuffledVocab.length));
		setShowMeaning(false);
		setTranslationAnswer("");
		setCheckedTranslation(false);
		setHanziAnswer("");
		setCheckedHanzi(false);
	};
	const prevVocab = () => {
		if (!shuffledVocab.length) return;
		setVocabIndex(randomOther(vocabIndex, shuffledVocab.length));
		setShowMeaning(false);
		setTranslationAnswer("");
		setCheckedTranslation(false);
		setHanziAnswer("");
		setCheckedHanzi(false);
	};
	const nextQuiz = () => {
		if (!practiceQuestions.length) return;
		setQuizIndex(randomOther(quizIndex, practiceQuestions.length));
		setQuizResponse("");
	};
	const prevQuiz = () => {
		if (!practiceQuestions.length) return;
		setQuizIndex(randomOther(quizIndex, practiceQuestions.length));
		setQuizResponse("");
	};
	const tabTitle = activeTab === "vocabulary" ? "Học từ vựng" : activeTab === "translation" ? "Dịch nghĩa" : activeTab === "hanzi" ? "Chữ Hán" : "Luyện tập";
	const activeCount = activeTab === "quiz" ? practiceQuestions.length : shuffledVocab.length;
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
										children: activeTab === "quiz" ? `Câu ${quizIndex + 1}/${activeCount}` : `${vocabIndex + 1}/${activeCount}`
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "-mx-1 flex justify-center overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0",
									children: [
										"vocabulary",
										"translation",
										"hanzi",
										"quiz"
									].map((tab) => /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => switchTab(tab),
										disabled: !shuffledVocab.length && tab !== "quiz",
										className: `mx-1 shrink-0 rounded-full px-4 py-2 text-xs font-bold transition sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${activeTab === tab ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"} disabled:cursor-not-allowed disabled:opacity-40`,
										children: tab === "vocabulary" ? "Từ Vựng" : tab === "translation" ? "Dịch Nghĩa" : tab === "hanzi" ? "Chữ Hán" : "Luyện Tập"
									}, tab))
								})
							]
						}),
						activeTab === "vocabulary" && currentVocab && /* @__PURE__ */ jsx("div", {
							className: "overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => speakChinese$1(currentVocab.chinese),
										className: "absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3",
										title: "Nghe phát âm",
										type: "button",
										children: /* @__PURE__ */ jsx(Volume2, {
											size: 18,
											className: "sm:w-5 sm:h-5"
										})
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
									showMeaning ? /* @__PURE__ */ jsxs("div", {
										className: "mt-4 rounded-2xl bg-amber-50 p-3 sm:mt-6 sm:rounded-3xl sm:p-5",
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-lg font-extrabold text-slate-900 sm:text-2xl",
												children: currentVocab.meaningVi
											}),
											currentVocab.exampleChinese ? /* @__PURE__ */ jsxs("div", {
												className: "mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2",
												children: [/* @__PURE__ */ jsx("p", {
													className: "break-words text-sm font-semibold sm:text-lg",
													children: currentVocab.exampleChinese
												}), /* @__PURE__ */ jsx("button", {
													onClick: () => speakChinese$1(currentVocab.exampleChinese || ""),
													className: "rounded-full bg-white p-1.5 text-red-600 hover:bg-red-100 sm:p-2",
													type: "button",
													children: /* @__PURE__ */ jsx(Volume2, {
														size: 14,
														className: "sm:w-4 sm:h-4"
													})
												})]
											}) : null,
											currentVocab.examplePinyin ? /* @__PURE__ */ jsx("p", {
												className: "mt-1 text-xs font-semibold text-red-600 sm:text-sm",
												children: currentVocab.examplePinyin
											}) : null,
											currentVocab.exampleMeaning ? /* @__PURE__ */ jsx("p", {
												className: "mt-1 text-xs text-slate-600 sm:text-sm",
												children: currentVocab.exampleMeaning
											}) : null
										]
									}) : /* @__PURE__ */ jsx("div", {
										className: "mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 sm:mt-6 sm:rounded-3xl sm:p-5 sm:text-sm",
										children: "Ẩn nghĩa để bạn tự nhớ trước"
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-3 gap-1.5 sm:mt-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-2.5",
										children: [
											/* @__PURE__ */ jsx(NavBtn, {
												onClick: prevVocab,
												label: "Trước"
											}),
											/* @__PURE__ */ jsxs("button", {
												onClick: () => setShowMeaning((p) => !p),
												type: "button",
												className: "flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-700 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm",
												children: [showMeaning ? /* @__PURE__ */ jsx(EyeOff, {
													size: 16,
													className: "sm:w-[18px] sm:h-[18px]"
												}) : /* @__PURE__ */ jsx(Eye, {
													size: 16,
													className: "sm:w-[18px] sm:h-[18px]"
												}), showMeaning ? "Ẩn" : "Lật"]
											}),
											/* @__PURE__ */ jsx(NavBtn, {
												onClick: nextVocab,
												label: "Tiếp",
												next: true
											})
										]
									})
								]
							})
						}),
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
											value: translationAnswer,
											onChange: (e) => setTranslationAnswer(e.target.value),
											placeholder: "Nhập nghĩa tiếng Việt...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${checkedTranslation ? translationCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") setCheckedTranslation(true);
											}
										})
									}),
									!checkedTranslation ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setCheckedTranslation(true),
										disabled: !translationAnswer.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
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
											value: hanziAnswer,
											onChange: (e) => setHanziAnswer(e.target.value),
											placeholder: "Nhập chữ Hán...",
											className: `w-full rounded-2xl border px-4 py-3 text-xl font-semibold outline-none transition ${checkedHanzi ? hanziCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") setCheckedHanzi(true);
											}
										})
									}),
									!checkedHanzi ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setCheckedHanzi(true),
										disabled: !hanziAnswer.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
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
										className: "-mx-1 mb-4 flex overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0",
										children: [
											"meaning",
											"pinyin",
											"recognition",
											"listening"
										].map((m) => /* @__PURE__ */ jsx("button", {
											onClick: () => setQuizMode(m),
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
										children: (Array.isArray(currentQuiz.options) ? currentQuiz.options.map((o) => String(o)) : []).map((option) => {
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
	loader: () => loader$11
});
async function loader$11({ request }) {
	const user = await requireUser(request);
	const url = new URL(request.url);
	const phase = url.searchParams.get("phase") || "Tất cả";
	const q = url.searchParams.get("q") || "";
	const where = {
		...phase !== "Tất cả" ? { phase } : {},
		...q ? { OR: [{ title: {
			contains: q,
			mode: "insensitive"
		} }, { description: {
			contains: q,
			mode: "insensitive"
		} }] } : {}
	};
	const [items, phases] = await Promise.all([prisma.roadmapItem.findMany({
		where,
		orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }]
	}), prisma.roadmapItem.findMany({
		distinct: ["phase"],
		select: { phase: true },
		orderBy: { phase: "asc" }
	})]);
	return {
		user,
		items,
		q,
		phase,
		phases: ["Tất cả", ...phases.map((item) => item.phase)]
	};
}
var roadmap_default = UNSAFE_withComponentProps(function RoadmapPage({ loaderData }) {
	const [params, setParams] = useSearchParams();
	const items = loaderData.items;
	const setPhase = (phase) => {
		const next = new URLSearchParams(params);
		if (phase === "Tất cả") next.delete("phase");
		else next.set("phase", phase);
		setParams(next);
	};
	const grouped = items.reduce((acc, item) => {
		acc[item.phase] = [...acc[item.phase] || [], item];
		return acc;
	}, {});
	return /* @__PURE__ */ jsx(SiteLayout, {
		user: loaderData.user,
		children: /* @__PURE__ */ jsxs("main", {
			className: "mx-auto max-w-7xl px-4 py-8 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col justify-between gap-5 md:flex-row md:items-end",
					children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-11 w-11 items-center justify-center rounded-full bg-red-50",
							children: /* @__PURE__ */ jsx(Map$1, {
								size: 20,
								className: "text-red-600"
							})
						}), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", {
							className: "text-3xl font-black text-slate-900",
							children: "Lộ Trình Học"
						}) })]
					}) }), /* @__PURE__ */ jsxs("div", {
						className: "grid w-full grid-cols-[minmax(0,1fr)_10rem] gap-3 md:w-auto md:min-w-[34rem] md:items-end md:justify-end",
						children: [/* @__PURE__ */ jsx("label", {
							className: "min-w-0",
							children: /* @__PURE__ */ jsxs("form", {
								className: "relative w-full",
								children: [/* @__PURE__ */ jsx(Search, {
									className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400",
									size: 18
								}), /* @__PURE__ */ jsx("input", {
									name: "q",
									defaultValue: loaderData.q,
									placeholder: "Tìm trong lộ trình...",
									className: "min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
								})]
							})
						}), /* @__PURE__ */ jsx(CustomSelect, {
							value: loaderData.phase,
							onChange: setPhase,
							options: loaderData.phases.map((phase) => ({
								value: phase,
								label: phase
							})),
							focusColor: "focus:border-red-400 focus:ring-red-100"
						})]
					})]
				}),
				Object.entries(grouped).map(([phase, phaseItems]) => /* @__PURE__ */ jsxs("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-slate-200" }),
							/* @__PURE__ */ jsx("h3", {
								className: "text-sm font-black uppercase tracking-[0.2em] text-slate-400",
								children: phase
							}),
							/* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-slate-200" })
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: phaseItems.map((item) => {
							const totalCount = countJsonObjects(item.vocabulary) + countJsonObjects(item.phrases);
							return /* @__PURE__ */ jsxs(Link, {
								to: `/roadmap/${item.id}`,
								className: "group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md h-56",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600",
											children: item.phase
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-xs font-bold text-slate-400",
											children: ["Buổi ", item.orderNo]
										})]
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "mt-4 text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors",
										children: item.title
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 line-clamp-2 text-sm leading-6 text-slate-500",
										children: item.description || "Buổi học trong lộ trình."
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-auto flex items-center justify-between border-t border-slate-100 pt-4",
										children: [/* @__PURE__ */ jsxs("span", {
											className: "text-sm font-semibold text-slate-400",
											children: [totalCount, " từ & câu"]
										}), /* @__PURE__ */ jsx(ArrowRight, {
											size: 18,
											className: "text-red-400 group-hover:text-red-600 transition-colors"
										})]
									})
								]
							}, item.id);
						})
					})]
				}, phase)),
				items.length === 0 ? /* @__PURE__ */ jsx("div", {
					className: "mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500",
					children: "Chưa có dữ liệu lộ trình phù hợp với bộ lọc hiện tại."
				}) : null
			]
		})
	});
});
function toRoadmapEntries(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => Boolean(item) && typeof item === "object").map((item) => ({
		chinese: String(item.chinese || ""),
		pinyin: String(item.pinyin || ""),
		meaningVi: String(item.meaningVi || item.meaning || "")
	})).filter((item) => item.chinese && item.meaningVi);
}
function countJsonObjects(value) {
	return toRoadmapEntries(value).length;
}
//#endregion
//#region app/routes/roadmap.$roadmapId.tsx
var roadmap_$roadmapId_exports = /* @__PURE__ */ __exportAll({
	default: () => roadmap_$roadmapId_default,
	loader: () => loader$10
});
async function loader$10({ request, params }) {
	const user = await getUser(request);
	const roadmap = await prisma.roadmapItem.findUnique({ where: { id: params.roadmapId } });
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
		exampleMeaning: item.exampleMeaning ? String(item.exampleMeaning) : void 0
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
	window.speechSynthesis.speak(u);
}
var roadmap_$roadmapId_default = UNSAFE_withComponentProps(function RoadmapDetail({ loaderData }) {
	const { lesson } = loaderData;
	const [activeTab, setActiveTab] = useState(lesson.vocabularies.length ? "vocabulary" : "quiz");
	const [vocabIndex, setVocabIndex] = useState(0);
	const [showMeaning, setShowMeaning] = useState(false);
	const [tlA, setTlA] = useState("");
	const [tlC, setTlC] = useState(false);
	const [hzA, setHzA] = useState("");
	const [hzC, setHzC] = useState(false);
	const [qzI, setQzI] = useState(0);
	const [qzR, setQzR] = useState("");
	const [qzM, setQzM] = useState("meaning");
	const [sVocab] = useState(() => shuffleItems(lesson.vocabularies));
	const gQuiz = useMemo(() => sVocab.map((v) => {
		const d = sVocab.filter((x) => x.chinese !== v.chinese).map((x) => qzM === "pinyin" ? x.pinyin : qzM === "recognition" || qzM === "listening" ? x.chinese : x.meaningVi).filter(Boolean);
		const a = qzM === "pinyin" ? v.pinyin : qzM === "recognition" || qzM === "listening" ? v.chinese : v.meaningVi;
		return {
			type: qzM === "pinyin" ? "PINYIN" : qzM === "recognition" || qzM === "listening" ? "CHAR_RECOGNITION" : "MEANING",
			question: qzM === "pinyin" ? `"${v.chinese}" đọc pinyin là gì?` : qzM === "listening" ? "Nghe và chọn chữ Hán đúng" : qzM === "recognition" ? `Chữ Hán nào có pinyin "${v.pinyin}"?` : `"${v.chinese}" nghĩa là gì?`,
			options: shuffleItems([...new Set([a, ...d])].slice(0, 4)),
			answer: a,
			promptPinyin: v.pinyin
		};
	}), [qzM, sVocab]);
	const cVocab = sVocab[vocabIndex];
	const cQuiz = gQuiz[qzI];
	const tlOK = tlC && tlA.trim().toLowerCase() === (cVocab?.meaningVi || "").trim().toLowerCase();
	const hzOK = hzC && hzA.trim() === (cVocab?.chinese || "").trim();
	const qzHas = qzR.trim().length > 0;
	qzHas && (qzR.trim(), (cQuiz?.answer || "").trim());
	useEffect(() => {
		setVocabIndex(0);
		setShowMeaning(false);
		setTlA("");
		setTlC(false);
		setHzA("");
		setHzC(false);
		setQzI(0);
		setQzR("");
		setQzM("meaning");
	}, [activeTab]);
	useEffect(() => {
		setQzI(0);
		setQzR("");
	}, [qzM]);
	useEffect(() => {
		setQzR("");
	}, [qzI]);
	useEffect(() => {
		if (activeTab === "quiz" && qzM === "listening" && cQuiz?.answer) speakChinese(cQuiz.answer);
	}, [
		qzI,
		qzM,
		activeTab,
		cQuiz?.answer
	]);
	const randomOther = (current, total) => {
		if (total <= 1) return 0;
		let next;
		do
			next = Math.floor(Math.random() * total);
		while (next === current);
		return next;
	};
	const sw = (t) => {
		if (!sVocab.length && t !== "quiz") return;
		setActiveTab(t);
	};
	const nV = () => {
		if (!sVocab.length) return;
		setVocabIndex(randomOther(vocabIndex, sVocab.length));
		setShowMeaning(false);
		setTlA("");
		setTlC(false);
		setHzA("");
		setHzC(false);
	};
	const pV = () => {
		if (!sVocab.length) return;
		setVocabIndex(randomOther(vocabIndex, sVocab.length));
		setShowMeaning(false);
		setTlA("");
		setTlC(false);
		setHzA("");
		setHzC(false);
	};
	const nQ = () => {
		if (!gQuiz.length) return;
		setQzI(randomOther(qzI, gQuiz.length));
	};
	const pQ = () => {
		if (!gQuiz.length) return;
		setQzI(randomOther(qzI, gQuiz.length));
	};
	const title = activeTab === "vocabulary" ? "Học từ vựng" : activeTab === "translation" ? "Dịch nghĩa" : activeTab === "hanzi" ? "Chữ Hán" : "Luyện tập";
	const cnt = activeTab === "quiz" ? gQuiz.length : sVocab.length;
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
										children: activeTab === "quiz" ? `${qzI + 1}/${cnt}` : `${vocabIndex + 1}/${cnt}`
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "-mx-1 flex justify-center overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0",
									children: [
										"vocabulary",
										"translation",
										"hanzi",
										"quiz"
									].map((t) => /* @__PURE__ */ jsx("button", {
										onClick: () => sw(t),
										disabled: !sVocab.length && t !== "quiz",
										className: `mx-1 shrink-0 rounded-full px-4 py-2 text-xs font-bold sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${activeTab === t ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"} disabled:cursor-not-allowed disabled:opacity-40`,
										children: t === "vocabulary" ? "Từ Vựng" : t === "translation" ? "Dịch Nghĩa" : t === "hanzi" ? "Chữ Hán" : "Luyện Tập"
									}, t))
								})
							]
						}),
						activeTab === "vocabulary" && cVocab && /* @__PURE__ */ jsx("div", {
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
									showMeaning ? /* @__PURE__ */ jsx("div", {
										className: "mt-4 rounded-2xl bg-amber-50 p-3 sm:mt-6 sm:rounded-3xl sm:p-5",
										children: /* @__PURE__ */ jsx("p", {
											className: "text-lg font-extrabold text-slate-900 sm:text-2xl",
											suppressHydrationWarning: true,
											children: cVocab.meaningVi
										})
									}) : /* @__PURE__ */ jsx("div", {
										className: "mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 sm:mt-6 sm:p-5 sm:text-sm",
										children: "Ẩn nghĩa để bạn tự nhớ trước"
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 grid grid-cols-3 gap-1.5 sm:mt-6 sm:flex sm:justify-center sm:gap-2.5",
										children: [
											/* @__PURE__ */ jsx(Nb, {
												onClick: pV,
												label: "Trước"
											}),
											/* @__PURE__ */ jsxs("button", {
												onClick: () => setShowMeaning((p) => !p),
												className: "flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-700 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm",
												children: [showMeaning ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 }), showMeaning ? "Ẩn" : "Lật"]
											}),
											/* @__PURE__ */ jsx(Nb, {
												onClick: nV,
												label: "Tiếp",
												next: true
											})
										]
									})
								]
							})
						}),
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
											value: tlA,
											onChange: (e) => setTlA(e.target.value),
											placeholder: "Nhập nghĩa tiếng Việt...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${tlC ? tlOK ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") setTlC(true);
											}
										})
									}),
									!tlC ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setTlC(true),
										disabled: !tlA.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
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
											value: hzA,
											onChange: (e) => setHzA(e.target.value),
											placeholder: "Nhập chữ Hán...",
											className: `w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${hzC ? hzOK ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`,
											onKeyDown: (e) => {
												if (e.key === "Enter") setHzC(true);
											}
										})
									}),
									!hzC ? /* @__PURE__ */ jsxs("button", {
										onClick: () => setHzC(true),
										disabled: !hzA.trim(),
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50",
										children: [/* @__PURE__ */ jsx(Check, { size: 18 }), "Kiểm tra"]
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
										className: "-mx-1 mb-4 flex justify-center overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0",
										children: [
											"meaning",
											"pinyin",
											"recognition",
											"listening"
										].map((m) => /* @__PURE__ */ jsx("button", {
											onClick: () => setQzM(m),
											className: `mx-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${qzM === m ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`,
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
										children: (Array.isArray(cQuiz.options) ? cQuiz.options.map((o) => String(o)) : []).map((opt) => {
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
	loader: () => loader$9
});
async function loader$9({ request }) {
	const { requireUser } = await Promise.resolve().then(() => auth_server_exports);
	const { prisma } = await import("./assets/db.server-BVXmj8jU.js");
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
	const { prisma } = await import("./assets/db.server-BVXmj8jU.js");
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
	loader: () => loader$8
});
async function loader$8({ request }) {
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
//#region app/routes/admin.tsx
var admin_exports = /* @__PURE__ */ __exportAll({
	action: () => action$11,
	default: () => admin_default,
	loader: () => loader$7
});
async function loader$7({ request }) {
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
			}).filter(Boolean);
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
		description: optionalString(item.description || item.desc || item.summary),
		phase: optionalString(item.phase || item.stage || item.module) || "Giai đoạn 1",
		weekLabel: optionalString(item.weekLabel || item.week || item.schedule),
		level: optionalString(item.level || item.classLevel || item.targetLevel),
		orderNo: Number(item.orderNo || item.order || item.sessionNo || item.buoi || 1),
		duration: optionalString(item.duration || item.durationLabel || item.time),
		objectives: toJsonArray(item.objectives || item.goals || item.targets),
		materials: toJsonArray(item.materials || item.resources || item.documents),
		vocabulary: toJsonObjectArray(item.vocabulary || item.vocabularies || item.words),
		phrases: toJsonObjectArray(item.phrases || item.sentences || item.patterns)
	};
}
function optionalString(value) {
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
//#region app/routes/login.tsx
var login_exports = /* @__PURE__ */ __exportAll({
	action: () => action$10,
	default: () => login_default,
	loader: () => loader$6
});
async function loader$6({ request }) {
	if (await getUser(request)) throw redirect("/dashboard");
	return null;
}
async function action$10({ request }) {
	const form = await request.formData();
	const email = String(form.get("email") || "").trim().toLowerCase();
	const password = String(form.get("password") || "");
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || !await verifyPassword(password, user.password)) return { error: "Email hoặc mật khẩu không đúng." };
	return createUserSession(request, user.id, "/dashboard", {
		message: "Đăng nhập thành công.",
		type: "success"
	});
}
var login_default = UNSAFE_withComponentProps(function Login() {
	const actionData = useActionData();
	const [showPassword, setShowPassword] = useState(false);
	const { pushToast } = useToast();
	useEffect(() => {
		if (actionData?.error) pushToast(actionData.error, "error");
	}, [actionData?.error, pushToast]);
	return /* @__PURE__ */ jsxs("main", {
		className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.14),_transparent_32%),linear-gradient(180deg,#fff8f5_0%,#fff 55%,#f8fafc_100%)] px-4 py-10",
		children: [/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" }), /* @__PURE__ */ jsxs("div", {
			className: "relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8",
			children: [
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
							children: "Đăng nhập"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-6 text-slate-500",
							children: "Tiếp tục lộ trình HSK, luyện phát âm, viết chữ và làm quiz trong cùng một nơi."
						})
					]
				}),
				/* @__PURE__ */ jsxs(Form, {
					method: "post",
					className: "mt-8 space-y-4",
					children: [
						/* @__PURE__ */ jsxs("label", {
							className: "block",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-bold text-slate-700",
								children: "Email"
							}), /* @__PURE__ */ jsx("input", {
								name: "email",
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
									type: showPassword ? "text" : "password",
									className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400",
									placeholder: "Nhập mật khẩu"
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setShowPassword((prev) => !prev),
									"aria-label": showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
									className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
									children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
								})]
							})]
						}),
						actionData?.error ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600",
							children: actionData.error
						}) : null,
						/* @__PURE__ */ jsx("button", {
							className: "w-full rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700",
							children: "Đăng nhập"
						})
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-5 text-center text-sm text-slate-500",
					children: [
						"Chưa có tài khoản?",
						" ",
						/* @__PURE__ */ jsx(Link, {
							to: "/register",
							className: "font-bold text-red-600",
							children: "Đăng ký"
						})
					]
				})
			]
		})]
	});
});
//#endregion
//#region app/routes/register.tsx
var register_exports = /* @__PURE__ */ __exportAll({
	action: () => action$9,
	default: () => register_default,
	loader: () => loader$5
});
async function loader$5({ request }) {
	if (await getUser(request)) throw redirect("/dashboard");
	return null;
}
async function action$9({ request }) {
	const form = await request.formData();
	const name = String(form.get("name") || "").trim();
	const email = String(form.get("email") || "").trim().toLowerCase();
	const password = String(form.get("password") || "");
	if (!name || !email || password.length < 6) return { error: "Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự." };
	if (await prisma.user.findUnique({ where: { email } })) return { error: "Email đã tồn tại." };
	return createUserSession(request, (await prisma.user.create({ data: {
		name,
		email,
		password: await hashPassword(password)
	} })).id, "/dashboard", {
		message: "Tạo tài khoản thành công.",
		type: "success"
	});
}
var register_default = UNSAFE_withComponentProps(function Register() {
	const actionData = useActionData();
	const [showPassword, setShowPassword] = useState(false);
	const { pushToast } = useToast();
	useEffect(() => {
		if (actionData?.error) pushToast(actionData.error, "error");
	}, [actionData?.error, pushToast]);
	return /* @__PURE__ */ jsxs("main", {
		className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.14),_transparent_36%),linear-gradient(180deg,#fffaf5_0%,#fff 55%,#f8fafc_100%)] px-4 py-10",
		children: [/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" }), /* @__PURE__ */ jsxs("div", {
			className: "relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8",
			children: [
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
							children: "Tạo tài khoản"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-6 text-slate-500",
							children: "Tạo tài khoản để bắt đầu học HSK, theo lộ trình lớp và lưu quá trình luyện tập của bạn."
						})
					]
				}),
				/* @__PURE__ */ jsxs(Form, {
					method: "post",
					className: "mt-8 space-y-4",
					children: [
						/* @__PURE__ */ jsxs("label", {
							className: "block",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-bold text-slate-700",
								children: "Họ tên"
							}), /* @__PURE__ */ jsx("input", {
								name: "name",
								className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400",
								placeholder: "Nhập họ tên"
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "block",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-bold text-slate-700",
								children: "Email"
							}), /* @__PURE__ */ jsx("input", {
								name: "email",
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
									type: showPassword ? "text" : "password",
									className: "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400",
									placeholder: "Ít nhất 6 ký tự"
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setShowPassword((prev) => !prev),
									"aria-label": showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
									className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
									children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
								})]
							})]
						}),
						actionData?.error ? /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600",
							children: actionData.error
						}) : null,
						/* @__PURE__ */ jsx("button", {
							className: "w-full rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700",
							children: "Tạo tài khoản"
						})
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-5 text-center text-sm text-slate-500",
					children: [
						"Đã có tài khoản?",
						" ",
						/* @__PURE__ */ jsx(Link, {
							to: "/login",
							className: "font-bold text-red-600",
							children: "Đăng nhập"
						})
					]
				})
			]
		})]
	});
});
//#endregion
//#region app/routes/api.auth.login.ts
var api_auth_login_exports = /* @__PURE__ */ __exportAll({ action: () => action$8 });
async function action$8({ request }) {
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
var api_auth_register_exports = /* @__PURE__ */ __exportAll({ action: () => action$7 });
async function action$7({ request }) {
	const body = await request.json();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim().toLowerCase();
	const password = String(body.password || "");
	if (!name || !email || password.length < 6) return data({ message: "Dữ liệu không hợp lệ." }, { status: 400 });
	if (await prisma.user.findUnique({ where: { email } })) return data({ message: "Email đã tồn tại." }, { status: 409 });
	return data({ user: await prisma.user.create({
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
	}) });
}
//#endregion
//#region app/routes/api.auth.logout.ts
var api_auth_logout_exports = /* @__PURE__ */ __exportAll({ action: () => action$6 });
async function action$6({ request }) {
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
var api_mobile_auth_login_exports = /* @__PURE__ */ __exportAll({ action: () => action$5 });
async function action$5({ request }) {
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
var api_mobile_auth_register_exports = /* @__PURE__ */ __exportAll({ action: () => action$4 });
async function action$4({ request }) {
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
var api_mobile_auth_me_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$4 });
async function loader$4({ request }) {
	const user = await requireMobileUser(request);
	if (!user) return data({ message: "Unauthorized" }, { status: 401 });
	return data({ user });
}
//#endregion
//#region app/routes/api.mobile.lessons.ts
var api_mobile_lessons_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$3 });
async function loader$3({ request }) {
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
var api_mobile_lessons_$lessonId_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$2 });
async function loader$2({ params }) {
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
var api_mobile_roadmap_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$1 });
async function loader$1({ request }) {
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
var api_mobile_roadmap_$roadmapId_exports = /* @__PURE__ */ __exportAll({ loader: () => loader });
async function loader({ request, params }) {
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
var api_vocabularies_import_exports = /* @__PURE__ */ __exportAll({ action: () => action$3 });
async function action$3({ request }) {
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
var api_ai_chat_exports = /* @__PURE__ */ __exportAll({ action: () => action$2 });
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
var SYSTEM_PROMPT = `Bạn là trợ lý AI học tiếng Trung, chuyên giúp người dùng học từ vựng, ngữ pháp, phát âm và luyện thi HSK.

Quy tắc:
- Trả lời bằng TIẾNG VIỆT, ngắn gọn, dễ hiểu.
- Khi giải thích từ vựng: đưa chữ Hán, pinyin, nghĩa tiếng Việt, ví dụ.
- Khi giải thích ngữ pháp: đưa cấu trúc, ví dụ có pinyin và nghĩa.
- Khi người dùng hỏi về cách viết chữ Hán: hướng dẫn thứ tự nét cơ bản.
- Luôn khuyến khích và tạo động lực học tập.
- Nếu câu hỏi không liên quan đến tiếng Trung, nhẹ nhàng gợi ý quay lại chủ đề học tập.`;
async function action$2({ request }) {
	await requireUser(request);
	const body = await request.json();
	const intent = body.intent || "chat";
	if (intent === "chat") {
		const messages = body.messages || [];
		if (!messages.length) return data({ error: "Vui lòng gửi tin nhắn." }, { status: 400 });
		try {
			return data({ reply: await callAI([{
				role: "system",
				content: SYSTEM_PROMPT
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
	return data({ error: "intent không hợp lệ." }, { status: 400 });
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
			}).filter(Boolean);
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
//#region \0virtual:react-router/server-manifest
var server_manifest_default = {
	"entry": {
		"module": "/assets/entry.client-C4yg0f7d.js",
		"imports": ["/assets/jsx-runtime-Cs51Ljtp.js"],
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
			"module": "/assets/root-CsDwKCiA.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Toast-EunRJVee.js",
				"/assets/x-CPfZFQVP.js"
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
			"module": "/assets/_index-D1bx9tSE.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/list-checks-CcSNVRJu.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/hsk20-CTIffFEw.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/CustomSelect-BtnjClLN.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/search-6RhEpokN.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/hsk30-SX-OEhv5.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/CustomSelect-BtnjClLN.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/search-6RhEpokN.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/lessons._index-DcOMAVvy.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/search-6RhEpokN.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/lessons._lessonId-ClRIk6X5.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/chevron-right-4mRP3crH.js",
				"/assets/eye-BzJURg9M.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/roadmap-DCdQlmnK.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/CustomSelect-BtnjClLN.js",
				"/assets/search-6RhEpokN.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/roadmap._roadmapId-BMWLeb3u.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/chevron-right-4mRP3crH.js",
				"/assets/eye-BzJURg9M.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/profile-B0RHBux9.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/Toast-EunRJVee.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/eye-BzJURg9M.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/dashboard-BprznNIR.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/graduation-cap-C6DLBcNn.js"
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
			"module": "/assets/admin-v_HhfSVz.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Layout-D7FtkCCm.js",
				"/assets/Toast-EunRJVee.js",
				"/assets/x-CPfZFQVP.js",
				"/assets/graduation-cap-C6DLBcNn.js",
				"/assets/list-checks-CcSNVRJu.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/login": {
			"id": "routes/login",
			"parentId": "root",
			"path": "login",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/login-9GUFQl3p.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Toast-EunRJVee.js",
				"/assets/eye-BzJURg9M.js",
				"/assets/graduation-cap-C6DLBcNn.js",
				"/assets/x-CPfZFQVP.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/register": {
			"id": "routes/register",
			"parentId": "root",
			"path": "register",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/register-DCd2_-2j.js",
			"imports": [
				"/assets/jsx-runtime-Cs51Ljtp.js",
				"/assets/Toast-EunRJVee.js",
				"/assets/eye-BzJURg9M.js",
				"/assets/graduation-cap-C6DLBcNn.js",
				"/assets/x-CPfZFQVP.js"
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
			"module": "/assets/api.ai.tts-BW6hgI7N.js",
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
			"module": "/assets/api.admin.lesson-import-BCDA7qHi.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-583a7972.js",
	"version": "583a7972",
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
	"routes/admin": {
		id: "routes/admin",
		parentId: "root",
		path: "admin",
		index: void 0,
		caseSensitive: void 0,
		module: admin_exports
	},
	"routes/login": {
		id: "routes/login",
		parentId: "root",
		path: "login",
		index: void 0,
		caseSensitive: void 0,
		module: login_exports
	},
	"routes/register": {
		id: "routes/register",
		parentId: "root",
		path: "register",
		index: void 0,
		caseSensitive: void 0,
		module: register_exports
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
	}
};
var allowedActionOrigins = false;
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
