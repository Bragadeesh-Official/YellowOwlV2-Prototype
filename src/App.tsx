import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ADMIN_SESSION_KEY } from '@/mock/adminData';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifySecretPage from '@/pages/VerifySecretPage';
import ImagePasswordPage from '@/pages/ImagePasswordPage';
import InterestsPage from '@/pages/InterestsPage';
import WarmupPage from '@/pages/WarmupPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import SkillsPage from '@/pages/SkillsPage';
import WeeklyAssessmentPage from '@/pages/WeeklyAssessmentPage';
import ParentPage from '@/pages/ParentPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = localStorage.getItem(ADMIN_SESSION_KEY) === 'active';
  return isAdmin ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-secret" element={<VerifySecretPage />} />
        <Route path="/setup-password" element={<ImagePasswordPage />} />
        <Route path="/image-password" element={<ImagePasswordPage />} />
        <Route path="/interests" element={<InterestsPage />} />
        <Route path="/warmup" element={<WarmupPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillsPage /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><WeeklyAssessmentPage /></ProtectedRoute>} />
        <Route path="/parent" element={<ProtectedRoute><ParentPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
