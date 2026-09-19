"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { SKILL_RATINGS, SKILL_LABELS } from "@/lib/data/taxonomy";
import { competitions } from "@/lib/data/competitions";
import type { AiDirection, AiLevel, Identity, Major, SkillKey, UserProfile } from "@/lib/types";
import type { Teammate } from "@/lib/teammates";
import { submitTeammate, deleteTeammate } from "@/lib/cloudbase/db";

interface Props {
  ownerId: string;
  profile: UserProfile;
  /** 已有投稿（用于重新编辑） */
  initial?: Teammate | null;
  onSubmitted: (t: Teammate, local: boolean) => void;
  /** 取消发布后回调（传 ownerId 与是否仅本地回退） */
  onDeleted?: (ownerId: string, local: boolean) => void;
}

export function TeammateSubmissionForm({ ownerId, profile, initial, onSubmitted, onDeleted }: Props) {
  // —— 从画像自动同步的共享字段（单一数据源，避免重复填写）——
  const synced = {
    identity: (profile.identity ?? initial?.identity ?? "") as Identity | "",
    major: (profile.major ?? initial?.major ?? "") as Major | "",
    aiLevel: (profile.aiLevel ?? initial?.aiLevel ?? "") as AiLevel | "",
    skills:
      profile.skillRatings &&
      SKILL_RATINGS.some((k) => (profile.skillRatings[k] ?? 0) > 0)
        ? (SKILL_RATINGS.filter((k) => (profile.skillRatings[k] ?? 0) > 0) as SkillKey[])
        : ((initial?.skills as SkillKey[] | undefined) ?? []),
    personality: profile.personality?.length
      ? profile.personality
      : (initial?.personality ?? []),
    goals: profile.goals?.length ? profile.goals : (initial?.goals ?? []),
    aiDirection: (profile.aiDirection?.length
      ? profile.aiDirection
      : (initial?.aiDirection ?? [])) as AiDirection[],
    targetCompetitions: profile.targetCompetitions?.length
      ? profile.targetCompetitions
      : (initial?.targetCompetitions ?? []),
    bio: profile.bio ?? initial?.bio ?? "",
    availability: profile.availability ?? initial?.availability ?? "",
  };

  // —— 仅队友匹配需要的字段（不进画像，需单独填写）——
  const [name, setName] = useState(initial?.name ?? "");
  type ContactPlatform = "微信" | "QQ" | "小红书" | "飞书";
  const CONTACT_PLATFORMS: ContactPlatform[] = ["微信", "QQ", "小红书", "飞书"];
  const parseContact = (s?: string): [ContactPlatform | "", string] => {
    if (!s) return ["", ""];
    const i = s.indexOf(" · ");
    if (i === -1) return ["", s];
    const p = s.slice(0, i) as ContactPlatform;
    return [CONTACT_PLATFORMS.includes(p) ? p : "", s.slice(i + 3)];
  };
  const [contactType, setContactType] = useState<ContactPlatform | "">(
    parseContact(initial?.preferredContact)[0]
  );
  const [contactAccount, setContactAccount] = useState(
    parseContact(initial?.preferredContact)[1]
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // —— 校验：共享字段必须来自画像；队友专属字段需填写 ——
  const missingShared: string[] = [];
  if (!synced.identity) missingShared.push("身份");
  if (!synced.major) missingShared.push("专业");
  if (!synced.aiLevel) missingShared.push("AI 水平");
  if (synced.skills.length === 0) missingShared.push("至少一项技能（去画像做技能自评）");

  const missingSelf: string[] = [];
  if (!name.trim()) missingSelf.push("昵称");
  if (!contactType) missingSelf.push("联系平台");
  if (!contactAccount.trim()) missingSelf.push("联系账号");
  const canSubmit = missingShared.length === 0 && missingSelf.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const t: Teammate = {
      id: initial?.id ?? `usr-${ownerId}-${Date.now()}`,
      name: name.trim(),
      identity: synced.identity as Identity,
      major: synced.major as Major,
      aiLevel: synced.aiLevel as AiLevel,
      skills: synced.skills,
      personality: synced.personality,
      goals: synced.goals,
      aiDirection: synced.aiDirection,
      targetCompetitions: synced.targetCompetitions,
      bio: synced.bio.trim(),
      preferredContact: `${contactType} · ${contactAccount.trim()}`,
      availability: synced.availability.trim() || "时间可协商",
      ownerId,
      source: "user",
      createdAt: new Date().toISOString(),
    };
    const { local } = await submitTeammate(t);
    setSubmitting(false);
    onSubmitted(t, local);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "确定要撤回你在候选池的投稿吗？其他用户将不再能匹配到你，且本操作不可恢复。"
      )
    ) {
      return;
    }
    setDeleting(true);
    const { local } = await deleteTeammate(ownerId);
    setDeleting(false);
    onDeleted?.(ownerId, local);
  };

  // —— 同步字段展示辅助 ——
  const skillsLabels = synced.skills.map((k) => SKILL_LABELS[k] ?? k);
  const compNames = synced.targetCompetitions.map(
    (id) => competitions.find((c) => c.id === id)?.name ?? id
  );

  const renderRow = (label: string, items: string[]) => (
    <div>
      <p className="mb-1 text-xs text-muted">{label}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((x) => (
            <Tag key={x} tone="default">
              {x}
            </Tag>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted/70">未填写（可到「我的画像」补充以提升匹配精度）</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 同步说明 */}
      <div className="rounded-md border border-accent/30 bg-accent-soft/40 px-4 py-3 text-xs leading-relaxed text-muted">
        <div className="flex items-start gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent2"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
          <div>
            <p>
              以下信息已
              <span className="font-medium text-ink">自动同步自「我的画像」</span>
              ，无需重复填写。如需修改，请到 <LinkButton href="/profile" variant="ghost">我的画像</LinkButton> 调整。
            </p>
            <p className="mt-1">昵称与联系方式仅用于队友匹配，不会被用于比赛推荐。</p>
          </div>
        </div>
      </div>

      {/* 缺共享字段提示 */}
      {missingShared.length > 0 && (
        <div className="rounded-md border border-accent2/40 bg-panel/60 px-4 py-3 text-xs text-ink">
          还需要先到「我的画像」补全：
          <span className="font-medium">{missingShared.join("、")}</span> ，才能发布到候选池。
          <LinkButton href="/profile" variant="ghost">去补全 →</LinkButton>
        </div>
      )}

      {/* 已同步区域（只读展示） */}
      <div className="space-y-4 rounded-card border border-line bg-panel/40 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">已同步 · 来自我的画像</span>
          <LinkButton href="/profile" variant="ghost">
            修改画像 →
          </LinkButton>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs text-muted">身份</p>
            <p className="text-sm text-ink">{synced.identity || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">专业</p>
            <p className="text-sm text-ink">{synced.major || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">AI 水平</p>
            <p className="text-sm text-ink">{synced.aiLevel || "—"}</p>
          </div>
        </div>

        {renderRow("技能（来自画像技能自评）", skillsLabels)}
        {renderRow("人格特质", synced.personality)}
        {renderRow("参赛目的", synced.goals)}
        {renderRow("想做的 AI 方向", synced.aiDirection)}
        {renderRow("想参加的比赛", compNames)}

        <div>
          <p className="mb-1 text-xs text-muted">一句话简介</p>
          <p className="text-sm text-ink">{synced.bio.trim() || "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted">可投入时间</p>
          <p className="text-sm text-ink">{synced.availability.trim() || "时间可协商"}</p>
        </div>
      </div>

      {/* 队友专属字段 */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-ink">队友匹配补充信息（发布后公开）</p>
        <div className="rounded-md border border-accent2/50 bg-accent2/5 px-3 py-2 text-xs leading-relaxed text-ink">
          <span className="font-medium">⚠️ 公开提示：</span>
          点击「发布到候选池」后，你的昵称和联系方式将对候选池内的
          <span className="font-medium">所有用户公开可见</span>
          （不限于匹配成功的人）。如不想暴露真实账号，请使用备用联系方式；随时可点「取消发布」撤回。
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              昵称 <span className="text-accent2">*</span>
            </label>
            <Input
              placeholder="展示给队友的名字，如 阿柯"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              联系方式 <span className="text-accent2">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                className="w-28"
                value={contactType}
                onChange={(e) => setContactType(e.target.value as ContactPlatform)}
              >
                <option value="">平台</option>
                {CONTACT_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <Input
                className="min-w-[180px] flex-1"
                placeholder={contactType ? `你的${contactType}账号` : "先选平台，再填账号"}
                value={contactAccount}
                onChange={(e) => setContactAccount(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting || deleting}>
          {submitting ? "提交中…" : initial ? "更新我的投稿" : "发布到候选池"}
        </Button>
        {initial && (
          <Button variant="secondary" onClick={handleDelete} disabled={submitting || deleting}>
            {deleting ? "撤回中…" : "取消发布"}
          </Button>
        )}
        {!canSubmit && !initial && (
          <span className="text-xs text-muted">
            {missingSelf.length > 0
              ? `还需填写：${missingSelf.join("、")}`
              : "请先在「我的画像」补全必填项"}
          </span>
        )}
      </div>
    </div>
  );
}
