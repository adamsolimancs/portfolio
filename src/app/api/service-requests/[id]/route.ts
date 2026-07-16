import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  isServerSupabaseConfigured,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    status: z.enum(["open", "in_progress", "completed"]).optional(),
    adminComment: z.string().trim().max(2000).optional(),
  })
  .refine(
    (update) => update.status !== undefined || update.adminComment !== undefined,
    { message: "No service request changes were provided." },
  );

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isServerSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 500 },
    );
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service request update." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: adminRow, error: adminError } = await supabase
    .from("AdminUser")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const update = {
    ...(parsed.data.status
      ? {
          status: parsed.data.status,
          completed_at:
            parsed.data.status === "completed" ? new Date().toISOString() : null,
        }
      : {}),
    ...(parsed.data.adminComment !== undefined
      ? { admin_comment: parsed.data.adminComment || null }
      : {}),
  };
  const { data, error } = await supabase
    .from("ServiceRequest")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ serviceRequest: data });
}
