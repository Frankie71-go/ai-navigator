import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";

const OWNER_WECHAT = "qweasd2823451150";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(OWNER_WECHAT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Reveal>
      <div className="container-page max-w-3xl py-10">
        <PageHeader
          eyebrow="CONTACT"
          title="联系我们"
          subtitle="发现没收录的 AI 比赛？加负责人微信，我们帮你录入"
        />

      <Card className="corner-frame mt-8 p-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent/60 bg-accent-soft text-accent">
            微
          </span>
          <h2 className="text-lg font-semibold text-ink">项目负责人微信</h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          想把某个 AI 比赛加到 AI Navigator？直接加下方微信，把比赛信息发给负责人，
          我们会人工审核并录入到「比赛库」（含报名链接、官网、赛题方向等）。
        </p>

        {/* —— 展示信息（不可点击） —— */}
        <div className="mt-6 rounded-card border border-accent/25 bg-white/90 px-4 py-4">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted">
            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-accent">
              展示信息 · 不可点击
            </span>
            <span>以下微信号仅作展示，请手动复制或点右侧按钮</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="select-all font-mono text-base font-semibold tracking-wide text-ink">
              {OWNER_WECHAT}
            </span>
            {/* —— 唯一可点击操作 —— */}
            <button
              onClick={copyWechat}
              className="inline-flex items-center rounded-md bg-gradient-to-r from-[#0891b2] to-[#4338ca] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-105"
            >
              {copied ? "已复制 ✓" : "复制微信"}
            </button>
          </div>
        </div>

        {/* —— 提示标签（展示，非按钮） —— */}
        <div className="mt-6">
          <p className="mb-2 text-xs text-muted">
            发给我们时，建议包含（灰色标签仅为提示，不可点击）：
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Tag tone="default">比赛名称</Tag>
            <Tag tone="default">报名 / 截止时间</Tag>
            <Tag tone="default">报名链接</Tag>
            <Tag tone="default">官网 / 主办方</Tag>
            <Tag tone="default">赛题方向</Tag>
            <Tag tone="default">面向人群</Tag>
          </div>
        </div>

        {/* —— 图例：区分展示与操作 —— */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md bg-line/30 px-3 py-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded border border-dashed border-line bg-panel" />
            虚线框 = 展示信息（只读）
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded bg-accent" />
            实心按钮 = 可点击操作
          </span>
        </div>
      </Card>

      <div className="mt-6 rounded-card border border-line bg-accent-soft/40 px-4 py-3 text-xs text-muted">
        也可以直接通过网站内「审查台」查看已收录比赛的完整度，或到「比赛库」反馈遗漏。
      </div>

      <div className="mt-6 flex justify-center">
        <LinkButton href="/competitions" variant="secondary">
          去看看比赛库 →
        </LinkButton>
      </div>
      </div>
    </Reveal>
  );
}
