import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/competitions", label: "比赛库" },
  { href: "/teammates", label: "队友匹配" },
  { href: "/recommend", label: "智能推荐" },
  { href: "/profile", label: "我的画像" },
  { href: "/contact", label: "联系我们" },
];

export function Navbar() {
  const pathname = useLocation().pathname;
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/70 backdrop-blur-xl shadow-glass">
      <div className="container-page flex h-14 items-center justify-between">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-2 font-display text-base font-bold tracking-wider"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent2 text-sm font-bold text-white shadow-neon transition-transform group-hover:scale-110 group-hover:shadow-neon-warm">
            A
          </span>
          <span className="text-ink">
            AI<span className="text-accent">//</span>NAVIGATOR
          </span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden items-center gap-1 font-display text-xs font-medium tracking-wide md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                isActive(item.href)
                  ? "bg-accent-warm-soft text-accent-warm"
                  : "text-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 移动端汉堡 */}
        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink transition hover:bg-ink/5 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* 移动端下拉面板 */}
      {open && (
        <nav className="border-t border-line bg-white/90 px-4 py-2 backdrop-blur-xl md:hidden">
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-accent-warm-soft text-accent-warm"
                    : "text-muted hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
