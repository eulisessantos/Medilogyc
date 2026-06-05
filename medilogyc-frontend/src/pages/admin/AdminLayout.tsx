import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Inicio', icon: '🏠', end: true },
  { to: '/admin/nuevo-paciente', label: 'Nuevo paciente', icon: '🧑' },
  { to: '/admin/nuevo-medico', label: 'Nuevo médico', icon: '👨‍⚕️' },
  { to: '/admin/nuevo-farmaceutico', label: 'Nuevo farmacéutico', icon: '💊' },
  { to: '/admin/medicamentos', label: 'Inventario', icon: '📦' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Medilogyc" />
          <div>
            <span>Medilogyc</span>
            <small>Administración</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="nav-item" style={{ marginTop: 'auto' }} onClick={logout}>
          <span>🚪</span> Cerrar sesión
        </button>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1>Panel Administrador</h1>
            <p>Gestión central del sistema Medilogyc</p>
          </div>
          {user && (
            <div className="user-chip">
              <div>
                <strong>{user.nombres} {user.apellidos}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.rol}</div>
              </div>
              <div className="avatar">{user.nombres.charAt(0)}{user.apellidos.charAt(0)}</div>
            </div>
          )}
        </header>
        <Outlet />
      </main>
    </div>
  );
}
