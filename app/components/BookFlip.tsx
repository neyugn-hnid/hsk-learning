import { useEffect, useRef } from "react";

export interface BookPage {
  imageUrl?: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  exampleChinese?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
}

interface Props {
  pages: BookPage[];
  onPageChange?: (index: number) => void;
}

function makePageHtml(page: BookPage, isExample: boolean): string {
  if (!isExample) {
    return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;background:linear-gradient(135deg,#fefefe,#fdfaf5);box-sizing:border-box;font-family:Inter,sans-serif;"><p style="margin:0;font-size:clamp(42px,6vw,72px);font-weight:900;color:#dc2626;text-align:center;">${page.chinese}</p><p style="margin:8px 0 0;font-size:clamp(14px,2vw,20px);font-weight:600;color:#334155;">${page.pinyin}</p><p style="margin:12px 0 0;font-size:clamp(13px,1.8vw,18px);font-weight:700;color:#1e293b;background:#fef3c7;padding:4px 18px;border-radius:8px;">${page.meaningVi}</p></div>`;
  }
  if (!page.exampleChinese) {
    return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:linear-gradient(225deg,#fefefe,#fdfaf5);box-sizing:border-box;font-family:Inter,sans-serif;"><p style="font-size:clamp(28px,4vw,42px);font-weight:900;color:#dc2626;">${page.chinese}</p><p style="margin:4px 0;font-size:clamp(13px,2vw,16px);font-weight:600;color:#334155;">${page.pinyin}</p><p style="font-size:clamp(12px,1.8vw,15px);font-weight:700;color:#1e293b;background:#fef3c7;padding:3px 14px;border-radius:6px;">${page.meaningVi}</p><p style="margin-top:16px;font-size:12px;color:#94a3b8;">(Chưa có ví dụ)</p></div>`;
  }
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:linear-gradient(225deg,#fefefe,#fdfaf5);box-sizing:border-box;font-family:Inter,sans-serif;">
    <p style="margin:0;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">📝 Ví dụ</p>
    <p style="margin:16px 0 0;font-size:clamp(18px,3vw,28px);font-weight:700;color:#1e293b;text-align:center;line-height:1.5;">${page.exampleChinese}</p>
    <p style="margin:10px 0 0;font-size:clamp(13px,2vw,16px);color:#dc2626;font-weight:500;">${page.examplePinyin || ""}</p>
    <p style="margin:8px 0 0;font-size:clamp(12px,1.8vw,15px);color:#64748b;">${page.exampleMeaning || ""}</p>
    <p style="margin:20px 0 0;font-size:clamp(24px,4vw,38px);font-weight:900;color:#dc2626;opacity:0.6;">${page.chinese}</p>
  </div>`;
}

export default function BookFlip({ pages, onPageChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pfRef = useRef<any>(null);
  const cbRef = useRef(onPageChange);
  cbRef.current = onPageChange;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = containerRef.current;
    if (!el || pages.length === 0) return;

    if (pfRef.current) {
      try { pfRef.current.destroy(); } catch {}
      pfRef.current = null;
    }
    el.innerHTML = "";

    const items: HTMLElement[] = [];
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
    if (items.length > 0) {
      items[items.length - 1].setAttribute("data-density", "hard");
    }

    const init = () => {
      if (!el) return;
      const St = (window as any).St;
      if (!St?.PageFlip) { setTimeout(init, 100); return; }

      const pf = new St.PageFlip(el, {
        width: 420, height: 560,
        size: "stretch",
        minWidth: 300, maxWidth: 820,
        minHeight: 400, maxHeight: 680,
        drawShadow: true,
        flippingTime: 400,
        usePortrait: true,
        startPage: 0,
        showCover: false,
        mobileScrollSupport: false,
        swipeDistance: 30,
        maxShadowOpacity: 0.25,
      });
      pf.loadFromHTML(items as any);
      pf.on("flip", (e: any) => {
        cbRef.current?.(Math.floor(e.data / 2));
      });
      pfRef.current = pf;
    };

    if ((window as any).St?.PageFlip) {
      init();
    } else if (!document.querySelector('script[src="/page-flip.browser.js"]')) {
      const s = document.createElement("script");
      s.src = "/page-flip.browser.js";
      s.onload = init;
      document.head.appendChild(s);
    } else {
      const iv = setInterval(() => {
        if ((window as any).St?.PageFlip) { clearInterval(iv); init(); }
      }, 100);
    }

    return () => {
      pfRef.current = null;
    };
  }, [pages.length]);

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full"
      style={{ maxWidth: "820px", height: "560px", minHeight: "440px" }}
    />
  );
}
