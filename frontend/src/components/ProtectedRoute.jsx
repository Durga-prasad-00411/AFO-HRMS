import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");

  // Normalize role safely
  const role = storedRole
    ? storedRole.replace(/_/g, "").trim().toUpperCase()
    : null;

  const normalizedAllowedRoles = allowedRoles.map((r) =>
    r.replace(/_/g, "").trim().toUpperCase()
  );

  // 🚨 If no token → go to login
  if (!token) {
    console.log("No token found → Redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🚨 If role mismatch
  if (
    normalizedAllowedRoles.length > 0 &&
    (!role || !normalizedAllowedRoles.includes(role))
  ) {
    console.log("Role mismatch → Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;