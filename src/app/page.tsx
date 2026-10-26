import { Dashboard } from "@/components/dashboard";
import { buildStatsPayload } from "@/lib/stats-payload";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initial = await buildStatsPayload(range);
  return <Dashboard initial={initial} />;
}
