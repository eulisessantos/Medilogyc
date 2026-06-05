import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAlert } from '../../context/AlertContext';

export function AdminNuevoMedico() {
  const navigate = useNavigate();
  const { handleApiError, showToast } = useAlert();
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    password: '',
    rol: 'MEDICO' as const,
    telefono: '',
    tarjetaProfesional: '',
    especialidad: '',
    horaInicioJornada: '08:00:00',
    horaFinJornada: '18:00:00',
    duracionConsultaMinutos: 20,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.crearMedico(form);
      showToast('Médico registrado', 'success');
      navigate('/admin/usuarios');
    } catch (err) {
      handleApiError(err);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
      <h3 className="card-title">Nuevo médico</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Tarjeta profesional, especialidad y jornada laboral son obligatorios.
      </p>
      <div className="grid-2">
        <F label="Nombres *" value={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} />
        <F label="Apellidos *" value={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} />
        <F label="Correo *" value={form.correo} onChange={(v) => setForm({ ...form, correo: v })} />
        <F label="Tipo documento *" value={form.tipoDocumento} onChange={(v) => setForm({ ...form, tipoDocumento: v })} />
        <F label="Número documento *" value={form.numeroDocumento} onChange={(v) => setForm({ ...form, numeroDocumento: v })} />
        <F label="Teléfono *" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
        <F label="Contraseña *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
        <F label="Tarjeta profesional *" value={form.tarjetaProfesional} onChange={(v) => setForm({ ...form, tarjetaProfesional: v })} />
        <F label="Especialidad *" value={form.especialidad} onChange={(v) => setForm({ ...form, especialidad: v })} />
        <F label="Inicio jornada *" value={form.horaInicioJornada} onChange={(v) => setForm({ ...form, horaInicioJornada: v.length === 5 ? `${v}:00` : v })} type="time" />
        <F label="Fin jornada *" value={form.horaFinJornada.slice(0, 5)} onChange={(v) => setForm({ ...form, horaFinJornada: v.length === 5 ? `${v}:00` : v })} type="time" />
        <F label="Duración consulta (min) *" value={String(form.duracionConsultaMinutos)} onChange={(v) => setForm({ ...form, duracionConsultaMinutos: Number(v) })} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Registrar médico</button>
    </form>
  );
}

function F({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
