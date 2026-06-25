import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const { user } = useAuth();
  const customerLabel =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Adam Soliman
            </Link>
            <h1 className="mt-6 text-heading">Dashboard</h1>
            <p className="mt-3 text-body">
              You are signed in{customerLabel ? ` as ${customerLabel}` : ""}.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-full px-6"
            onClick={handleSignOut}
          >
            <LogOut />
            Sign out
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {["Project status", "Next steps", "Messages"].map((item) => (
            <article key={item} className="card-minimal">
              <p className="text-caption">{item}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Connected to your Customer account scaffold. Add Supabase keys
                and project data when ready.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
