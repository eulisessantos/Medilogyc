import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAlert } from '../../context/AlertContext';

const empty = {
  nombres: '',
  apellidos: '',
  correo: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  password: '',
  rol: 'PACIENTE' as const,
  telefono: '',
  direccionResidencia: '',
  barrio: '',
  estrato: 3,
  genero: 'No especificado',
  estadoCivil: 'Soltero',
  perfilMedico: {
    eps: '',
    regimen: 'Contributivo',
    antecedentesPatologicos: '',
    antecedentesFarmacologicos: '',
    alergias: '',
  },
};

export function AdminNuevoPaciente() {
  const navigate = useNavigate();
  const { handleApiError, showToast, fieldErrors, clearFieldErrors } = useAlert();
  const [form, setForm] = useState({ ...empty });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFieldErrors();
    try {
      await api.crearPaciente(form);
      showToast('Paciente registrado', 'success');
      navigate('/admin/usuarios');
    } catch (err) {
      handleApiError(err);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 720 }} onSubmit={onSubmit}>
      <h3 className="card-title">Nuevo paciente</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Datos de acceso, ubicación, EPS y antecedentes clínicos obligatorios.
      </p>
      <h4 style={{ marginTop: '1rem' }}>Identificación y acceso</h4>
      <div className="grid-2">
        <F label="Nombres *" value={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} />
        <F label="Apellidos *" value={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} />
        <F label="Correo *" value={form.correo} onChange={(v) => setForm({ ...form, correo: v })} error={fieldErrors.correo} />
        <Select label="Tipo documento *" value={form.tipoDocumento} options={['CC', 'TI', 'CE', 'PA']} onChange={(v) => setForm({ ...form, tipoDocumento: v })} />
        <F label="Número documento *" value={form.numeroDocumento} onChange={(v) => setForm({ ...form, numeroDocumento: v })} />
        <F label="Teléfono *" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
        <F label="Contraseña *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
        <Select label="Género *" value={form.genero} options={['Masculino', 'Femenino', 'Otro', 'No especificado']} onChange={(v) => setForm({ ...form, genero: v })} />
        <Select label="Estado civil *" value={form.estadoCivil} options={['Soltero', 'Casado', 'Unión libre', 'Viudo']} onChange={(v) => setForm({ ...form, estadoCivil: v })} />
      </div>
      <h4 style={{ marginTop: '1.25rem' }}>Ubicación</h4>
      <div className="grid-2">
        <F label="Dirección *" value={form.direccionResidencia} onChange={(v) => setForm({ ...form, direccionResidencia: v })} />
        <F label="Barrio *" value={form.barrio} onChange={(v) => setForm({ ...form, barrio: v })} />
        <F label="Estrato (1-6) *" value={String(form.estrato)} onChange={(v) => setForm({ ...form, estrato: Number(v) })} />
      </div>
      <h4 style={{ marginTop: '1.25rem' }}>Perfil clínico</h4>
      <div className="grid-2">
        <F label="EPS *" value={form.perfilMedico.eps} onChange={(v) => setForm({ ...form, perfilMedico: { ...form.perfilMedico, eps: v } })} />
        <Select label="Régimen *" value={form.perfilMedico.regimen} options={['Contributivo', 'Subsidiado', 'Especial', 'Particular']} onChange={(v) => setForm({ ...form, perfilMedico: { ...form.perfilMedico, regimen: v } })} />
        <Area label="Antecedentes patológicos *" value={form.perfilMedico.antecedentesPatologicos} onChange={(v) => setForm({ ...form, perfilMedico: { ...form.perfilMedico, antecedentesPatologicos: v } })} />
        <Area label="Antecedentes farmacológicos *" value={form.perfilMedico.antecedentesFarmacologicos} onChange={(v) => setForm({ ...form, perfilMedico: { ...form.perfilMedico, antecedentesFarmacologicos: v } })} />
        <Area label="Alergias" value={form.perfilMedico.alergias ?? ''} onChange={(v) => setForm({ ...form, perfilMedico: { ...form.perfilMedico, alergias: v } })} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Registrar paciente</button>
    </form>
  );
}

function F({ label, value, onChange, type, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; error?: string }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} required />
      {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field" style={{ gridColumn: '1 / -1' }}>
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} required={label.includes('*')} />
    </div>
  );
}
