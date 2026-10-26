import { StatsView } from "@/components/stats-view";
import { isStatsRange, loadPublicStats } from "@/lib/load-stats";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; error?: string }>;
}) {
  const params = await searchParams;
  const range = isStatsRange(params.range) ? params.range : "medium_term";
  const stats = await loadPublicStats(range);

  return (
    <>
      {params.error && (
        <div className="bg-coral/15 px-4 py-2 text-center text-sm text-fog">
          Sign-in issue: {params.error}
        </div>
      )}
      <StatsView stats={stats} range={range} showOwnerLink />
    </>
  );
}
