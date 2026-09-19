import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { competitions } from "@/lib/data/competitions";

interface Stats {
  total: number;
  uniqueUsers: number;
  byType: Record<string, number>;
  topCompetitions: { competitionId: string; count: number }[];
  topKeywords: { keyword: string; count: number }[];
  daily: { date: string; count: number }[];
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  view: "浏览详情",
  click: "点击卡片",
  search: "搜索关键词",
  recommend_view: "查看推荐",
  save: "收藏",
};

const BEHAVIORS_URL = import.meta.env.VITE_BEHAVIORS_HTTP_URL as
  | string
  | undefined;

function maxOf(nums: number[]): number {
  return nums.reduce((m, n) => Math.max(m, n), 0);
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!BEHAVIORS_URL) {
      setError(
        "未配置 VITE_BEHAVIORS_HTTP_URL：云端行为库尚未启用（仅本地记录）。请先部署 behaviors 云函数。"
      );
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    fetch(`${BEHAVIORS_URL}?stats=1`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Stats) => {
        setStats(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "加载失败");
        setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  const nameOf = (id: string) =>
    competitions.find((c) => c.id === id)?.name || id;

  const dailyMax = stats ? maxOf(stats.daily.map((d) => d.count)) : 0;

  return (
    <div className="container-page max-w-4xl py-10">
      <PageHeader
        eyebrow="ANALYTICS"
        title="数据看板"
        subtitle="由云端 behaviors 库实时聚合 · 全匿名、不含任何个人信息"
      />

      {loading && (
        <div className="py-16 text-center text-sm text-muted">加载中…</div>
      )}

      {!loading && error && (
        <Card className="border border-amber-300 bg-amber-50 p-6">
          <div className="text-sm font-semibold text-amber-800">云端统计未启用</div>
          <p className="mt-2 text-sm leading-relaxed text-amber-700">{error}</p>
          <p className="mt-3 text-xs text-amber-700/80">
            部署 behaviors 云函数并新建 <code>behaviors</code> 集合后，本页会自动拉取到数据。
          </p>
        </Card>
      )}

      {!loading && !error && stats && (
        <div className="flex flex-col gap-5">
          {/* 总览 + 按类型 */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-6">
              <div className="font-mono text-xs tracking-widest text-muted">
                TOTAL EVENTS
              </div>
              <div className="mt-1 font-display text-4xl font-bold text-ink">
                {stats.total.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted">累计行为事件（全站匿名）</div>
            </Card>

            <Card className="p-6">
              <div className="font-mono text-xs tracking-widest text-muted">
                UNIQUE USERS
              </div>
              <div className="mt-1 font-display text-4xl font-bold text-ink">
                {stats.uniqueUsers.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted">
                独立访客（按浏览器匿名 ID 去重）
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-3 font-mono text-xs tracking-widest text-muted">
                BY TYPE
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(stats.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted">
                        {TYPE_LABELS[type] || type}
                      </span>
                      <span className="font-mono font-semibold text-ink">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* 近 14 天趋势 */}
          <Card className="p-6">
            <div className="mb-4 font-mono text-xs tracking-widest text-muted">
              LAST 14 DAYS
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              {stats.daily.map((d) => {
                const h = dailyMax ? Math.max(4, (d.count / dailyMax) * 116) : 4;
                return (
                  <div
                    key={d.date}
                    className="group flex flex-1 flex-col items-center justify-end"
                    title={`${d.date} · ${d.count} 次`}
                  >
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-accent to-accent2 transition-all"
                      style={{ height: `${h}px` }}
                    />
                    <span className="mt-1 font-mono text-[9px] text-muted/70">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Top 比赛 */}
            <Card className="p-6">
              <div className="mb-3 font-mono text-xs tracking-widest text-muted">
                TOP COMPETITIONS
              </div>
              {stats.topCompetitions.length === 0 ? (
                <div className="text-sm text-muted">暂无浏览数据</div>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {stats.topCompetitions.map((t, i) => (
                    <li key={t.competitionId} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-accent/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Link
                        to={`/competitions/${t.competitionId}`}
                        className="flex-1 truncate text-sm text-ink hover:text-accent hover:underline"
                        title={nameOf(t.competitionId)}
                      >
                        {nameOf(t.competitionId)}
                      </Link>
                      <span className="font-mono text-xs font-semibold text-muted">
                        {t.count}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            {/* Top 搜索词 */}
            <Card className="p-6">
              <div className="mb-3 font-mono text-xs tracking-widest text-muted">
                TOP SEARCHES
              </div>
              {stats.topKeywords.length === 0 ? (
                <div className="text-sm text-muted">暂无搜索数据</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stats.topKeywords.map((k) => (
                    <span
                      key={k.keyword}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs text-accent"
                    >
                      {k.keyword}
                      <span className="font-mono text-[10px] text-accent/70">
                        {k.count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="text-center font-mono text-xs text-muted/60">
            更新于 {new Date(stats.updatedAt).toLocaleString("zh-CN")} · 数据来自云端
            behaviors 库
          </div>
        </div>
      )}
    </div>
  );
}
