import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative mt-20">
      {/* 免责声明（全站醒目提示） */}
      <div className="container-page pb-6">
        <div className="flex items-start gap-3 rounded-xl border border-accent-warm/40 border-l-2 border-l-accent-warm bg-accent-warm/[0.10] px-4 py-3 backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 h-4 w-4 shrink-0 text-accent-warm"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <p className="text-xs leading-relaxed text-muted">
            <span className="font-semibold text-accent-warm">免责声明：</span>
            本网站仅用于 AI 相关比赛信息的收集与整理，并为大学生提供组队交流空间；我们不对所收录比赛信息的真实性、准确性或时效性作任何明示或暗示担保，亦不提供任何比赛指导、培训、代报名或后续服务。参赛相关的一切决策与风险由用户自行承担。如遇收费、转账或敏感信息收集等要求，请务必提高警惕并通过比赛官方渠道核实。
            <br />
            本项目所有内容由 AI 生成，仅供学习与参考，请结合官方信息独立判断。
          </p>
        </div>
      </div>

      {/* 主区 */}
      <div className="border-t border-[rgba(15,27,61,0.06)] bg-white/50">
        <div className="container-page flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-display text-base font-bold tracking-wider">
            <span className="text-gradient-neon">
              AI<span className="text-accent">//</span>NAVIGATOR
            </span>
          </div>
          <nav className="flex flex-wrap gap-4 font-mono text-xs text-muted">
            <Link to="/competitions" className="transition-colors hover:text-accent">
              比赛库
            </Link>
            <Link to="/teammates" className="transition-colors hover:text-accent">
              队友匹配
            </Link>
            <Link to="/profile" className="transition-colors hover:text-accent">
              我的画像
            </Link>
            <Link to="/contact" className="transition-colors hover:text-accent">
              联系我们
            </Link>
            <Link to="/stats" className="transition-colors hover:text-accent">
              数据看板
            </Link>
          </nav>
          <span className="font-mono text-xs text-muted/70">
            © 2026 AI Navigator · 为大学生导航 AI 机会
          </span>
        </div>
      </div>
    </footer>
  );
}
