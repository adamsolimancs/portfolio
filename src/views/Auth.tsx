"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

const inputClassName =
  "h-14 rounded-full border-border bg-white px-6 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0";

const GoogleLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

const Auth = ({ mode }: { mode: AuthMode }) => {
  const { configured, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [authLoading, redirectTo, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Add your Supabase URL and anon key before signing in.");
      return;
    }

    setSubmitting(true);

    const authRedirectTo = `${window.location.origin}/dashboard`;
    const { data, error: authError } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { customer_signup: true, full_name: fullName },
            emailRedirectTo: authRedirectTo,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      router.replace(redirectTo);
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Add your Supabase URL and anon key before using Google sign in.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col justify-center">
        <Link
          href="/"
          className="mb-12 w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Adam Soliman
        </Link>

        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-caption">
              {isSignUp ? "Create your dashboard access" : "Welcome back"}
            </p>
            <h1 className="text-heading">
              {isSignUp ? "Sign up" : "Sign in"}
            </h1>
            <p className="text-body max-w-lg">
              Minimal access for your client dashboard.
            </p>
          </div>

          {!configured && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              Supabase is scaffolded. Add `NEXT_PUBLIC_SUPABASE_URL` and
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env` to enable
              authentication.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                className={inputClassName}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full name"
                autoComplete="name"
              />
            )}
            <Input
              className={inputClassName}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              required
            />
            <Input
              className={inputClassName}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <Button
              type="submit"
              className="h-14 w-full rounded-full text-base"
              disabled={!configured || submitting}
            >
              {submitting && <Loader2 className="animate-spin" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            className="h-14 w-full rounded-full bg-white text-base"
            onClick={handleGoogleSignIn}
            disabled={!configured || submitting}
          >
            <GoogleLogo />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={`${isSignUp ? "/sign-in" : "/sign-up"}?redirect=${encodeURIComponent(redirectTo)}`}
              className="font-medium text-primary"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Auth;
