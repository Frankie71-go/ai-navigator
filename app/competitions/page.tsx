import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CompetitionCard } from "@/components/competition/CompetitionCard";
import { FilterBar, type FilterState } from "@/components/competition/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getCompetitions } from "@/lib/data-source";
import { useProfileStore } from "@/store/profile-store";
import { trackBehavior } from "@/lib/cloudbase/db";
import { reviewCompetition } from "@/lib/review";
import { getRegStatus } from "@/lib/registration";
import { organizerCategory } from "@/lib/organizer-category";
import type { Competition } from "@/lib/types";

export default function CompetitionsPage() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [all, setAll] = useState<Competition[] | null>(null);
  // 默认只看「正在报名中」，避免已截止的比赛占满页面（可切换为全部/已截止）
  const [filter, setFilter] = useState<FilterState>({
    keyword: initialQ,
    aiDirection: "",
    difficulty: "",
    format: "",
    region: "",
    status: "open",
    completeness: "",
    organizer: "",
  });

  // 从首页 / 热门搜索跳转带 ?q= 时，同步到搜索框（支持在比赛库页内再次点击建议）
  useEffect(() => {
    const qp = params.get("q");
    if (qp) setFilter((f) => (f.keyword === qp ? f : { ...f, keyword: qp }));
  }, [params]);

  useEffect(() => {
    let active = true;
    getCompetitions().then((cs) => {
      if (active) setAll(cs);
    });
    return () => {
      active = false;
    };
  }, []);

  // 行为埋点：搜索关键词（仅当有关键词时记录，用于优化推荐）
  useEffect(() => {
    const kw = filter.keyword.trim();
    if (!kw) return;
    const id = useProfileStore.getState().ensureUserId();
    trackBehavior(id, "", "search", { keyword: kw });
  }, [filter.keyword]);

  const list = useMemo(() => {
    const src = all ?? [];
    const kw = filter.keyword.trim().toLowerCase();
    const filtered = src.filter((c) => {
      // 未审核 / 已驳回 / 已截止报名（无观众通道）的比赛不进公开比赛库，仅在审查台可见
      if (c.status === "pending" || c.status === "rejected") return false;
      if (c.description && c.description.startsWith("【已截止】")) return false;
      if (filter.aiDirection && !c.aiDirection.some((d) => d === filter.aiDirection))
        return false;
      if (filter.difficulty && c.difficulty !== filter.difficulty) return false;
      if (filter.format && c.format !== filter.format) return false;
      if (filter.region && c.region !== filter.region) return false;
      if (filter.status === "open" && getRegStatus(c).status === "closed")
        return false;
      if (filter.status === "closed" && getRegStatus(c).status !== "closed")
        return false;
      if (filter.completeness === "complete" && !reviewCompetition(c).complete)
        return false;
      if (filter.completeness === "incomplete" && reviewCompetition(c).complete)
        return false;
      if (
        filter.organizer &&
        organizerCategory(c.organizer) !== filter.organizer
      )
        return false;
      if (kw) {
        const hay = `${c.name} ${c.organizer} ${c.aiDirection.join(" ")} ${c.skills.join(
          " "
        )} ${c.tags.join(" ")} ${c.description || ""}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    // 排序：正在报名的优先，再按截止日升序（先截止的排前面）
    return filtered.sort((a, b) => {
      const aOpen = getRegStatus(a).status !== "closed" ? 0 : 1;
      const bOpen = getRegStatus(b).status !== "closed" ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return a.deadline.localeCompare(b.deadline);
    });
  }, [all, filter]);

  if (all === null) {
    return (
      <div className="container-page py-20 text-center text-muted">加载中…</div>
    );
  }

  return (
    <div className="container-page py-10">
      <Reveal>
        <PageHeader
          eyebrow={initialQ ? "SEARCH" : "DATABASE"}
          title={initialQ ? `「${initialQ}」的搜索结果` : "比赛库"}
          subtitle={
            initialQ
              ? `搜索「${initialQ}」· 命中 ${list.length} 场`
              : `正在展示 ${list.length} 场（总计 ${all.length} 场）· 默认「正在报名中」，可切换查看全部`
          }
        />
      </Reveal>

      <div className="mb-6">
        <FilterBar value={filter} onChange={setFilter} />
      </div>

      {list.length === 0 ? (
        <div className="rounded-card border border-line bg-panel p-12 text-center text-muted">
          没有匹配的比赛，试试调整筛选条件。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <CompetitionCard key={c.id} c={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
