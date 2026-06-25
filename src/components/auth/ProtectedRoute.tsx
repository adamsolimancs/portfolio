import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/useAuth";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { configured, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-caption">Checking your session...</p>
      </div>
    );
  }

  if (!configured || !user) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
