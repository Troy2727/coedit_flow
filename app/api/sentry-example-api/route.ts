import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Modified to not throw an error while Sentry is disabled
export function GET() {
  // Temporarily commented out to prevent errors
  // throw new Error("Sentry Example API Route Error");
  return NextResponse.json({ data: "Sentry example API - Error throwing temporarily disabled" });
}
