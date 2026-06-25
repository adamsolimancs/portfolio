import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
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
