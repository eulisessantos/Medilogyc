import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  navItems: { id: string; label: string; icon: string; disabled?: boolean }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
  variant?: 'default' | 'clinical';
}

export function AppLayout({
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  children,
  variant = 'default',
}: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${variant === 'clinical' ? 'clinical-sidebar' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Medilogyc" />
          <div>
            <span>Medilogyc</span>
            <small>Cero Filas</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && onTabChange(item.id)}
              disabled={item.disabled}
              title={item.disabled ? 'Complete su perfil médico para habilitar' : undefined}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.disabled && <small style={{ marginLeft: 'auto', opacity: 0.6 }}>🔒</small>}
            </button>
          ))}
        </nav>
        <button type="button" className="nav-item" style={{ marginTop: 'auto' }} onClick={logout}>
          <span>🚪</span> Cerrar sesión
        </button>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
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
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ estado }: { estado: string }) {
  const key = estado.toUpperCase();
  return <span className={`badge badge-${key.toLowerCase()}`}>{estado}</span>;
}

export function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
