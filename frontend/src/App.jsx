import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MotherPrenatalDashboard from './pages/mother/PrenatalDashboard';
import MotherPostnatalDashboard from './pages/mother/PostnatalDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-maatri-bg">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-lavender border-t-transparent animate-spin" />
        <p className="text-lavender font-body">Loading Sheon...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'mother') return <Navigate to="/mother/dashboard" replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  if (user.role === 'nurse') return <Navigate to="/nurse/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1C1335', color: '#fff', border: '1px solid rgba(200,162,255,0.2)' }
        }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          
          <Route path="/mother/dashboard" element={<ProtectedRoute roles={['mother']}>
            <MotherPrenatalDashboard />
          </ProtectedRoute>} />
          <Route path="/mother/postnatal" element={<ProtectedRoute roles={['mother']}>
            <MotherPostnatalDashboard />
          </ProtectedRoute>} />
          
          <Route path="/doctor/dashboard" element={<ProtectedRoute roles={['doctor', 'admin']}>
            <DoctorDashboard />
          </ProtectedRoute>} />
          
          <Route path="/nurse/dashboard" element={<ProtectedRoute roles={['nurse']}>
            <NurseDashboard />
          </ProtectedRoute>} />
          
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>} />

          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center bg-maatri-bg text-white">
              <div className="text-center">
                <h1 className="text-4xl font-display text-coral mb-4">Access Denied</h1>
                <p className="text-white/60">You don't have permission to view this page.</p>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
