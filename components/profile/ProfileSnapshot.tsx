"use client";

import { useProfileStore } from "@/store/profile-store";
import { Tag } from "@/components/ui/Tag";
import { SKILL_RATINGS, SKILL_LABELS } from "@/lib/data/taxonomy";
import { competitions } from "@/lib/data/competitions";

/**
 * 画像快照：实时读取全局画像 store，把「目前画像的标签 + 需求」聚合成一张只读卡片。
 * 用户在下方表单改任何一项，这里立即跟随更新（store 是单一数据源）。
 */
export function ProfileSnapshot() {
  const { profile } = useProfileStore();

  const skills = SKILL_RATINGS.filter((k) => (profile.skillRatings?.[k] ?? 0) > 0).map(
    (k) => `${SKILL_LABELS[k]} ${profile.skillRatings[k]}`
  );
  const comps = (profile.targetCompetitions ?? [])
    .map((id) => competitions.find((c) => c.id === id)?.name ?? id)
    .filter(Boolean);

  const isEmpty =
    !profile.identity &&
    !profile.major &&
    !profile.aiLevel &&
    skills.length === 0 &&
    (profile.goals?.length ?? 0) === 0 &&
    (profile.personality?.length ?? 0) === 0 &&
    (profile.aiDirection?.length ?? 0) === 0 &&
    comps.length === 0 &&
    !profile.bio &&
    !profile.availability;

  const tagRow = (label: string, items: string[]) =>
    items.length ? (
      <div>
        <p className="mb-1 text-xs text-muted">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((x) => (
            <Tag key={x} tone="default">
              {x}
            </Tag>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="rounded-card border border-line bg-panel/50 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">当前画像快照</h2>
        <span className="text-xs text-muted">实时跟随下方表单</span>
      </div>

      {isEmpty ? (
        <p className="text-xs text-muted">
          画像还没填。在下方表单填完任一项，这里会实时显示你的标签与需求。
        </p>
      ) : (
        <div className="space-y-4">
          {/* 基础标签 */}
          {(profile.identity || profile.major || profile.aiLevel) && (
            <div className="flex flex-wrap gap-1.5">
              {profile.identity && <Tag tone="accent">{profile.identity}</Tag>}
              {profile.major && <Tag tone="accent">{profile.major}</Tag>}
              {profile.aiLevel && <Tag tone="accent">{profile.aiLevel}</Tag>}
            </div>
          )}

          {tagRow("技能标签（0-5 自评）", skills)}
          {tagRow("参赛目的", profile.goals ?? [])}
          {tagRow("人格特质", profile.personality ?? [])}
          {tagRow("想做的 AI 方向", profile.aiDirection ?? [])}

          {/* 需求区 */}
          <div className="rounded-md bg-accent-soft/40 px-3 py-2 text-xs text-ink">
            <p className="mb-1.5 font-medium text-muted">我的需求</p>
            <div className="space-y-1">
              <div>
                🎯 想参加的比赛：
                {comps.length ? (
                  <span className="text-accent">{comps.join("、")}</span>
                ) : (
                  <span className="text-muted">未指定</span>
                )}
              </div>
              <div>
                ⏰ 可投入时间：
                {profile.availability ? (
                  profile.availability
                ) : (
                  <span className="text-muted">未填（默认「时间可协商」）</span>
                )}
              </div>
              {profile.bio && (
                <div>
                  💬 一句话简介：{profile.bio}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
