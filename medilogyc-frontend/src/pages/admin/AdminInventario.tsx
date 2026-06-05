import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import type { Medicamento, PuntoDistribucion, Sede } from '../../types';

const emptyMedicamento = {
  nombre: '',
  laboratorio: '',
  stock: 0,
  cantidadPorUnidad: '',
  lote: '',
  fechaVencimiento: '',
  registroInvima: '',
  precio: 0,
};

export function AdminInventario() {
  const { handleApiError, showToast } = useAlert();
  const [tab, setTab] = useState<'meds' | 'sedes' | 'asignar'>('meds');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [puntos, setPuntos] = useState<PuntoDistribucion[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [medForm, setMedForm] = useState({ ...emptyMedicamento });
  const [editMedId, setEditMedId] = useState<number | null>(null);
  const [sedeForm, setSedeForm] = useState({ nombreLugar: '', cantidadVentanillas: 3 });
  const [invForm, setInvForm] = useState({ sedeId: '' as number | '', medicamentoId: '' as number | '', stockLocal: 0 });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [m, p, s] = await Promise.all([api.getMedicamentos(), api.getPuntos(), api.getSedes()]);
      setMedicamentos(m);
      setPuntos(p);
      setSedes(s);
      if (s.length && !invForm.sedeId) setInvForm((f) => ({ ...f, sedeId: s[0].id }));
      if (m.length && !invForm.medicamentoId) setInvForm((f) => ({ ...f, medicamentoId: m[0].id }));
    } catch (err) {
      handleApiError(err);
    }
  }

  async function saveMedicamento(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editMedId) {
        await api.actualizarMedicamento(editMedId, medForm);
        showToast('Medicamento actualizado', 'success');
      } else {
        await api.crearMedicamento(medForm);
        showToast('Medicamento registrado', 'success');
      }
      setMedForm({ ...emptyMedicamento });
      setEditMedId(null);
      load();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function crearSede(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.crearSede(sedeForm);
      showToast('Sede creada', 'success');
      setSedeForm({ nombreLugar: '', cantidadVentanillas: 3 });
      load();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function asignarStock(e: React.FormEvent) {
    e.preventDefault();
    if (!invForm.sedeId || !invForm.medicamentoId) return;
    try {
      await api.asignarInventarioSede({
        sedeId: Number(invForm.sedeId),
        medicamentoId: Number(invForm.medicamentoId),
        stockLocal: invForm.stockLocal,
      });
      showToast('Stock asignado a sede', 'success');
      load();
    } catch (err) {
      handleApiError(err);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['meds', 'sedes', 'asignar'] as const).map((t) => (
          <button key={t} type="button" className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'meds' ? 'Medicamentos' : t === 'sedes' ? 'Sedes' : 'Stock por sede'}
          </button>
        ))}
      </div>

      {tab === 'meds' && (
        <div className="grid-2">
          <form className="card" onSubmit={saveMedicamento}>
            <h3 className="card-title">{editMedId ? 'Editar medicamento' : 'Registrar medicamento'}</h3>
            <div className="grid-2">
              <F label="Nombre" value={medForm.nombre} onChange={(v) => setMedForm({ ...medForm, nombre: v })} />
              <F label="Laboratorio" value={medForm.laboratorio} onChange={(v) => setMedForm({ ...medForm, laboratorio: v })} />
              <F label="Stock global" value={String(medForm.stock)} onChange={(v) => setMedForm({ ...medForm, stock: Number(v) })} />
              <F label="Presentación" value={medForm.cantidadPorUnidad} onChange={(v) => setMedForm({ ...medForm, cantidadPorUnidad: v })} />
              <F label="Lote" value={medForm.lote} onChange={(v) => setMedForm({ ...medForm, lote: v })} />
              <F label="Vencimiento" value={medForm.fechaVencimiento} onChange={(v) => setMedForm({ ...medForm, fechaVencimiento: v })} type="date" />
              <F label="Registro INVIMA" value={medForm.registroInvima} onChange={(v) => setMedForm({ ...medForm, registroInvima: v })} />
              <F label="Precio" value={String(medForm.precio)} onChange={(v) => setMedForm({ ...medForm, precio: Number(v) })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>{editMedId ? 'Actualizar' : 'Registrar'}</button>
          </form>
          <section className="card">
            <h3 className="card-title">Catálogo (INVIMA / lotes)</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Stock</th><th>INVIMA</th><th>Lote</th></tr></thead>
                <tbody>
                  {medicamentos.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre}<br /><small>{m.laboratorio}</small></td>
                      <td>{m.stock}</td>
                      <td>{m.registroInvima}</td>
                      <td>{m.lote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Puntos de entrega (recetas): {puntos.length} configurados
            </p>
          </section>
        </div>
      )}

      {tab === 'sedes' && (
        <form className="card" style={{ maxWidth: 480 }} onSubmit={crearSede}>
          <h3 className="card-title">Nueva sede / punto de distribución</h3>
          <F label="Nombre del lugar" value={sedeForm.nombreLugar} onChange={(v) => setSedeForm({ ...sedeForm, nombreLugar: v })} />
          <F label="Ventanillas" value={String(sedeForm.cantidadVentanillas)} onChange={(v) => setSedeForm({ ...sedeForm, cantidadVentanillas: Number(v) })} />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Crear sede</button>
          <ul style={{ marginTop: '1rem' }}>
            {sedes.map((s) => (
              <li key={s.id}>{s.nombreLugar} — {s.cantidadVentanillas} ventanillas</li>
            ))}
          </ul>
        </form>
      )}

      {tab === 'asignar' && (
        <form className="card" style={{ maxWidth: 480 }} onSubmit={asignarStock}>
          <h3 className="card-title">Asignar stock local (N:M)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Σ stock_local por medicamento ≤ stock global</p>
          <div className="field">
            <label>Sede</label>
            <select value={invForm.sedeId} onChange={(e) => setInvForm({ ...invForm, sedeId: Number(e.target.value) })}>
              {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombreLugar}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Medicamento</label>
            <select value={invForm.medicamentoId} onChange={(e) => setInvForm({ ...invForm, medicamentoId: Number(e.target.value) })}>
              {medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <F label="Stock local" value={String(invForm.stockLocal)} onChange={(v) => setInvForm({ ...invForm, stockLocal: Number(v) })} />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Asignar</button>
        </form>
      )}
    </div>
  );
}

function F({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
