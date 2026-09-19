import { useEffect, useMemo, useState } from "react";
import { useProfileStore } from "@/store/profile-store";
import { matchTeammates } from "@/lib/teammate-match";
import { loadTeammates } from "@/lib/cloudbase/db";
import type { Teammate } from "@/lib/teammates";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeammateSubmissionForm } from "@/components/teammate/TeammateSubmissionForm";
import { PostBoard } from "@/components/teammate/PostBoard";
import { Reveal } from "@/components/ui/Reveal";
import { competitions } from "@/lib/data/competitions";

export default function TeammatesPage() {
  const { profile, ensureUserId, userId } = useProfileStore();

  const [candidates, setCandidates] = useState<Teammate[]>([]);
  const [anonId, setAnonId] = useState<string | undefined>(userId);
  const [justSubmitted, setJustSubmitted] = useState<{ name: string; local: boolean } | null>(null);
  const [justDeleted, setJustDeleted] = useState<{ local: boolean } | null>(null);
  const [selectedComp, setSelectedComp] = useState<string>("");

  // 挂载即确保匿名 ID、加载候选池（mock + 用户投稿），并读取 ?c= 预选比赛
  useEffect(() => {
    const id = ensureUserId();
    setAnonId(id);
    loadTeammates().then(setCandidates);
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    if (c) setSelectedComp(c);
  }, [ensureUserId]);

  const anySkill =
    profile.skillRatings ? Object.values(profile.skillRatings).some((v) => v > 0) : false;
  const hasBasis =
    (profile.goals?.length ?? 0) > 0 ||
    (profile.personality?.length ?? 0) > 0 ||
    (profile.experiences?.length ?? 0) > 0 ||
    anySkill;
  // 选了比赛也能直接匹配（比赛即共同目标，不强依赖画像）
  const basis = hasBasis || !!selectedComp;

  const matches = useMemo(
    () => (basis ? matchTeammates(profile, candidates, anonId, selectedComp || undefined) : []),
    [basis, profile, candidates, anonId, selectedComp]
  );

  // 取匹配度最高的前 8 位作为候选队友
  const top = matches.slice(0, 8);
  const expCount = profile.experiences?.length ?? 0;
  const mySubmission = candidates.find((c) => c.ownerId === anonId);

  const handleSubmitted = (t: Teammate, local: boolean) => {
    setJustDeleted(null);
    setJustSubmitted({ name: t.name, local });
    loadTeammates().then(setCandidates);
  };

  const handleDeleted = (ownerId: string, local: boolean) => {
    setJustSubmitted(null);
    setJustDeleted({ local });
    loadTeammates().then(setCandidates);
  };

  return (
    <Reveal>
      <div className="container-page max-w-4xl py-10">
        <PageHeader
          eyebrow="TEAMMATE"
          title="队友匹配"
          subtitle="先看中一个比赛，再在同样想参加这场比赛的同学里，找风格合拍、又能互补短板的队友"
        />

      {/* 先选比赛：比赛即共同目标，再在想参加这场比赛的同学里排人 */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-line bg-panel/60 px-4 py-3">
        <label className="text-sm font-medium">我想找这场比赛的队友：</label>
        <Select
          className="w-64"
          value={selectedComp}
          onChange={(e) => setSelectedComp(e.target.value)}
        >
          <option value="">全部比赛（按整体契合度匹配）</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        {selectedComp && (
          <button
            type="button"
            onClick={() => setSelectedComp("")}
            className="text-xs text-muted underline hover:text-accent"
          >
            清除
          </button>
        )}
      </div>

      {/* —— 访客自由发帖：组队帖招募墙（无需画像即可发） —— */}
      <PostBoard />

      {!basis ? (
        <Card className="corner-frame mt-8 p-8 text-center">
          <p className="text-muted">
            先补全画像里的「参赛目的」「人格特质」或「项目经历」，或直接在上方选一个比赛，我们才能帮你匹配队友。
          </p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/profile">去完善画像</LinkButton>
          </div>
        </Card>
      ) : (
        <>
          <div className="mt-6 rounded-card border border-line bg-panel/60 px-4 py-3 text-xs text-muted">
            {selectedComp ? (
              <>
                已筛选「同样想参加该比赛」的候选队友 <span className="text-accent">{matches.length}</span> 位，
                按「技能互补 + 人格契合 + AI 方向」排序展示前 {top.length} 位 · 匹配度 0–100（越高越对口）
              </>
            ) : (
              <>
                已为你从候选库中匹配 <span className="text-accent">{matches.length}</span> 位队友，
                按契合度排序展示前 {top.length} 位 · 匹配度 0–100（越高越对口）
                {expCount > 0 && (
                  <>
                    {" "}
                    · 已用 <span className="text-accent">{expCount}</span> 段项目经历校准技能，互补判定更准
                  </>
                )}
              </>
            )}
          </div>

          {top.length === 0 && (
            <Card className="corner-frame mt-6 p-8 text-center">
              <p className="text-muted">
                {selectedComp
                  ? "暂无其他同学也标注想参加这场比赛。"
                  : "候选池里还没有队友投稿。"}
                先发布你的投稿并勾选目标比赛，其他想参加的同学就能在这里匹配到你；
                你也能在比赛页点「找队友」让同场同学看到你。
              </p>
            </Card>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {top.map(({ teammate, score, reasons }, i) => (
              <Reveal key={teammate.id} delay={i * 60} className="h-full">
                <Card className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{teammate.name}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {teammate.identity} · {teammate.major} · {teammate.aiLevel}
                    </div>
                  </div>
                  <Tag tone="accent">契合度 {score}/100</Tag>
                </div>

                <p className="text-sm leading-relaxed text-muted">{teammate.bio}</p>

                <div>
                  <p className="mb-1 text-xs text-muted">人格特质</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teammate.personality.map((p) => (
                      <Tag key={p} tone="default">
                        {p}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted">参赛目的</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teammate.goals.map((g) => (
                      <Tag key={g} tone="accent">
                        {g}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div className="rounded-md bg-accent-soft/50 px-3 py-2 text-xs text-ink">
                  <span className="font-medium">为什么合拍：</span>
                  {reasons.join("；")}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                  <span>可投入：{teammate.availability}</span>
                  <span>联系：{teammate.preferredContact}</span>
                </div>
              </Card>
              </Reveal>
            ))}
          </div>

          {/* —— 我的投稿 / 成为候选队友 —— */}
          <Card className="corner-frame mt-10 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">
                {mySubmission ? "管理我的投稿" : "成为候选队友"}
              </h2>
              {mySubmission && (
                <Tag tone="accent">已在候选池 ✓</Tag>
              )}
            </div>

            {justSubmitted && (
              <div className="mb-4 rounded-md border border-accent/40 bg-accent-soft/40 px-3 py-2 text-xs text-ink">
                已发布「{justSubmitted.name}」到候选池
                {justSubmitted.local
                  ? "（本机保存；配置云端后即可全站共享）"
                  : "（已写入云端，其他用户也能匹配到你）"}
                。你会从他人的匹配结果中出现，但不会匹配到你自己。
              </div>
            )}

            {justDeleted && (
              <div className="mb-4 rounded-md border border-line bg-panel/60 px-3 py-2 text-xs text-muted">
                已撤回你的候选池投稿
                {justDeleted.local
                  ? "（仅本机缓存被清除；云端若已发布，稍后同步生效）"
                  : "（已从云端移除，其他用户不再能匹配到你）"}
                。
              </div>
            )}

            {mySubmission && (
              <div className="mb-4 rounded-md border border-line bg-panel/60 px-3 py-2 text-xs text-muted">
                当前投稿：<span className="text-ink">{mySubmission.name}</span> · {mySubmission.identity} · {mySubmission.major} · 技能 {mySubmission.skills.length} 项。下方可修改后重新发布（按你的匿名 ID 覆盖更新）。
              </div>
            )}

            <TeammateSubmissionForm
              key={mySubmission?.id ?? "new"}
              ownerId={anonId ?? "anon-unknown"}
              profile={profile}
              initial={mySubmission ?? null}
              onSubmitted={handleSubmitted}
              onDeleted={handleDeleted}
            />
          </Card>

          <p className="mt-6 text-center text-xs text-muted">
            候选池 = 用户投稿 · 在「我的画像」填写的信息会自动带入本页，补全画像（含项目经历）可让互补匹配更准
          </p>
        </>
      )}
      </div>
    </Reveal>
  );
}
