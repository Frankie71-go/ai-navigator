import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { getCompetitions } from "@/lib/data-source";
import { reviewCompetition } from "@/lib/review";
import { CATEGORIES } from "@/lib/data/taxonomy";
import type { Competition } from "@/lib/types";

// 审核意见存本机浏览器（仅 Frankie 自己可见，不上传），用于生成上线指令发给维护助手。
const REVIEW_KEY = "ai-nav-review-decisions";
type Decisions = { approved: string[]; rejected: string[] };

function loadDecisions(): Decisions {
  try {
    const raw = localStorage.getItem(REVIEW_KEY);
    if (raw) return JSON.parse(raw) as Decisions;
  } catch {
    /* ignore */
  }
  return { approved: [], rejected: [] };
}
function saveDecisions(d: Decisions) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(d));
}

export default function ReviewPage() {
  const [all, setAll] = useState<Competition[] | null>(null);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [view, setView] = useState<"pending" | "all">("pending");
  const [decisions, setDecisions] = useState<Decisions>({ approved: [], rejected: [] });

  useEffect(() => {
    let active = true;
    getCompetitions().then((cs) => {
      if (active) setAll(cs);
    });
    setDecisions(loadDecisions());
    return () => {
      active = false;
    };
  }, []);

  const pendingList = useMemo(
    () => (all ?? []).filter((c) => c.status === "pending"),
    [all]
  );
  const approvedList = useMemo(
    () => (all ?? []).filter((c) => c.status !== "pending"),
    [all]
  );

  const filtered = useMemo(() => {
    const src = view === "pending" ? pendingList : approvedList;
    const kw = keyword.trim().toLowerCase();
    let list = src.map((c) => ({ c, review: reviewCompetition(c) }));
    if (kw)
      list = list.filter(({ c }) =>
        `${c.name} ${c.organizer}`.toLowerCase().includes(kw)
      );
    if (category) list = list.filter(({ c }) => c.category === category);
    list.sort((a, b) => a.c.name.localeCompare(b.c.name, "zh"));
    return list;
  }, [view, pendingList, approvedList, keyword, category]);

  const toggle = (id: string, kind: "approved" | "rejected") => {
    setDecisions((prev) => {
      const next: Decisions = {
        approved: [...prev.approved],
        rejected: [...prev.rejected],
      };
      if (kind === "approved") {
        next.approved = next.approved.includes(id)
          ? next.approved.filter((x) => x !== id)
          : [...next.approved, id];
        next.rejected = next.rejected.filter((x) => x !== id);
      } else {
        next.rejected = next.rejected.includes(id)
          ? next.rejected.filter((x) => x !== id)
          : [...next.rejected, id];
        next.approved = next.approved.filter((x) => x !== id);
      }
      saveDecisions(next);
      return next;
    });
  };

  const copyPublishInstruction = () => {
    const text = `请上线以下已通过审核的比赛（把 status 改为 approved 并部署）：\n通过：${
      decisions.approved.join(", ") || "（无）"
    }\n驳回：${decisions.rejected.join(", ") || "（无）"}`;
    navigator.clipboard?.writeText(text);
    alert("上线指令已复制到剪贴板，发给我即可发布。");
  };

  if (all === null) {
    return (
      <div className="container-page py-20 text-center text-muted">加载中…</div>
    );
  }

  const total = all.length;
  const pendingCount = pendingList.length;
  const approvedCount = total - pendingCount;

  const tabBase =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const tabActive = "bg-accent-warm-soft text-accent-warm";
  const tabIdle = "text-muted hover:bg-ink/5 hover:text-ink";

  return (
    <Reveal>
      <div className="container-page py-10">
        <div className="mb-4 rounded-card border border-line bg-accent-warm-soft px-3 py-2 text-xs leading-relaxed text-accent-warm">
          站长专属后台：此页不对外公开（普通用户体验版导航无此入口）。审核意见仅存你本机浏览器，不上传；比赛正式上线需由你审核后联系维护助手部署。
        </div>

        <PageHeader
          eyebrow="REVIEW"
          title="内容审查台"
          subtitle={`自动采集待审核 ${pendingCount} 场（审查进度 50%）· 已上线 ${approvedCount} 场`}
        />

        <div className="mb-4 rounded-card border border-line bg-panel/60 p-3 text-xs leading-relaxed text-muted">
          流程：每天 23:00 自动采集的比赛会先进入「待审核」（进度 50%）。你在右侧点
          <span className="font-medium text-ink"> 通过 </span>
          标记审核意见，再点底部
          <span className="font-medium text-ink"> 复制上线指令 </span>
          发给我，我把状态改为 approved 并部署，比赛才正式上线。
        </div>

        {/* 视图切换 */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setView("pending")}
            className={`${tabBase} ${view === "pending" ? tabActive : tabIdle}`}
          >
            待审核 · 自动采集（{pendingCount}）
          </button>
          <button
            onClick={() => setView("all")}
            className={`${tabBase} ${view === "all" ? tabActive : tabIdle}`}
          >
            已上线（{approvedCount}）
          </button>
        </div>

        <Card className="mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <Input
            placeholder="搜索比赛名称 / 主办方"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="lg:flex-1"
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="lg:w-44"
          >
            <option value="">全部类型</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Card>

        {view === "pending" && pendingCount > 0 && (
          <div className="mb-4 flex justify-end">
            <Button onClick={copyPublishInstruction}>复制上线指令</Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-card border border-line bg-panel p-12 text-center text-muted">
            {view === "pending"
              ? "太棒了，没有待审核的比赛。"
              : "没有匹配的比赛。"}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(({ c, review }) => {
              const isPending = c.status === "pending";
              const dec = decisions.approved.includes(c.id)
                ? "approved"
                : decisions.rejected.includes(c.id)
                ? "rejected"
                : null;
              return (
                <Card
                  key={c.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/competitions/${c.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {c.name}
                      </Link>
                      {c.category && (
                        <span className="rounded bg-line/50 px-1.5 py-0.5 text-[10px] text-muted">
                          {c.category}
                        </span>
                      )}
                      {isPending && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          审查进度 50%
                        </span>
                      )}
                      {dec === "approved" && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          已通过 · 待发布
                        </span>
                      )}
                      {dec === "rejected" && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                          已驳回
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {c.organizer}
                    </p>
                    {isPending && !review.complete && (
                      <p className="mt-1 text-xs text-amber-600">
                        待补充：{review.missingLabels.join("、")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isPending ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => toggle(c.id, "approved")}
                          className={
                            dec === "approved"
                              ? "text-emerald-700"
                              : "text-muted"
                          }
                        >
                          {dec === "approved" ? "已通过" : "通过"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => toggle(c.id, "rejected")}
                          className={
                            dec === "rejected" ? "text-rose-700" : "text-muted"
                          }
                        >
                          {dec === "rejected" ? "已驳回" : "驳回"}
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-line/60">
                          <div
                            className={`h-full ${
                              review.complete ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${review.completeness}%` }}
                          />
                        </div>
                        <span
                          className={`w-14 text-right text-xs font-medium ${
                            review.complete
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {review.completeness}%
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Reveal>
  );
}
