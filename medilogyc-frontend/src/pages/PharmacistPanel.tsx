import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppLayout, StatusBadge, formatDateTime } from '../components/AppLayout';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import type { Entrega, InventarioSede } from '../types';

const NAV = [
  { id: 'despacho', label: 'Despacho', icon: '🏪' },
  { id: 'inventario', label: 'Medicamentos', icon: '💊' },
];

export function PharmacistPanel() {
  const { user } = useAuth();
  const { handleApiError, showToast } = useAlert();
  const [tab, setTab] = useState('despacho');
  const [cedula, setCedula] = useState('');
  const [codigo, setCodigo] = useState('');
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [inventario, setInventario] = useState<InventarioSede[]>([]);
  const [stockDisponible, setStockDisponible] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.sedeId) return;
    api.getInventarioSede(user.sedeId).then(setInventario).catch(handleApiError);
  }, [user?.sedeId]);

  async function buscarOrden() {
    const params = new URLSearchParams();
    if (codigo) params.set('codigo', codigo);
    else if (cedula) params.set('cedula', cedula);
    else {
      showToast('Ingrese cédula o código de entrega', 'warning');
      return;
    }
    try {
      const result = await api.buscarEntrega(params);
      const found = Array.isArray(result) ? result[0] : result;
      setEntrega(found ?? null);
      setStockDisponible(null);
      if (found && user?.sedeId) {
        api.consultarStockEntrega(found.id, user.sedeId)
          .then((r) => setStockDisponible(r.disponible))
          .catch(() => setStockDisponible(false));
      }
      if (!found) showToast('No se encontró orden', 'error');
    } catch {
      showToast('Orden no encontrada', 'error');
      setEntrega(null);
    }
  }

  async function confirmarEntrega(llegoAHora: boolean) {
    if (!entrega || !user?.sedeId) return;
    if (llegoAHora && stockDisponible === false) {
      showToast('Stock insuficiente en sede. No se puede confirmar la entrega.', 'error');
      return;
    }
    try {
      const msg = await api.procesarEntrega(entrega.id, llegoAHora, user.sedeId);
      showToast(typeof msg === 'string' ? msg : 'Entrega procesada', llegoAHora ? 'success' : 'warning');
      setEntrega(null);
      setCedula('');
      setCodigo('');
    } catch (err) {
      handleApiError(err);
    }
  }

  const med = entrega?.cita?.medicamento;

  return (
    <AppLayout
      title="Panel del Farmacéutico"
      subtitle="Operación de taquilla — Cero Filas"
      navItems={NAV}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'despacho' && (
        <div className="grid-2">
          <section className="card">
            <h3 className="card-title">🔍 Buscar orden de entrega</h3>
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label>Cédula del paciente</label>
              <input value={cedula} onChange={(e) => { setCedula(e.target.value); setCodigo(''); }} placeholder="1020304050" />
            </div>
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label>Código de entrega</label>
              <input value={codigo} onChange={(e) => { setCodigo(e.target.value); setCedula(''); }} placeholder="ID de entrega" />
            </div>
            <button type="button" className="btn btn-secondary" onClick={buscarOrden}>
              Buscar orden
            </button>
          </section>

          {entrega ? (
            <section className="card delivery-card estado-AGENDADA">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ marginBottom: 0 }}>📦 Pantalla de despacho</h3>
                <StatusBadge estado={entrega.estado} />
              </div>
              <div className="grid-2" style={{ marginTop: '1rem' }}>
                <Info label="Paciente" value={`${entrega.cita?.paciente?.nombres ?? ''} ${entrega.cita?.paciente?.apellidos ?? ''}`} />
                <Info label="Documento" value={entrega.cita?.paciente?.numeroDocumento ?? '—'} />
                <Info label="Medicamento" value={med?.nombre ?? '—'} />
                <Info label="Cantidad" value={String(entrega.cita?.cantidadRecetada ?? '—')} />
                <Info label="Lote" value={med?.lote ?? '—'} />
                <Info label="Vencimiento" value={med?.fechaVencimiento ?? '—'} />
                <Info label="INVIMA" value={med?.registroInvima ?? '—'} />
                <Info label="Ventanilla asignada" value={`#${entrega.ventanillaAsignada}`} />
                <Info label="Bloque de recogida" value={formatDateTime(entrega.fechaHoraEntrega)} />
                <Info label="Punto" value={entrega.puntoDistribucion?.nombreLugar ?? '—'} />
              </div>
              {stockDisponible === false && (
                <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
                  Stock insuficiente en inventario de sede. Asigne stock en administración antes de confirmar.
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={stockDisponible === false}
                  onClick={() => confirmarEntrega(true)}
                >
                  ✓ Confirmar entrega física
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => confirmarEntrega(false)}>
                  Paciente llegó tarde (Rezagado)
                </button>
              </div>
            </section>
          ) : (
            <section className="card empty-state">
              Busque una orden para ver el detalle de despacho
            </section>
          )}
        </div>
      )}

      {tab === 'inventario' && (
        <section className="card">
          <h3 className="card-title">💊 Inventario de su punto</h3>
          {!user?.sedeId ? (
            <p className="empty-state">No tiene sede asignada. Contacte al administrador.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Laboratorio</th>
                    <th>Stock local</th>
                    <th>INVIMA</th>
                    <th>Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.medicamento?.nombre}</strong><br /><small>{row.medicamento?.cantidadPorUnidad}</small></td>
                      <td>{row.medicamento?.laboratorio}</td>
                      <td>{row.stockLocal}</td>
                      <td>{row.medicamento?.registroInvima ?? '—'}</td>
                      <td>{row.medicamento?.lote ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
