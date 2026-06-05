import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import type { MetricasReporte } from '../../types';

export function AdminDashboard() {
  const { handleApiError } = useAlert();
  const [metricas, setMetricas] = useState<MetricasReporte | null>(null);

  useEffect(() => {
    api.getMetricas().then(setMetricas).catch(handleApiError);
  }, []);

  return (
    <div>
      <section className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-box">
          <strong>{metricas?.citasTotales ?? '—'}</strong>
          <span>Citas totales</span>
        </div>
        <div className="card stat-box">
          <strong>{metricas?.citasPendientes ?? '—'}</strong>
          <span>Citas pendientes</span>
        </div>
        <div className="card stat-box">
          <strong>{metricas?.citasCompletadas ?? '—'}</strong>
          <span>Citas completadas</span>
        </div>
        <div className="card stat-box">
          <strong>{metricas?.entregasTotales ?? '—'}</strong>
          <span>Entregas totales</span>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h3 className="card-title">Accesos rápidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/admin/nuevo-paciente" className="btn btn-secondary">Registrar paciente</Link>
            <Link to="/admin/nuevo-medico" className="btn btn-secondary">Registrar médico</Link>
            <Link to="/admin/nuevo-farmaceutico" className="btn btn-secondary">Registrar farmacéutico</Link>
            <Link to="/admin/medicamentos" className="btn btn-ghost">Gestionar inventario</Link>
          </div>
        </section>
        <section className="card">
          <h3 className="card-title">Medicamentos más recetados</h3>
          {(metricas?.medicamentosMasUsados ?? []).length === 0 ? (
            <p className="empty-state">Sin datos de recetas aún</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {metricas?.medicamentosMasUsados.map((m, i) => (
                <li key={m.medicamento} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--silver-light)' }}>
                  <strong>{i + 1}. {m.medicamento}</strong>
                  <span style={{ float: 'right', color: 'var(--text-muted)' }}>{m.totalRecetas} recetas</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
