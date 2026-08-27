// src/components/routing/ProtectedRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Spinner from '../ui/Spinner/Spinner';

const ProtectedRoute = ({ roles = [] }) => {
  const location = useLocation();
  const { user, role, token, authStatus } = useSelector((s) => s.auth);

  if (token && authStatus === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not logged in
  if (!token && !user)
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;

  // Role check
  if (roles.length > 0 && !roles.includes(role))
    return <Navigate to={ROUTES.HOME} replace />;

  return <Outlet />;
};

export default ProtectedRoute;