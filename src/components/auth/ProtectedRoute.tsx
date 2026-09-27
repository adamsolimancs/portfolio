"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { configured, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(false);

  const demoEnabled =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_DASHBOARD_DEMO === "true";

  useEffect(() => {
    const requestedDemo =
      new URLSearchParams(window.location.search).get("demo") === "subscription";
    if (requestedDemo && demoEnabled) {
      setDemoMode(true);
      return;
    }

    if (!loading && (!configured || !user)) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [configured, demoEnabled, loading, pathname, router, user]);

  if (demoMode) return children;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-caption">Checking your session...</p>
      </div>
    );
  }

  if (!configured || !user) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
