import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppLayout, StatusBadge, formatDateTime } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import type { Cita, Medicamento, PerfilCompleto, PuntoDistribucion } from '../types';

const NAV = [
  { id: 'buscar', label: 'Buscar Paciente', icon: '🔍' },
  { id: 'historial', label: 'Historial Clínico', icon: '📋' },
  { id: 'receta', label: 'Prescripción', icon: '💊' },
  { id: 'calendario', label: 'Mi Calendario', icon: '📅' },
];

export function DoctorPanel() {
  const { user } = useAuth();
  const { handleApiError, showToast } = useAlert();
  const [tab, setTab] = useState('buscar');
  const [documento, setDocumento] = useState('');
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [puntos, setPuntos] = useState<PuntoDistribucion[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<number | ''>('');
  const [medicamentoId, setMedicamentoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState(1);
  const [puntoId, setPuntoId] = useState<number | ''>('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getCitasMedico(user.id).then(setCitas),
      api.getMedicamentos().then(setMedicamentos),
      api.getPuntos().then(setPuntos),
    ]).catch(handleApiError);
  }, [user]);

  async function buscarPaciente() {
    try {
      const paciente = await api.buscarPaciente(documento);
      const perfilData = await api.getPerfilCompleto(paciente.id);
      setPerfil(perfilData);
      setTab('historial');
      showToast('Paciente encontrado', 'success');
    } catch {
      showToast('No se encontró paciente con ese documento', 'error');
      setPerfil(null);
    }
  }

  async function recetar() {
    if (!citaSeleccionada || !medicamentoId) return;
    const params = new URLSearchParams({
      medicamentoId: String(medicamentoId),
      cantidadRecetada: String(cantidad),
    });
    if (puntoId) params.set('puntoDistribucionId', String(puntoId));
    try {
      await api.recetar(Number(citaSeleccionada), params);
      showToast('Receta emitida y entrega agendada', 'success');
      if (user) {
        const updated = await api.getCitasMedico(user.id);
        setCitas(updated);
      }
    } catch (err) {
      handleApiError(err);
    }
  }

  const pm = perfil?.perfilMedico;
  const citasPendientes = citas.filter((c) => c.estado === 'PENDIENTE');
  const puntosFiltrados = puntos.filter((p) => p.medicamento?.id === Number(medicamentoId));

  return (
    <AppLayout
      title="Panel del Médico"
      subtitle="Consulta clínica y prescripción"
      navItems={NAV}
      activeTab={tab}
      onTabChange={setTab}
      variant="clinical"
    >
      {tab === 'buscar' && (
        <section className="card" style={{ maxWidth: 520 }}>
          <h3 className="card-title">🔍 Buscar paciente por documento</h3>
          <div className="field" style={{ marginBottom: '1rem' }}>
            <label>Número de documento</label>
            <input
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej: 1020304050"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={buscarPaciente}>
            Buscar paciente
          </button>
        </section>
      )}

      {tab === 'historial' && (
        perfil ? (
          <div className="grid-2">
            <section className="card">
              <h3 className="card-title">👤 {perfil.nombres} {perfil.apellidos}</h3>
              <div className="grid-2">
                <Info label="Documento" value={`${perfil.tipoDocumento} ${perfil.numeroDocumento}`} />
                <Info label="Contacto" value={`${perfil.telefono} · ${perfil.correo}`} />
                <Info label="Dirección" value={`${perfil.direccionResidencia}, ${perfil.barrio}`} />
                <Info label="Estrato" value={String(perfil.estrato)} />
              </div>
            </section>
            <section className="card vital-card">
              <h3 className="card-title" style={{ color: 'white' }}>Signos vitales y antecedentes</h3>
              {pm ? (
                <>
                  <div className="stat-grid">
                    <div className="stat-box"><strong>{pm.peso ?? '—'}</strong><span>Peso (kg)</span></div>
                    <div className="stat-box"><strong>{pm.estatura ?? '—'}</strong><span>Estatura (cm)</span></div>
                    <div className="stat-box"><strong>{pm.imc ?? '—'}</strong><span>IMC</span></div>
                    <div className="stat-box"><strong>{pm.presionArterial ?? '—'}</strong><span>P. Arterial</span></div>
                  </div>
                  <Info label="Alergias" value={pm.alergias || 'Ninguna'} light />
                  <Info label="Antecedentes patológicos" value={pm.antecedentesPatologicos || '—'} light />
                  <Info label="Medicamentos actuales" value={pm.antecedentesFarmacologicos || '—'} light />
                </>
              ) : (
                <p style={{ opacity: 0.8 }}>Sin perfil médico registrado.</p>
              )}
            </section>
          </div>
        ) : (
          <div className="card empty-state">Busque un paciente para ver su historial clínico</div>
        )
      )}

      {tab === 'receta' && (
        <section className="card" style={{ maxWidth: 640 }}>
          <h3 className="card-title">💊 Formulario de prescripción</h3>
          <div className="grid-2">
            <div className="field">
              <label>Cita pendiente</label>
              <select value={citaSeleccionada} onChange={(e) => setCitaSeleccionada(Number(e.target.value))}>
                <option value="">Seleccione...</option>
                {citasPendientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatDateTime(c.fechaHora)} — {c.paciente?.nombres} {c.paciente?.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Medicamento</label>
              <select value={medicamentoId} onChange={(e) => setMedicamentoId(Number(e.target.value))}>
                <option value="">Seleccione...</option>
                {medicamentos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.laboratorio}) — Stock: {m.stock}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Cantidad recetada</label>
              <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Punto de distribución</label>
              <select value={puntoId} onChange={(e) => setPuntoId(Number(e.target.value))}>
                <option value="">Automático (con stock)</option>
                {puntosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreLugar} — Stock local: {p.stockDisponible} — {p.cantidadVentanillas} ventanillas
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={recetar}>
            Emitir receta y agendar entrega
          </button>
        </section>
      )}

      {tab === 'calendario' && (
        <section className="card">
          <h3 className="card-title">📅 Citas agendadas</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">Sin citas agendadas</td></tr>
                ) : (
                  citas.map((cita) => (
                    <tr key={cita.id}>
                      <td>{formatDateTime(cita.fechaHora)}</td>
                      <td>{cita.paciente?.nombres} {cita.paciente?.apellidos}</td>
                      <td>{cita.motivo}</td>
                      <td><StatusBadge estado={cita.estado} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppLayout>
  );
}

function Info({ label, value, light }: { label: string; value: string; light?: boolean }) {
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{ fontSize: '0.75rem', color: light ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}
