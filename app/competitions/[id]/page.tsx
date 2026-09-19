import { useParams } from "react-router-dom";
import CompetitionDetail from "@/components/competition/CompetitionDetail";

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CompetitionDetail competitionId={id ?? ""} />;
}
