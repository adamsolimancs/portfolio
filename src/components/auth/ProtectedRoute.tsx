"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { configured, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!configured || !user)) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [configured, loading, pathname, router, user]);

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
