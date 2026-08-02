import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  isServerSupabaseConfigured,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const requestCount = 3;
const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: noStoreHeaders });

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return json({ ok: false }, 401);
  }

  if (!isServerSupabaseConfigured) {
    console.error("Supabase keep-alive is not configured.");
    return json({ ok: false }, 503);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const results = await Promise.all(
      Array.from({ length: requestCount }, () =>
        supabase.from("Customer").select("id").limit(1),
      ),
    );
    const failedResult = results.find(({ error }) => error);

    if (failedResult?.error) {
      console.error("Supabase keep-alive query failed.", {
        code: failedResult.error.code || "unknown",
      });
      return json({ ok: false }, 503);
    }

    return json({ ok: true }, 200);
  } catch (error) {
    console.error("Supabase keep-alive request failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ ok: false }, 503);
  }
}
