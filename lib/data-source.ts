import { competitions as localCompetitions } from "@/lib/data/competitions";
import type { Competition } from "@/lib/types";

// 数据源抽象层。
// 当前版本比赛数据来自本地 data/competitions.ts（静态、零依赖、构建稳定）。
// 页面与推荐层只依赖本文件的异步接口；若未来要接云端赛事库，可在此扩展。

type CompetitionRow = {
  id: string;
  name: string;
  organizer: string | null;
  time: string | null;
  deadline: string | null;
  format: string | null;
  registration: string | null;
  ai_direction: string[] | null;
  suitable_for: string[] | null;
  skills: string[] | null;
  difficulty: string | null;
  competition_level: string | null;
  verified: boolean | null;
  description: string | null;
  prizes: string | null;
  tags: string[] | null;
  official_url: string | null;
  registration_url: string | null;
  category: string | null;
  region: string | null;
  source: string | null;
  status: string | null;
};

function mapRow(r: CompetitionRow): Competition {
  return {
    id: r.id,
    name: r.name,
    organizer: r.organizer ?? "",
    time: r.time ?? "",
    deadline: r.deadline ?? "",
    format: (r.format ?? "线上") as Competition["format"],
    registration: r.registration ?? undefined,
    aiDirection: (r.ai_direction ?? []) as Competition["aiDirection"],
    suitableFor: r.suitable_for ?? [],
    skills: r.skills ?? [],
    difficulty: (r.difficulty ?? "初级") as Competition["difficulty"],
    competitionLevel: (r.competition_level ?? "中") as Competition["competitionLevel"],
    verified: !!r.verified,
    region: (r.region ?? "domestic") as Competition["region"],
    source: (r.source ?? "official") as Competition["source"],
    status: (r.status ?? "approved") as Competition["status"],
    description: r.description ?? undefined,
    prizes: r.prizes ?? undefined,
    tags: r.tags ?? [],
    officialUrl: r.official_url ?? undefined,
    registrationUrl: r.registration_url ?? undefined,
    category: r.category ?? undefined,
  };
}

export async function getCompetitions(): Promise<Competition[]> {
  return localCompetitions;
}

export async function getCompetitionById(
  id: string
): Promise<Competition | null> {
  return localCompetitions.find((c) => c.id === id) ?? null;
}
