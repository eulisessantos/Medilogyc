import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import type { PuntoDistribucion, Sede } from '../../types';

export function AdminNuevoFarmaceutico() {
  const navigate = useNavigate();
  const { handleApiError, showToast } = useAlert();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [puntos, setPuntos] = useState<PuntoDistribucion[]>([]);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    password: '',
    rol: 'FARMACEUTICO' as const,
    telefono: '',
    sedeId: '' as number | '',
    puntoDistribucionId: '' as number | '',
    rolOperativo: 'Despacho',
  });

  useEffect(() => {
    Promise.all([api.getSedes(), api.getPuntos()])
      .then(([s, p]) => {
        setSedes(s);
        setPuntos(p);
      })
      .catch(handleApiError);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sedeId || !form.puntoDistribucionId) {
      showToast('Seleccione sede y punto de distribución', 'warning');
      return;
    }
    try {
      await api.crearFarmaceutico({
        ...form,
        sedeId: Number(form.sedeId),
        puntoDistribucionId: Number(form.puntoDistribucionId),
      });
      showToast('Farmacéutico registrado', 'success');
      navigate('/admin/usuarios');
    } catch (err) {
      handleApiError(err);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
      <h3 className="card-title">Nuevo farmacéutico</h3>
      <div className="grid-2">
        <F label="Nombres *" value={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} />
        <F label="Apellidos *" value={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} />
        <F label="Correo *" value={form.correo} onChange={(v) => setForm({ ...form, correo: v })} />
        <F label="Número documento *" value={form.numeroDocumento} onChange={(v) => setForm({ ...form, numeroDocumento: v })} />
        <F label="Teléfono *" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
        <F label="Contraseña *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
        <div className="field">
          <label>Sede (inventario local) *</label>
          <select value={form.sedeId} onChange={(e) => setForm({ ...form, sedeId: Number(e.target.value) })} required>
            <option value="">Seleccione...</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombreLugar}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Punto de distribución *</label>
          <select value={form.puntoDistribucionId} onChange={(e) => setForm({ ...form, puntoDistribucionId: Number(e.target.value) })} required>
            <option value="">Seleccione...</option>
            {puntos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombreLugar} {p.medicamento?.nombre ? `— ${p.medicamento.nombre}` : ''}
              </option>
            ))}
          </select>
        </div>
        <F label="Rol operativo *" value={form.rolOperativo} onChange={(v) => setForm({ ...form, rolOperativo: v })} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Registrar farmacéutico</button>
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
