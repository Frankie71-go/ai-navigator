import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 滚动入场：进入视口时淡入上浮。尊重 prefers-reduced-motion。
 * 用法：<Reveal delay={120} className="...">...</Reveal>
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    // 安全兜底：若 1s 内 IntersectionObserver 未触发（如 iframe 预览 / 异步挂载时序问题），
    // 强制显示，避免内容永久停留在 opacity:0（看不见但能复制）。
    const fallback = window.setTimeout(() => setVisible(true), 1000);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px -10px 0px" }
    );
    io.observe(el);
    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
