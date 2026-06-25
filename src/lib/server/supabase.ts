import "server-only";

import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY?.trim();

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseServiceKey,
);

export const createSupabaseAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const createSupabaseAuthClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase auth credentials are not configured.");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
};

export const getAuthenticatedUser = async (
  request: Request,
): Promise<User | null> => {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    return null;
  }

  return data.user;
};

const metadataValue = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const upsertCustomerForUser = async (
  supabase: SupabaseClient<Database>,
  user: Pick<User, "id" | "email" | "user_metadata" | "app_metadata">,
) => {
  const { error } = await supabase.from("Customer").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name:
        metadataValue(user.user_metadata?.full_name) ??
        metadataValue(user.user_metadata?.name),
      avatar_url:
        metadataValue(user.user_metadata?.avatar_url) ??
        metadataValue(user.user_metadata?.picture),
      provider: metadataValue(user.app_metadata?.provider),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  return error;
};
