import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — Route wrapper that enforces authentication.
 *
 * HOW IT WORKS (viva explanation):
 * 1. Checks AuthContext to see if user is authenticated.
 * 2. While checking stored JWT on initial app mount (loading = true),
 *    shows a friendly loading spinner to prevent UI flickering.
 * 3. If no user is logged in, redirects to /login using React Router <Navigate />.
 * 4. If logged in, renders the nested child routes via <Outlet />.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: '#F8FAFC',
          color: '#1D4ED8',
        }}
      >
        <Loader2 size={36} className="spinner" />
        <p style={{ color: '#64748B', fontWeight: 500 }}>
          Authenticating your session...
        </p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
