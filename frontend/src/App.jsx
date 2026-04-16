import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import AdminPage      from './pages/AdminPage';
import QRViewPage     from './pages/QRViewPage';
import Layout         from './components/Layout';

function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex',justifyContent:'center',alignItems:'center',height:'100vh' }}><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RootIndex() {
  const [params] = useSearchParams();
  // Check both router params and raw window.location as fallback
  const data = params.get('data') || new URLSearchParams(window.location.search).get('data');
  if (data) return <QRViewPage />;

  return (
    <Protected>
      <Layout />
    </Protected>
  );
}

export default function App() {
  const { user } = useAuth();

  // Top-level check: if ?data= is in the URL on any route, show QR immediately
  const hasData = new URLSearchParams(window.location.search).get('data');
  if (hasData) return <QRViewPage />;

  return (
    <Routes>
      <Route path="/qr" element={<QRViewPage />} />
      <Route path="/login"    element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<RootIndex />}>
        <Route index element={<DashboardPage />} />
        <Route path="admin" element={<Protected adminOnly><AdminPage /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
