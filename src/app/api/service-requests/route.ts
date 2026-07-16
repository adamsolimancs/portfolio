import emailjs from "@emailjs/nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceById } from "@/lib/services";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  isServerSupabaseConfigured,
  upsertCustomerForUser,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const serviceRequestSchema = z.object({
  serviceTierId: z
    .string({
      required_error: "Please select a service tier.",
      invalid_type_error: "Please select a valid service tier.",
    })
    .min(1, "Please select a service tier."),
  title: z
    .string({ invalid_type_error: "Title must be text." })
    .trim()
    .max(120, "Title must be 120 characters or fewer.")
    .optional(),
  description: z
    .string({
      required_error: "Please enter a description.",
      invalid_type_error: "Description must be text.",
    })
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(4000, "Description must be 4,000 characters or fewer."),
  priority: z.enum(["normal", "high", "urgent"], {
    errorMap: () => ({
      message: "Priority must be normal, high, or urgent.",
    }),
  }),
});

const getEmailJsConfig = () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_SERVICE_REQUEST_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();
  const missingVariables = [
    ["EMAILJS_SERVICE_ID", serviceId],
    ["EMAILJS_SERVICE_REQUEST_TEMPLATE_ID", templateId],
    ["EMAILJS_PUBLIC_KEY", publicKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0 || !serviceId || !templateId || !publicKey) {
    return {
      configured: false as const,
      hasPrivateKey: Boolean(privateKey),
      missingVariables,
    };
  }

  return {
    configured: true as const,
    config: { serviceId, templateId, publicKey, privateKey },
  };
};

const getEmailErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const responseError = error as { status?: unknown; text?: unknown };

    return {
      status: responseError.status,
      text: responseError.text,
    };
  }

  return { message: String(error) };
};

export async function POST(request: Request) {
  const startedAt = Date.now();

  console.info("[service-requests] POST started.", {
    nodeEnv: process.env.NODE_ENV,
    supabaseConfigured: isServerSupabaseConfigured,
  });

  if (!isServerSupabaseConfigured) {
    console.error("[service-requests] Supabase server configuration is missing.");
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 500 },
    );
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    console.warn("[service-requests] Authentication failed.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = serviceRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    console.warn("[service-requests] Request validation failed.", {
      issues: parsed.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join("."),
      })),
    });
    return NextResponse.json(
      {
        error: parsed.error.issues
          .map((issue) => issue.message)
          .join(" "),
      },
      { status: 400 },
    );
  }

  const service = getServiceById(parsed.data.serviceTierId);

  if (!service) {
    console.warn("[service-requests] Service tier lookup failed.", {
      serviceTierId: parsed.data.serviceTierId,
    });
    return NextResponse.json(
      { error: "Invalid service tier." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const customerError = await upsertCustomerForUser(supabase, user);

  if (customerError) {
    console.error("[service-requests] Customer upsert failed.", {
      message: customerError.message,
    });
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  const { data: requestRow, error } = await supabase
    .from("ServiceRequest")
    .insert({
      client_id: user.id,
      service_tier_id: service.id,
      title: parsed.data.title || null,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "open",
      admin_comment: null,
      completed_at: null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[service-requests] Database insert failed.", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("[service-requests] Request saved to Supabase.", {
    requestId: requestRow.id,
    serviceTierId: service.id,
    priority: requestRow.priority,
    elapsedMs: Date.now() - startedAt,
  });

  const emailConfigResult = getEmailJsConfig();
  let emailSent = false;

  if (emailConfigResult.configured) {
    const { config: emailConfig } = emailConfigResult;
    const emailStartedAt = Date.now();
    const customerName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Customer";
    const requestTime = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date(requestRow.created_at));
    const message = [
      `Service: ${service.title}`,
      `Priority: ${requestRow.priority}`,
      "",
      requestRow.description,
    ].join("\n");

    console.info("[service-requests] Sending EmailJS notification.", {
      requestId: requestRow.id,
      serviceId: emailConfig.serviceId,
      templateId: emailConfig.templateId,
      hasPrivateKey: Boolean(emailConfig.privateKey),
    });

    try {
      const emailResponse = await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        {
          title: requestRow.title ?? "New service request",
          name: customerName,
          email: user.email ?? "",
          time: requestTime,
          message,
        },
        {
          publicKey: emailConfig.publicKey,
          privateKey: emailConfig.privateKey,
        },
      );
      emailSent = true;

      console.info("[service-requests] EmailJS notification accepted.", {
        requestId: requestRow.id,
        status: emailResponse.status,
        text: emailResponse.text,
        elapsedMs: Date.now() - emailStartedAt,
      });
    } catch (emailError) {
      console.error("[service-requests] EmailJS notification failed.", {
        requestId: requestRow.id,
        elapsedMs: Date.now() - emailStartedAt,
        error: getEmailErrorDetails(emailError),
      });
    }
  } else {
    console.warn("[service-requests] EmailJS notification skipped.", {
      requestId: requestRow.id,
      missingVariables: emailConfigResult.missingVariables,
      hasPrivateKey: emailConfigResult.hasPrivateKey,
    });
  }

  console.info("[service-requests] POST completed.", {
    requestId: requestRow.id,
    emailSent,
    elapsedMs: Date.now() - startedAt,
  });

  return NextResponse.json({ serviceRequest: requestRow, emailSent });
}
