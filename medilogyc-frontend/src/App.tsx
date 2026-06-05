import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { ToastContainer, MedicalBlockOverlay, CompatibilityModal } from './components/AlertSystem';
import { LoginPage } from './pages/LoginPage';
import { PatientPanel } from './pages/PatientPanel';
import { DoctorPanel } from './pages/DoctorPanel';
import { PharmacistPanel } from './pages/PharmacistPanel';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminNuevoPaciente } from './pages/admin/AdminNuevoPaciente';
import { AdminNuevoMedico } from './pages/admin/AdminNuevoMedico';
import { AdminNuevoFarmaceutico } from './pages/admin/AdminNuevoFarmaceutico';
import { AdminUsuarios } from './pages/admin/AdminUsuarios';
import { AdminInventario } from './pages/admin/AdminInventario';
import type { Rol } from './types';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: Rol }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol !== role) return <Navigate to={rolePath(user.rol)} replace />;
  return <>{children}</>;
}

function rolePath(rol: Rol): string {
  const map: Record<Rol, string> = {
    PACIENTE: '/paciente',
    MEDICO: '/medico',
    FARMACEUTICO: '/farmaceutico',
    ADMIN: '/admin',
  };
  return map[rol];
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={rolePath(user.rol)} replace />;
}

export default function App() {
  return (
    <AlertProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/paciente" element={<ProtectedRoute role="PACIENTE"><PatientPanel /></ProtectedRoute>} />
        <Route path="/medico" element={<ProtectedRoute role="MEDICO"><DoctorPanel /></ProtectedRoute>} />
        <Route path="/farmaceutico" element={<ProtectedRoute role="FARMACEUTICO"><PharmacistPanel /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="nuevo-paciente" element={<AdminNuevoPaciente />} />
          <Route path="nuevo-medico" element={<AdminNuevoMedico />} />
          <Route path="nuevo-farmaceutico" element={<AdminNuevoFarmaceutico />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="medicamentos" element={<AdminInventario />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
      <MedicalBlockOverlay />
      <CompatibilityModal />
    </AlertProvider>
  );
}
