import { createClient } from "@supabase/supabase-js";

export type Customer = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  user_id: string;
  created_at: string;
};

export type CustomerBilling = {
  customer_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_product_name: string | null;
  subscription_status: string;
  monthly_rate_cents: number | null;
  subscription_started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceRequest = {
  id: string;
  client_id: string;
  service_tier_id: string;
  title: string | null;
  description: string;
  priority: string;
  status: string;
  completed_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      Customer: {
        Row: Customer;
        Insert: Omit<Customer, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Customer, "id" | "created_at">>;
        Relationships: [];
      };
      AdminUser: {
        Row: AdminUser;
        Insert: Omit<AdminUser, "created_at"> & {
          created_at?: string;
        };
        Update: Partial<AdminUser>;
        Relationships: [];
      };
      CustomerBilling: {
        Row: CustomerBilling;
        Insert: Omit<
          CustomerBilling,
          | "stripe_subscription_id"
          | "stripe_price_id"
          | "stripe_product_name"
          | "monthly_rate_cents"
          | "subscription_started_at"
          | "current_period_start"
          | "current_period_end"
          | "cancel_at_period_end"
          | "created_at"
          | "updated_at"
        > & {
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_product_name?: string | null;
          monthly_rate_cents?: number | null;
          subscription_started_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CustomerBilling, "customer_id" | "created_at">>;
        Relationships: [];
      };
      ServiceRequest: {
        Row: ServiceRequest;
        Insert: Omit<ServiceRequest, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ServiceRequest, "id" | "client_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

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
