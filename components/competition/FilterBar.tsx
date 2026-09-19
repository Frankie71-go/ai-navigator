"use client";

import { useEffect, useRef, useState } from "react";
import { Input, Select } from "@/components/ui/Input";
import {
  AI_DIRECTIONS,
  DIFFICULTIES,
  COMPETITION_FORMATS,
  REGIONS,
} from "@/lib/data/taxonomy";
import { ORGANIZER_CATEGORIES } from "@/lib/organizer-category";

export interface FilterState {
  keyword: string;
  aiDirection: string;
  difficulty: string;
  format: string;
  region: string;
  status: string;
  completeness: string;
  organizer: string;
}

const DEFAULTS: FilterState = {
  keyword: "",
  aiDirection: "",
  difficulty: "",
  format: "",
  region: "",
  status: "open",
  completeness: "",
  organizer: "",
};

function activeCount(f: FilterState): number {
  let n = 0;
  if (f.aiDirection) n++;
  if (f.difficulty) n++;
  if (f.format) n++;
  if (f.region) n++;
  if (f.status && f.status !== "open") n++;
  if (f.completeness) n++;
  if (f.organizer) n++;
  return n;
}

function Group({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function FilterBar({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const count = activeCount(value);
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="搜索比赛名称 / 主办方 / 方向"
        value={value.keyword}
        onChange={(e) => set({ keyword: e.target.value })}
        className="sm:flex-1"
      />

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent/50 sm:w-auto"
        >
          <span className="flex items-center gap-2">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M3 4h18l-7 8v6l-4 2v-8z" />
            </svg>
            筛选
            {count > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[#0891b2] to-[#4338ca] px-1.5 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 z-30 mt-2 w-full rounded-card border border-line bg-white/95 p-4 shadow-elevate backdrop-blur-xl sm:w-[28rem]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Group label="主办方">
                <Select
                  value={value.organizer}
                  onChange={(e) => set({ organizer: e.target.value })}
                >
                  <option value="">全部主办方</option>
                  {ORGANIZER_CATEGORIES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Group>
              <Group label="AI 方向">
                <Select
                  value={value.aiDirection}
                  onChange={(e) => set({ aiDirection: e.target.value })}
                >
                  <option value="">全部方向</option>
                  {AI_DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Group>
              <Group label="难度">
                <Select
                  value={value.difficulty}
                  onChange={(e) => set({ difficulty: e.target.value })}
                >
                  <option value="">全部难度</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Group>
              <Group label="形式">
                <Select
                  value={value.format}
                  onChange={(e) => set({ format: e.target.value })}
                >
                  <option value="">全部形式</option>
                  {COMPETITION_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </Group>
              <Group label="地域">
                <Select
                  value={value.region}
                  onChange={(e) => set({ region: e.target.value })}
                >
                  <option value="">全部地域</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Group>
              <Group label="状态">
                <Select
                  value={value.status}
                  onChange={(e) => set({ status: e.target.value })}
                >
                  <option value="open">正在报名中</option>
                  <option value="">全部状态</option>
                  <option value="closed">已截止</option>
                </Select>
              </Group>
              <Group label="内容完整性" className="sm:col-span-2">
                <Select
                  value={value.completeness}
                  onChange={(e) => set({ completeness: e.target.value })}
                >
                  <option value="">内容完整性·全部</option>
                  <option value="complete">已通过</option>
                  <option value="incomplete">待完善</option>
                </Select>
              </Group>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULTS, keyword: value.keyword })}
                className="text-xs font-medium text-muted transition-colors hover:text-accent"
              >
                重置筛选
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-gradient-to-r from-[#0891b2] to-[#4338ca] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-105"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
