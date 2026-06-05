import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { AppLayout, StatusBadge, formatDateTime } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import type { Cita, Entrega, PerfilCompleto, PerfilMedico, TimeSlot, Usuario } from '../types';

const NAV_BASE = [
  { id: 'perfil', label: 'Mi Perfil', icon: '👤' },
  { id: 'citas', label: 'Agenda de Citas', icon: '📅' },
  { id: 'entregas', label: 'Mis Entregas', icon: '💊' },
];

const emptyPerfilMedico: PerfilMedico = {
  eps: '',
  regimen: '',
  alergias: '',
  antecedentesPatologicos: '',
  antecedentesFarmacologicos: '',
  peso: undefined,
  estatura: undefined,
  tipoSangre: '',
};

function perfilCompleto(pm: PerfilMedico | null | undefined): boolean {
  return Boolean(pm?.eps?.trim() && pm?.regimen?.trim());
}

export function PatientPanel() {
  const { user } = useAuth();
  const { handleApiError, showToast } = useAlert();
  const [tab, setTab] = useState('perfil');
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [medicos, setMedicos] = useState<Usuario[]>([]);
  const [medicoId, setMedicoId] = useState<number | ''>('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [perfilForm, setPerfilForm] = useState<PerfilMedico>({ ...emptyPerfilMedico });
  const [usuarioForm, setUsuarioForm] = useState({ estrato: 3, barrio: '', direccionResidencia: '' });

  const tienePerfil = perfilCompleto(perfil?.perfilMedico as PerfilMedico | null | undefined);

  const navItems = useMemo(
    () =>
      NAV_BASE.map((item) => ({
        ...item,
        disabled: !tienePerfil && item.id !== 'perfil',
      })),
    [tienePerfil],
  );

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const [perfilData, medicosData, entregasData] = await Promise.all([
        api.getPerfilCompleto(user.id),
        api.getMedicos(),
        api.getEntregasPaciente(user.id),
      ]);
      setPerfil(perfilData);
      setMedicos(medicosData);
      setEntregas(entregasData);
      if (medicosData.length > 0) setMedicoId(medicosData[0].id);
      const pm = perfilData.perfilMedico as PerfilMedico | null | undefined;
      if (pm) {
        setPerfilForm({ ...emptyPerfilMedico, ...pm });
      }
      setUsuarioForm({
        estrato: perfilData.estrato,
        barrio: perfilData.barrio,
        direccionResidencia: perfilData.direccionResidencia,
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!medicoId || tab !== 'citas' || !tienePerfil) return;
    api.getDisponibilidad(Number(medicoId), fecha, user?.id)
      .then((res) => setSlots(res.bloques))
      .catch(handleApiError);
  }, [medicoId, fecha, tab, tienePerfil, user?.id]);

  async function guardarAutoregistro(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const u = await api.getUsuario(user.id);
      await api.actualizarUsuario(user.id, {
        ...u,
        estrato: usuarioForm.estrato,
        barrio: usuarioForm.barrio,
        direccionResidencia: usuarioForm.direccionResidencia,
      });
      await api.crearPerfilMedico(user.id, perfilForm);
      showToast('Perfil médico registrado. Ya puede agendar citas.', 'success');
      setEditing(false);
      loadData();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function guardarEdicion() {
    if (!user || !perfil) return;
    try {
      const u = await api.getUsuario(user.id);
      await api.actualizarUsuario(user.id, {
        ...u,
        estrato: usuarioForm.estrato,
        barrio: usuarioForm.barrio,
        direccionResidencia: usuarioForm.direccionResidencia,
      });
      await api.actualizarPerfilMedico(user.id, perfilForm);
      showToast('Perfil actualizado', 'success');
      setEditing(false);
      loadData();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function agendarCita() {
    if (!user || !selectedSlot || !medicoId) return;
    try {
      await api.agendarCita(user.id, {
        fechaHora: selectedSlot,
        motivo,
        medico: { id: Number(medicoId) },
      });
      showToast('Cita agendada correctamente', 'success');
      setMotivo('');
      setSelectedSlot(null);
      loadData();
    } catch (err) {
      handleApiError(err);
    }
  }

  const pm = perfil?.perfilMedico as PerfilMedico | undefined;
  const fechasDisponibles = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <AppLayout
      title="Panel del Paciente"
      subtitle="Autogestión clínica — Cero Filas"
      navItems={navItems}
      activeTab={tab}
      onTabChange={setTab}
    >
      {loading && <p>Cargando información...</p>}

      {!loading && !tienePerfil && tab === 'perfil' && (
        <section className="card" style={{ maxWidth: 720 }}>
          <h3 className="card-title">📋 Autoregistro obligatorio</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Complete su perfil médico para habilitar citas y entregas.
          </p>
          <form onSubmit={guardarAutoregistro}>
            <div className="grid-2">
              <Field label="EPS" value={perfilForm.eps ?? ''} onChange={(v) => setPerfilForm({ ...perfilForm, eps: v })} required />
              <Field label="Régimen" value={perfilForm.regimen ?? ''} onChange={(v) => setPerfilForm({ ...perfilForm, regimen: v })} required />
              <Field label="Estrato" value={String(usuarioForm.estrato)} onChange={(v) => setUsuarioForm({ ...usuarioForm, estrato: Number(v) })} />
              <Field label="Barrio" value={usuarioForm.barrio} onChange={(v) => setUsuarioForm({ ...usuarioForm, barrio: v })} />
              <Field label="Dirección" value={usuarioForm.direccionResidencia} onChange={(v) => setUsuarioForm({ ...usuarioForm, direccionResidencia: v })} />
              <Field label="Peso (kg)" value={String(perfilForm.peso ?? '')} onChange={(v) => setPerfilForm({ ...perfilForm, peso: v ? Number(v) : undefined })} />
              <Field label="Estatura (cm)" value={String(perfilForm.estatura ?? '')} onChange={(v) => setPerfilForm({ ...perfilForm, estatura: v ? Number(v) : undefined })} />
            </div>
            <div className="field" style={{ marginTop: '0.75rem' }}>
              <label>Alergias</label>
              <textarea rows={2} value={perfilForm.alergias ?? ''} onChange={(e) => setPerfilForm({ ...perfilForm, alergias: e.target.value })} />
            </div>
            <div className="field">
              <label>Antecedentes patológicos</label>
              <textarea rows={2} value={perfilForm.antecedentesPatologicos ?? ''} onChange={(e) => setPerfilForm({ ...perfilForm, antecedentesPatologicos: e.target.value })} />
            </div>
            <div className="field">
              <label>Antecedentes farmacológicos</label>
              <textarea rows={2} value={perfilForm.antecedentesFarmacologicos ?? ''} onChange={(e) => setPerfilForm({ ...perfilForm, antecedentesFarmacologicos: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Completar registro
            </button>
          </form>
        </section>
      )}

      {!loading && tienePerfil && tab === 'perfil' && perfil && (
        <div className="grid-2">
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">📋 Datos Personales</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(!editing)} title="Editar">
                ✏️ {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            {editing ? (
              <div className="grid-2">
                <Field label="Estrato" value={String(usuarioForm.estrato)} onChange={(v) => setUsuarioForm({ ...usuarioForm, estrato: Number(v) })} />
                <Field label="Barrio" value={usuarioForm.barrio} onChange={(v) => setUsuarioForm({ ...usuarioForm, barrio: v })} />
                <Field label="Dirección" value={usuarioForm.direccionResidencia} onChange={(v) => setUsuarioForm({ ...usuarioForm, direccionResidencia: v })} />
                <Field label="Teléfono" value={perfil.telefono} onChange={() => {}} />
              </div>
            ) : (
              <div className="grid-2">
                <Info label="Nombre completo" value={`${perfil.nombres} ${perfil.apellidos}`} />
                <Info label="Documento" value={`${perfil.tipoDocumento} ${perfil.numeroDocumento}`} />
                <Info label="Correo" value={perfil.correo} />
                <Info label="Teléfono" value={perfil.telefono} />
                <Info label="Dirección" value={perfil.direccionResidencia} />
                <Info label="Barrio" value={perfil.barrio} />
                <Info label="Estrato" value={String(perfil.estrato)} />
                <Info label="Género / Estado civil" value={`${perfil.genero} · ${perfil.estadoCivil}`} />
              </div>
            )}
          </section>
          <section className="card vital-card">
            <h3 className="card-title" style={{ color: 'white' }}>🩺 Datos Médicos</h3>
            {editing ? (
              <>
                <div className="grid-2">
                  <Field label="EPS" value={perfilForm.eps ?? ''} onChange={(v) => setPerfilForm({ ...perfilForm, eps: v })} light />
                  <Field label="Régimen" value={perfilForm.regimen ?? ''} onChange={(v) => setPerfilForm({ ...perfilForm, regimen: v })} light />
                  <Field label="Peso (kg)" value={String(perfilForm.peso ?? '')} onChange={(v) => setPerfilForm({ ...perfilForm, peso: Number(v) })} light />
                  <Field label="Estatura (cm)" value={String(perfilForm.estatura ?? '')} onChange={(v) => setPerfilForm({ ...perfilForm, estatura: Number(v) })} light />
                </div>
                <div className="field">
                  <label style={{ color: 'rgba(255,255,255,0.7)' }}>Alergias</label>
                  <textarea rows={2} value={perfilForm.alergias ?? ''} onChange={(e) => setPerfilForm({ ...perfilForm, alergias: e.target.value })} />
                </div>
                <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={guardarEdicion}>
                  Guardar cambios
                </button>
              </>
            ) : pm ? (
              <>
                <div className="stat-grid" style={{ marginBottom: '1rem' }}>
                  <div className="stat-box"><strong>{pm.peso ?? '—'} kg</strong><span>Peso</span></div>
                  <div className="stat-box"><strong>{pm.estatura ?? '—'} cm</strong><span>Estatura</span></div>
                  <div className="stat-box"><strong>{pm.imc ?? '—'}</strong><span>IMC</span></div>
                  <div className="stat-box"><strong>{pm.tipoSangre ?? '—'}</strong><span>T. Sangre</span></div>
                </div>
                <Info label="EPS / Régimen" value={`${pm.eps ?? '—'} · ${pm.regimen ?? '—'}`} light />
                <Info label="Alergias" value={pm.alergias || 'Ninguna registrada'} light />
                <Info label="Antecedentes patológicos" value={pm.antecedentesPatologicos || '—'} light />
                <Info label="Antecedentes farmacológicos" value={pm.antecedentesFarmacologicos || '—'} light />
              </>
            ) : null}
          </section>
        </div>
      )}

      {!loading && tienePerfil && tab === 'citas' && (
        <div className="grid-2">
          <section className="card">
            <h3 className="card-title">📅 Agendar cita (bloques de 20 min)</h3>
            {user?.penalizadoCitas && (
              <p style={{ color: 'var(--warning)', marginBottom: '1rem' }}>
                Cuenta penalizada (Cero Filas): solo puede agendar turnos de contingencia los sábados, sin prioridad.
              </p>
            )}
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label>Médico tratante</label>
              <select value={medicoId} onChange={(e) => setMedicoId(Number(e.target.value))}>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>Dr(a). {m.nombres} {m.apellidos}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: '0.75rem' }}>
              <label>Seleccione fecha</label>
              <div className="time-slots">
                {fechasDisponibles.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`slot-btn ${fecha === f ? 'selected available' : 'available'}`}
                    onClick={() => { setFecha(f); setSelectedSlot(null); }}
                  >
                    {new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Jornada: 08:00–12:00 y 14:00–18:00 — solo bloques DISPONIBLES
            </p>
            <div className="time-slots" style={{ marginBottom: '1rem' }}>
              {slots.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Seleccione médico y fecha</span>}
              {slots.map((slot) => {
                const cls = slot.disponible ? 'available' : slot.estado === 'PASADO' ? 'past' : 'busy';
                return (
                  <button
                    key={slot.fechaHora}
                    type="button"
                    disabled={!slot.disponible}
                    className={`slot-btn ${cls} ${selectedSlot === slot.fechaHora ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot.fechaHora)}
                  >
                    {slot.hora.slice(0, 5)}
                  </button>
                );
              })}
            </div>
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label>Motivo de consulta</label>
              <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" onClick={agendarCita} disabled={!selectedSlot || !motivo.trim()}>
              Confirmar cita
            </button>
          </section>
          <section className="card">
            <h3 className="card-title">Historial de citas</h3>
            {(perfil?.historialCitas ?? []).length === 0 ? (
              <div className="empty-state">No tiene citas registradas</div>
            ) : (
              (perfil?.historialCitas as Cita[]).map((cita) => (
                <div key={cita.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--silver-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong>{formatDateTime(cita.fechaHora)}</strong>
                    <StatusBadge estado={cita.estado} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{cita.motivo}</p>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {!loading && tienePerfil && tab === 'entregas' && (
        <div className="grid-auto">
          {entregas.length === 0 ? (
            <div className="card empty-state">No tiene entregas de medicamentos</div>
          ) : (
            entregas.map((entrega) => (
              <article key={entrega.id} className={`card delivery-card estado-${entrega.estado}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{entrega.cita?.medicamento?.nombre ?? 'Medicamento'}</h3>
                  <StatusBadge estado={entrega.estado} />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  Cantidad: {entrega.cita?.cantidadRecetada ?? '—'} · {entrega.cita?.medicamento?.cantidadPorUnidad}
                </p>
                <div className="delivery-highlight">
                  <div>
                    <span>Farmacia</span>
                    <strong>{entrega.puntoDistribucion?.nombreLugar ?? '—'}</strong>
                  </div>
                  <div>
                    <span>Ventanilla</span>
                    <strong>#{entrega.ventanillaAsignada}</strong>
                  </div>
                  <div>
                    <span>Bloque de recogida</span>
                    <strong>{formatDateTime(entrega.fechaHoraEntrega)}</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </AppLayout>
  );
}

function Info({ label, value, light }: { label: string; value: string; light?: boolean }) {
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{ fontSize: '0.75rem', color: light ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  light,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  light?: boolean;
}) {
  return (
    <div className="field">
      <label style={light ? { color: 'rgba(255,255,255,0.7)' } : undefined}>{label}</label>
      <input value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
