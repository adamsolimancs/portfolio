import { createClient, type Session } from "@supabase/supabase-js";

export type Customer = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
};

type Database = {
  public: {
    Tables: {
      Customer: {
        Row: Customer;
        Insert: Omit<Customer, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Customer, "id" | "created_at">>;
      };
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export const upsertCustomerFromSession = async (session: Session | null) => {
  if (!supabase || !session?.user) {
    return;
  }

  const { user } = session;
  const metadata = user.user_metadata ?? {};
  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : "email";

  const { error } = await supabase.from("Customer").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name:
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
            : null,
      avatar_url:
        typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      provider,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.warn("Customer upsert failed", error.message);
  }
};
