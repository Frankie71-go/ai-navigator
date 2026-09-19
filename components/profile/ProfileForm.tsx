"use client";

import { useEffect, useRef, useState } from "react";
import { useProfileStore } from "@/store/profile-store";
import { Button, LinkButton } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { MultiToggle } from "@/components/ui/MultiToggle";
import { Tag } from "@/components/ui/Tag";
import {
  IDENTITIES,
  MAJORS,
  AI_LEVELS,
  SKILL_RATINGS,
  SKILL_LABELS,
  GOALS,
  PERSONALITIES,
  AI_DIRECTIONS,
} from "@/lib/data/taxonomy";
import type { AiDirection } from "@/lib/types";
import type { AiLevel, Identity, Major, ProjectExperience, SkillKey, UserProfile } from "@/lib/types";
import { saveProfile } from "@/lib/cloudbase/db";
import { SkillReviewPanel } from "@/components/profile/SkillReviewPanel";
import { ResumeUploader, type ParsedProfile } from "@/components/profile/ResumeUploader";

/** 0-5 点选评分：0 = 未评估，5 = 精通 */
function RatingDots({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} 分`}
          onClick={() => onChange(n)}
          className={`h-5 w-5 rounded-full border transition-colors ${
            n > 0 && n <= value
              ? "border-accent bg-accent shadow-neon"
              : "border-line bg-panel hover:border-accent"
          }`}
        />
      ))}
      <span className="ml-2 w-8 text-sm text-muted">{value}/5</span>
    </div>
  );
}

export function ProfileForm() {
  const { profile, setProfile, ensureUserId, userId } = useProfileStore();
  const [form, setForm] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  // 实时把表单草稿同步进全局 store：用户在「我的画像」填任何一项，
  // 「智能推荐」「队友匹配」立即生效，无需专门点保存（避免“填了却推荐为空”的坑）。
  useEffect(() => {
    setProfile(form);
  }, [form, setProfile]);

  // 简历 AI 解析结果回填：数组类合并（并集，不覆盖已填），字段类覆盖，经历追加
  const applyParsed = (p: ParsedProfile) => {
    setSaved(false);
    setForm((f) => {
      const next: UserProfile = { ...f };
      if (p.identity) next.identity = p.identity;
      if (p.major) next.major = p.major;
      if (p.aiLevel) next.aiLevel = p.aiLevel;
      if (p.skillRatings) next.skillRatings = { ...f.skillRatings, ...p.skillRatings };
      if (p.goals?.length) next.goals = Array.from(new Set([...f.goals, ...p.goals]));
      if (p.personality?.length)
        next.personality = Array.from(new Set([...(f.personality ?? []), ...p.personality]));
      if (p.aiDirection?.length)
        next.aiDirection = Array.from(new Set([...(f.aiDirection ?? []), ...(p.aiDirection as AiDirection[])]));
      if (p.bio) next.bio = p.bio;
      if (p.availability) next.availability = p.availability;
      if (p.experiences?.length)
        next.experiences = [
          ...(f.experiences ?? []),
          ...(p.experiences as ProjectExperience[]),
        ];
      return next;
    });
  };

  const toggleGoal = (v: string) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(v)
        ? f.goals.filter((x) => x !== v)
        : [...f.goals, v],
    }));
  };

  const togglePersonality = (v: string) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      personality: f.personality?.includes(v)
        ? f.personality.filter((x) => x !== v)
        : [...(f.personality ?? []), v],
    }));
  };

  // —— 既往项目经历（AI 审查的证据源）——
  const exps = form.experiences ?? [];

  const addExperience = () => {
    setSaved(false);
    const blank: ProjectExperience = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: "",
      role: "",
      period: "",
      skillsUsed: [],
      summary: "",
      outcome: "",
    };
    setForm({ ...form, experiences: [...exps, blank] });
  };

  const updateExperience = (id: string, patch: Partial<ProjectExperience>) => {
    setSaved(false);
    setForm({
      ...form,
      experiences: exps.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeExperience = (id: string) => {
    setSaved(false);
    setForm({ ...form, experiences: exps.filter((e) => e.id !== id) });
  };

  const toggleExpSkill = (id: string, dim: SkillKey) => {
    setSaved(false);
    const target = exps.find((e) => e.id === id);
    if (!target) return;
    const next = target.skillsUsed.includes(dim)
      ? target.skillsUsed.filter((x) => x !== dim)
      : [...target.skillsUsed, dim];
    updateExperience(id, { skillsUsed: next });
  };

  const setRating = (k: SkillKey, v: number) => {
    setSaved(false);
    setForm((f) => ({ ...f, skillRatings: { ...f.skillRatings, [k]: v } }));
  };

  const submit = async () => {
    setProfile(form);
    const id = ensureUserId(); // 生成/复用匿名 ID（自动存 localStorage）
    setSaved(true);
    // 保存画像到 Supabase（未配置时 db 层静默跳过，不影响本地体验）
    await saveProfile(id, form);
  };

  // —— 画像导出 / 导入（JSON 只过本机，不上传，解决跨网址画像隔离）——
  const fileRef = useRef<HTMLInputElement>(null);

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(form, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-navigator-profile.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProfile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as UserProfile;
        setForm(parsed);
        setProfile(parsed);
        setSaved(false);
      } catch {
        alert("导入失败：文件不是有效的画像 JSON");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-7">
      {/* 简历一键填充（AI 解析自动填写，特别是项目经历） */}
      <ResumeUploader onApply={applyParsed} />

      {/* 身份 */}
      <div className="flex items-center justify-between gap-3">
        <label className="shrink-0 text-sm font-medium">身份</label>
        <Select
          className="w-44"
          value={form.identity ?? ""}
          onChange={(e) =>
            setForm({ ...form, identity: e.target.value as Identity })
          }
        >
          <option value="">请选择</option>
          {IDENTITIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </Select>
      </div>

      {/* 专业 */}
      <div className="flex items-center justify-between gap-3">
        <label className="shrink-0 text-sm font-medium">专业</label>
        <Select
          className="w-44"
          value={form.major ?? ""}
          onChange={(e) => setForm({ ...form, major: e.target.value as Major })}
        >
          <option value="">请选择</option>
          {MAJORS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {/* AI 水平 */}
      <div className="flex items-center justify-between gap-3">
        <label className="shrink-0 text-sm font-medium">AI 使用水平</label>
        <Select
          className="w-44"
          value={form.aiLevel ?? ""}
          onChange={(e) =>
            setForm({ ...form, aiLevel: e.target.value as AiLevel })
          }
        >
          <option value="">请选择</option>
          {AI_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      {/* 技能评分 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">技能评分（0-5 自评）</label>
        <div className="divide-y divide-line rounded-md border border-line">
          {SKILL_RATINGS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm">{SKILL_LABELS[key]}</span>
              <RatingDots
                value={form.skillRatings[key]}
                onChange={(v) => setRating(key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 参加目标 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">参加目标（可多选）</label>
        <MultiToggle
          options={GOALS}
          selected={form.goals}
          onToggle={toggleGoal}
        />
      </div>

      {/* 人格特质（队友匹配用） */}
      <div className="space-y-2">
        <label className="text-sm font-medium">人格特质（可多选，用于队友匹配）</label>
        <MultiToggle
          options={PERSONALITIES}
          selected={form.personality ?? []}
          onToggle={togglePersonality}
        />
      </div>

      {/* 想做的 AI 方向（比赛推荐 + 队友匹配共享） */}
      <div className="space-y-2">
        <label className="text-sm font-medium">想做的 AI 方向（可多选）</label>
        <MultiToggle
          options={AI_DIRECTIONS as readonly string[]}
          selected={form.aiDirection ?? []}
          onToggle={(v) =>
            setForm((f) => {
              const cur = f.aiDirection ?? [];
              const next = cur.includes(v as AiDirection)
                ? cur.filter((x) => x !== v)
                : [...cur, v as AiDirection];
              return { ...f, aiDirection: next };
            })
          }
          size="md"
        />
      </div>

      {/* 既往项目经历（AI 审查证据源） */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium">既往项目经历（用于 AI 审查验证技能）</label>
          <button
            type="button"
            onClick={addExperience}
            className="rounded-full border border-line px-3 py-1 font-mono text-xs text-accent hover:border-accent"
          >
            + 添加经历
          </button>
        </div>
        {exps.length === 0 ? (
          <p className="text-xs text-muted">
            还没添加。填一段经历（课程项目 / 比赛 / 实习皆可），AI 审查会据此验证你的技能自评是否站得住脚。也可以直接上传简历，由 AI 自动提取。
          </p>
        ) : (
          <div className="space-y-4">
            {exps.map((e, idx) => (
              <div key={e.id} className="space-y-3 rounded-md border border-line p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">经历 {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeExperience(e.id)}
                    className="text-xs text-muted hover:text-accent2"
                  >
                    删除
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-md border border-line bg-panel px-3 py-2 text-sm"
                    placeholder="项目名称"
                    value={e.name}
                    onChange={(ev) => updateExperience(e.id, { name: ev.target.value })}
                  />
                  <input
                    className="rounded-md border border-line bg-panel px-3 py-2 text-sm"
                    placeholder="你的角色"
                    value={e.role}
                    onChange={(ev) => updateExperience(e.id, { role: ev.target.value })}
                  />
                  <input
                    className="rounded-md border border-line bg-panel px-3 py-2 text-sm"
                    placeholder="时间，如 2025 春"
                    value={e.period}
                    onChange={(ev) => updateExperience(e.id, { period: ev.target.value })}
                  />
                  <input
                    className="rounded-md border border-line bg-panel px-3 py-2 text-sm"
                    placeholder="成果（获奖/发表/上线，可选）"
                    value={e.outcome ?? ""}
                    onChange={(ev) => updateExperience(e.id, { outcome: ev.target.value })}
                  />
                </div>
                <input
                  className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm"
                  placeholder="一句话描述 / 你做了什么"
                  value={e.summary}
                  onChange={(ev) => updateExperience(e.id, { summary: ev.target.value })}
                />
                <div>
                  <p className="mb-1.5 text-xs text-muted">用到的技能（可多选）</p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_RATINGS.map((k) => {
                      const active = e.skillsUsed.includes(k);
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleExpSkill(e.id, k)}
                          className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                            active
                              ? "border border-accent/60 bg-accent-soft text-accent shadow-neon"
                              : "border border-line text-muted hover:text-ink"
                          }`}
                        >
                          {SKILL_LABELS[k]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 一句话简介（队友匹配展示用，共享） */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">一句话简介（用于队友匹配展示）</label>
        <Textarea
          rows={3}
          placeholder="你会什么、想打什么类型的比赛、希望找怎样的队友……"
          value={form.bio ?? ""}
          onChange={(e) => {
            setSaved(false);
            setForm({ ...form, bio: e.target.value });
          }}
        />
      </div>

      {/* 可投入时间（队友匹配用，共享） */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">可投入时间（用于队友匹配）</label>
        <input
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm"
          placeholder="如 每周 10h / 周末为主（留空默认「时间可协商」）"
          value={form.availability ?? ""}
          onChange={(e) => {
            setSaved(false);
            setForm({ ...form, availability: e.target.value });
          }}
        />
      </div>

      {/* AI 技能审查（实时，基于上方经历） */}
      <SkillReviewPanel profile={form} />

      {/* 提交 */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button onClick={submit}>生成我的画像</Button>
        <Button variant="ghost" onClick={exportProfile}>
          导出画像
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          导入画像
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importProfile(f);
            e.target.value = "";
          }}
        />
        {saved && userId && (
          <Tag tone="accent">匿名 ID：{userId}</Tag>
        )}
        {saved && (
          <LinkButton href="/recommend" variant="ghost">
            查看推荐 →
          </LinkButton>
        )}
      </div>
    </div>
  );
}
