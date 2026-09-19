"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProfileStore } from "@/store/profile-store";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { Card } from "@/components/ui/Card";
import { SKILL_RATINGS, SKILL_LABELS } from "@/lib/data/taxonomy";
import { competitions } from "@/lib/data/competitions";
import type { TeammatePost } from "@/lib/types";
import { submitPost, loadPosts, deletePost } from "@/lib/cloudbase/db";
import { containsProfanity, PROFANITY_MESSAGE } from "@/lib/profanity";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(d).toLocaleDateString("zh-CN");
}

export function PostBoard() {
  const { profile, ensureUserId, userId } = useProfileStore();
  const [posts, setPosts] = useState<TeammatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [justPosted, setJustPosted] = useState<{ local: boolean } | null>(null);

  // —— 发帖表单（内容全部自编辑）——
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [contact, setContact] = useState("");
  const [attachProfile, setAttachProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profError, setProfError] = useState<string | null>(null);

  useEffect(() => {
    ensureUserId();
    loadPosts().then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, [ensureUserId]);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setProfError(null);
    // 脏话拦截：标题 / 正文 / 昵称 任一命中即阻断，不写入（中/英/粤三语，见 lib/profanity）
    const hit = [title, content, authorName].find((v) => containsProfanity(v));
    if (hit !== undefined) {
      setProfError(PROFANITY_MESSAGE);
      return;
    }
    setSubmitting(true);
    const id = ensureUserId();
    const post: TeammatePost = {
      id: `post-${id}-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim() || undefined,
      authorId: id,
      competitionId: competitionId || undefined,
      contact: contact.trim() || undefined,
      createdAt: new Date().toISOString(),
      ...(attachProfile
        ? {
            identity: profile.identity,
            major: profile.major,
            aiLevel: profile.aiLevel,
            skills: SKILL_RATINGS.filter((k) => (profile.skillRatings?.[k] ?? 0) > 0),
            personality: profile.personality ?? [],
            goals: profile.goals ?? [],
            aiDirection: profile.aiDirection ?? [],
            targetCompetitions: profile.targetCompetitions ?? [],
            availability: profile.availability,
          }
        : {}),
    };
    const { local } = await submitPost(post);
    setJustPosted({ local });
    setTitle("");
    setContent("");
    setAuthorName("");
    setCompetitionId("");
    setContact("");
    setPosts((prev) => [post, ...prev]);
    setSubmitting(false);
  };

  const handleDelete = async (post: TeammatePost) => {
    if (!window.confirm("确定删除这条招募帖吗？删除后其他用户将不再看到，且不可恢复。")) return;
    const { local } = await deletePost(post.id, post.authorId);
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setJustPosted({ local });
  };

  const myId = userId ?? ensureUserId();
  const compName = (id?: string) => competitions.find((c) => c.id === id)?.name ?? id;

  const renderTagRow = (label: string, items: string[]) =>
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
    <div className="mt-8 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">组队帖 · 招募墙</h2>
          <p className="mt-0.5 text-xs text-muted">
            不用先填画像，直接写你想找怎样的队友 / 想打什么比赛，发布后这里就能被看到。
          </p>
        </div>
      </div>

      {/* —— 发帖编辑器 —— */}
      <Card className="corner-frame p-5">
        <div className="space-y-3">
          <Input
            placeholder="帖子标题，如：找两个队友打 CCF BDCI 的金融赛道"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="自由写你的需求：想做什么、缺什么角色、时间怎么安排、联系方式……（内容你自己编辑）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">昵称（可选）</label>
              <Input
                placeholder="展示名，如 阿柯（留空显示「匿名」）"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">关联比赛（可选）</label>
              <Select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)}>
                <option value="">不关联 / 自由组队</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">联系方式（可选，公开）</label>
              <Input
                placeholder="如 微信 abc123 / 邮箱 hi@x.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={attachProfile}
                  onChange={(e) => setAttachProfile(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                附带我的画像标签（身份 / 专业 / 技能 / 目标…）
              </label>
            </div>
          </div>

          {justPosted && (
            <div className="rounded-md border border-accent/40 bg-accent-soft/40 px-3 py-2 text-xs text-ink">
              已发布你的组队帖
              {justPosted.local
                ? "（本机保存；配置云端后即可全站共享）"
                : "（已写入云端，其他用户也能看到）"}
              。
            </div>
          )}

          {profError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {profError}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "发布中…" : "发布组队帖"}
            </Button>
            {!canSubmit && (
              <span className="text-xs text-muted">标题与正文都填了才能发布</span>
            )}
          </div>
        </div>
      </Card>

      {/* —— 帖子列表 —— */}
      {loading ? (
        <p className="text-center text-xs text-muted">加载中…</p>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted">
            还没有人发帖。写下你的第一条组队帖，想参加同场比赛 / 同方向的人就能找到你。
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => {
            const isMine = !!post.authorId && post.authorId === myId;
            const skillsLabels = (post.skills ?? []).map((k) => SKILL_LABELS[k] ?? k);
            const hasTags =
              !!post.identity ||
              !!post.major ||
              !!post.aiLevel ||
              skillsLabels.length > 0 ||
              (post.personality?.length ?? 0) > 0 ||
              (post.goals?.length ?? 0) > 0 ||
              (post.aiDirection?.length ?? 0) > 0;
            return (
              <Card key={post.id} className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{post.title}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {post.authorName || "匿名"} · {timeAgo(post.createdAt)}
                      {post.competitionId && (
                        <>
                          {" · "}
                          <Link
                            to={`/competitions/${post.competitionId}`}
                            className="text-accent hover:underline"
                          >
                            {compName(post.competitionId)}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      className="shrink-0 text-xs text-muted hover:text-accent2"
                    >
                      删除
                    </button>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">
                  {post.content}
                </p>

                {hasTags && (
                  <div className="space-y-2 rounded-md border border-line bg-panel/40 px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {post.identity && <Tag tone="accent">{post.identity}</Tag>}
                      {post.major && <Tag tone="accent">{post.major}</Tag>}
                      {post.aiLevel && <Tag tone="accent">{post.aiLevel}</Tag>}
                    </div>
                    {renderTagRow("技能", skillsLabels)}
                    {renderTagRow("参赛目的", post.goals ?? [])}
                    {renderTagRow("人格特质", post.personality ?? [])}
                    {renderTagRow("想做的 AI 方向", post.aiDirection ?? [])}
                    {post.targetCompetitions && post.targetCompetitions.length > 0 && (
                      <p className="text-xs text-muted">
                        想参加的比赛：
                        {post.targetCompetitions.map((id, i) => (
                          <span key={id}>
                            {i > 0 && "、"}
                            <Link to={`/competitions/${id}`} className="text-accent hover:underline">
                              {compName(id)}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                  <span>{post.availability ? `可投入：${post.availability}` : "可投入：未填"}</span>
                  {post.contact && <span>联系：{post.contact}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        组队帖 = 访客自由发布 · 默认本机保存；配置云端（VITE_TEAMMATE_HTTP_URL）后全站共享，
        其他想组队的人也能看到你发的帖。
      </p>
    </div>
  );
}
