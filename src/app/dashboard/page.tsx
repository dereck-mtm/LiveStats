import { redirect } from "next/navigation";

/** Dashboard is now the public home page. */
export default async function DashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.range) qs.set("range", params.range);
  if (params.demo) qs.set("demo", params.demo);
  const suffix = qs.toString();
  redirect(suffix ? `/?${suffix}` : "/");
}
