"use client";

import { useRef, useState } from "react";
import { callTcbFunction } from "@/lib/cloudbase/client";
import { Button } from "@/components/ui/Button";
import type {
  AiDirection,
  AiLevel,
  Identity,
  Major,
  ProjectExperience,
  SkillKey,
} from "@/lib/types";

/** 简历解析后回填到画像的数据结构（experiences 暂不带 id，由调用方补） */
export interface ParsedProfile {
  identity?: Identity;
  major?: Major;
  aiLevel?: AiLevel;
  skillRatings?: Partial<Record<SkillKey, number>>;
  goals?: string[];
  personality?: string[];
  aiDirection?: AiDirection[];
  bio?: string;
  availability?: string;
  experiences?: Array<Omit<ProjectExperience, "id">>;
}

const ACCEPT = ".pdf,.txt,.md";
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file, "utf-8");
  });
}

export function ResumeUploader({
  onApply,
}: {
  onApply: (p: ParsedProfile) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setError(null);
    setParsed(null);
    setDone(false);

    const lower = f.name.toLowerCase();
    if (!ACCEPT.split(",").some((ext) => lower.endsWith(ext.trim()))) {
      setError("暂仅支持 PDF / TXT / MD 格式，请将简历另存为这三种之一再上传");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("文件过大（>3MB），请压缩或改用 TXT 文本");
      return;
    }

    setFile(f);
    setLoading(true);
    try {
      let resumeText = "";
      let fileBase64 = "";
      if (lower.endsWith(".pdf")) {
        const dataUrl = await readAsDataURL(f);
        fileBase64 = dataUrl.split(",")[1] || "";
      } else {
        resumeText = await readAsText(f);
      }

      const res = await callTcbFunction("ai-verify", {
        action: "parseResume",
        fileName: f.name,
        resumeText,
        fileBase64,
      });

      if (!res || res.fallback || res.error) {
        setError(
          res?.error
            ? String(res.error)
            : "AI 解析暂不可用（未配置云端或已触达每日额度），请手动填写，或稍后再试"
        );
        return;
      }
      setParsed(res as ParsedProfile);
    } catch {
      setError("解析失败，请手动填写或换一份简历");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const confirm = () => {
    if (!parsed) return;
    const p: ParsedProfile = { ...parsed };
    if (p.experiences && p.experiences.length) {
      p.experiences = p.experiences.map((e) => ({
        ...e,
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));
    }
    onApply(p);
    setParsed(null);
    setFile(null);
    setDone(true);
    if (inputRef.current) inputRef.current.value = "";
    setTimeout(() => setDone(false), 2500);
  };

  const expCount = parsed?.experiences?.length ?? 0;

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent-soft/30 p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-[11px] text-accent">
          AI 一键填充
        </span>
        <h3 className="text-sm font-semibold">上传简历，自动填写画像</h3>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        支持 PDF / TXT / MD。AI 会读取你的简历，自动补全身份、专业、技能评分，
        <span className="text-accent">特别是「既往项目经历」</span>；确认后再填入，不会覆盖你已填的内容。
      </p>

      {/* 上传区 */}
      {!parsed && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent-soft/40"
              : "border-line hover:border-accent/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-sm text-muted">AI 正在解析简历…</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">
                {file ? file.name : "点击选择 或 拖拽简历到此处"}
              </p>
              <p className="mt-1 text-xs text-muted">PDF / TXT / MD · 不超过 3MB</p>
            </>
          )}
        </div>
      )}

      {/* 解析结果预览 */}
      {parsed && (
        <div className="mt-4 space-y-3 rounded-lg border border-accent/40 bg-panel p-4">
            <p className="text-xs font-medium text-accent">
              AI 已提取以下信息，确认后填入画像：
            </p>
          <ul className="space-y-1.5 text-xs">
            {parsed.identity && (
              <li>
                <span className="text-muted">身份：</span>
                {parsed.identity}
              </li>
            )}
            {parsed.major && (
              <li>
                <span className="text-muted">专业：</span>
                {parsed.major}
              </li>
            )}
            {parsed.aiLevel && (
              <li>
                <span className="text-muted">AI 水平：</span>
                {parsed.aiLevel}
              </li>
            )}
            {parsed.skillRatings && (
              <li>
                <span className="text-muted">技能评分：</span>
                {(["Coding", "Research", "Product", "Presentation"] as SkillKey[])
                  .map(
                    (k) =>
                      `${k} ${parsed.skillRatings?.[k] ?? 0}`
                  )
                  .join(" · ")}
              </li>
            )}
            {parsed.aiDirection && parsed.aiDirection.length > 0 && (
              <li>
                <span className="text-muted">AI 方向：</span>
                {parsed.aiDirection.join("、")}
              </li>
            )}
            {expCount > 0 && (
              <li className="text-accent">
                提取到 {expCount} 段项目经历，已加入「既往项目经历」
              </li>
            )}
            {!parsed.identity &&
              !parsed.major &&
              !parsed.aiLevel &&
              !parsed.skillRatings &&
              expCount === 0 && (
                <li className="text-muted">
                  未提取到明确字段（简历信息较少），你可以手动补充。
                </li>
              )}
          </ul>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={confirm}>
              确认填充
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setParsed(null);
                setFile(null);
              }}
            >
              不用，手动填
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {done && (
        <p className="mt-3 text-xs text-accent">已填充到画像，记得点底部「生成我的画像」保存。</p>
      )}
    </div>
  );
}
