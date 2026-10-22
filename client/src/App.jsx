import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentProfilePage from './pages/StudentProfilePage';
import AlumniDirectoryPage from './pages/AlumniDirectoryPage';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * App.jsx — Root component that sets up routing & global AuthContext.
 *
 * ROUTING STRUCTURE:
 * - Public routes:
 *   - /         -> LandingPage
 *   - /login    -> LoginPage
 *   - /register -> RegisterPage
 * - Protected routes (require valid JWT login via ProtectedRoute):
 *   - /dashboard -> DashboardPage (Overview & Quick Actions)
 *   - /profile   -> StudentProfilePage (View & Edit Profile)
 *   - /alumni    -> AlumniDirectoryPage (Search, Filter & Connect)
 * - Fallback:
 *   - *         -> Redirects to /
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes (require valid JWT login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/alumni" element={<AlumniDirectoryPage />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
