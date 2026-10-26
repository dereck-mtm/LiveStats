import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/config";
import { clearSession } from "@/lib/session";

export async function GET() {
  await clearSession();
  return NextResponse.redirect(`${getAppUrl()}/`);
}

export async function POST() {
  await clearSession();
  return NextResponse.redirect(`${getAppUrl()}/`);
}
