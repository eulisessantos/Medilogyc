import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, parseApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import type { Rol } from '../types';

const roleRoutes: Record<Rol, string> = {
  PACIENTE: '/paciente',
  MEDICO: '/medico',
  FARMACEUTICO: '/farmaceutico',
  ADMIN: '/admin',
};

export function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useAlert();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await api.login(correo, password);
      login(user);
      showToast(`Bienvenido, ${user.nombres}`, 'success');
      navigate(roleRoutes[user.rol]);
    } catch (err) {
      const apiError = err as ReturnType<typeof parseApiError>;
      showToast(apiError.message ?? 'Credenciales inválidas', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <img src="/logo.png" alt="Medilogyc Robot" />
        <h1>Medilogyc</h1>
        <p>
          Plataforma empresarial de gestión clínica y logística de medicamentos.
          Autogestión sin filas, con la confianza del sector salud.
        </p>
      </section>
      <section className="login-form-panel">
        <form className="login-form card" onSubmit={handleSubmit}>
          <div>
            <h2>Iniciar sesión</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Acceda con su correo institucional
            </p>
          </div>
          <div className="field">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@medilogyc.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar al sistema'}
          </button>
        </form>
      </section>
    </div>
  );
}
