import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/useAuth";
import { supabase, upsertCustomerFromSession } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const inputClassName =
  "h-14 rounded-full border-border bg-white px-6 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0";

const Auth = ({ mode }: { mode: AuthMode }) => {
  const { configured, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [authLoading, from, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Add your Supabase URL and anon key before signing in.");
      return;
    }

    setSubmitting(true);

    const redirectTo = `${window.location.origin}/dashboard`;
    const { data, error: authError } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: redirectTo,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      await upsertCustomerFromSession(data.session);
      navigate(from, { replace: true });
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
          to="/"
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
              Supabase is scaffolded. Add `VITE_SUPABASE_URL` and
              `VITE_SUPABASE_ANON_KEY` to `.env` to enable authentication.
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
            <Chrome />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              to={isSignUp ? "/sign-in" : "/sign-up"}
              className="font-medium text-primary"
              state={{ from: { pathname: from } }}
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
