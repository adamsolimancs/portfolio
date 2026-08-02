import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "@/views/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
