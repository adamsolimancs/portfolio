import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "@/views/Dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
