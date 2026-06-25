import emailjs from "@emailjs/nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceById } from "@/lib/services";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  isServerSupabaseConfigured,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const serviceRequestSchema = z.object({
  serviceTierId: z.string().min(1),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().min(10).max(4000),
  priority: z.enum(["normal", "high", "urgent"]),
});

const getEmailJsConfig = () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_SERVICE_REQUEST_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS service, template, or public key is missing.");
  }

  return { serviceId, templateId, publicKey, privateKey };
};

export async function POST(request: Request) {
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

  const parsed = serviceRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service request." },
      { status: 400 },
    );
  }

  const service = getServiceById(parsed.data.serviceTierId);

  if (!service) {
    return NextResponse.json(
      { error: "Invalid service tier." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: requestRow, error } = await supabase
    .from("ServiceRequest")
    .insert({
      client_id: user.id,
      service_tier_id: service.id,
      title: parsed.data.title || null,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "open",
      completed_at: null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const emailConfig = getEmailJsConfig();

  await emailjs.send(
    emailConfig.serviceId,
    emailConfig.templateId,
    {
      request_id: requestRow.id,
      user_id: user.id,
      user_email: user.email ?? "",
      user_name:
        user.user_metadata?.full_name || user.user_metadata?.name || "",
      service_tier: service.title,
      request_title: requestRow.title ?? "New service request",
      request_priority: requestRow.priority,
      request_description: requestRow.description,
      created_at: requestRow.created_at,
    },
    {
      publicKey: emailConfig.publicKey,
      privateKey: emailConfig.privateKey,
    },
  );

  return NextResponse.json({ serviceRequest: requestRow });
}
