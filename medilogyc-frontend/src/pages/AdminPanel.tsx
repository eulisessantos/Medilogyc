import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { useAlert } from '../context/AlertContext';
import type { Medicamento, PuntoDistribucion, Rol, Usuario } from '../types';

const NAV = [
  { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
  { id: 'puntos', label: 'Puntos de Distribución', icon: '🏥' },
];

const ROLES: Rol[] = ['PACIENTE', 'MEDICO', 'FARMACEUTICO', 'ADMIN'];

const emptyUsuario = {
  nombres: '',
  apellidos: '',
  correo: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  password: '',
  rol: 'PACIENTE' as Rol,
  telefono: '',
  direccionResidencia: '',
  barrio: '',
  estrato: 3,
  genero: 'No especificado',
  estadoCivil: 'No especificado',
  esActive: true,
};

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

const emptyPunto = {
  nombreLugar: '',
  stockDisponible: 0,
  cantidadVentanillas: 1,
};

export function AdminPanel() {
  const { handleApiError, showToast, fieldErrors, clearFieldErrors } = useAlert();
  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [puntos, setPuntos] = useState<PuntoDistribucion[]>([]);
  const [usuarioForm, setUsuarioForm] = useState({ ...emptyUsuario });
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [medForm, setMedForm] = useState({ ...emptyMedicamento });
  const [editMedId, setEditMedId] = useState<number | null>(null);
  const [puntoForm, setPuntoForm] = useState({ ...emptyPunto });
  const [medIdPunto, setMedIdPunto] = useState<number | ''>('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [u, m, p] = await Promise.all([api.getUsuarios(), api.getMedicamentos(), api.getPuntos()]);
      setUsuarios(u);
      setMedicamentos(m);
      setPuntos(p);
      if (m.length > 0 && !medIdPunto) setMedIdPunto(m[0].id);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function saveUsuario(e: React.FormEvent) {
    e.preventDefault();
    clearFieldErrors();
    try {
      if (editUserId) {
        await api.actualizarUsuario(editUserId, usuarioForm);
        showToast('Usuario actualizado', 'success');
      } else {
        await api.crearUsuario(usuarioForm);
        showToast('Usuario creado', 'success');
      }
      setUsuarioForm({ ...emptyUsuario });
      setEditUserId(null);
      loadAll();
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
      loadAll();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function savePunto(e: React.FormEvent) {
    e.preventDefault();
    if (!medIdPunto) return;
    try {
      await api.crearPunto(Number(medIdPunto), puntoForm);
      showToast('Punto de distribución creado', 'success');
      setPuntoForm({ ...emptyPunto });
      loadAll();
    } catch (err) {
      handleApiError(err);
    }
  }

  return (
    <AppLayout
      title="Panel Administrador"
      subtitle="Gestión del sistema Medilogyc"
      navItems={NAV}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'usuarios' && (
        <div className="grid-2">
          <form className="card" onSubmit={saveUsuario}>
            <h3 className="card-title">{editUserId ? 'Editar usuario' : 'Crear usuario'}</h3>
            <div className="grid-2">
              <Field label="Nombres" value={usuarioForm.nombres} onChange={(v) => setUsuarioForm({ ...usuarioForm, nombres: v })} />
              <Field label="Apellidos" value={usuarioForm.apellidos} onChange={(v) => setUsuarioForm({ ...usuarioForm, apellidos: v })} />
              <Field label="Correo" value={usuarioForm.correo} onChange={(v) => setUsuarioForm({ ...usuarioForm, correo: v })} error={fieldErrors.correo} />
              <Field label="Documento" value={usuarioForm.numeroDocumento} onChange={(v) => setUsuarioForm({ ...usuarioForm, numeroDocumento: v })} error={fieldErrors.numeroDocumento} />
              <Field label="Tipo doc." value={usuarioForm.tipoDocumento} onChange={(v) => setUsuarioForm({ ...usuarioForm, tipoDocumento: v })} />
              <Field label="Teléfono" value={usuarioForm.telefono} onChange={(v) => setUsuarioForm({ ...usuarioForm, telefono: v })} />
              <Field label="Contraseña" value={usuarioForm.password} onChange={(v) => setUsuarioForm({ ...usuarioForm, password: v })} type="password" />
              <div className="field">
                <label>Rol</label>
                <select value={usuarioForm.rol} onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value as Rol })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Field label="Dirección" value={usuarioForm.direccionResidencia} onChange={(v) => setUsuarioForm({ ...usuarioForm, direccionResidencia: v })} />
              <Field label="Barrio" value={usuarioForm.barrio} onChange={(v) => setUsuarioForm({ ...usuarioForm, barrio: v })} />
              <Field label="Estrato" value={String(usuarioForm.estrato)} onChange={(v) => setUsuarioForm({ ...usuarioForm, estrato: Number(v) })} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">{editUserId ? 'Guardar cambios' : 'Crear usuario'}</button>
              {editUserId && (
                <button type="button" className="btn btn-ghost" onClick={() => { setEditUserId(null); setUsuarioForm({ ...emptyUsuario }); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <section className="card">
            <h3 className="card-title">Usuarios registrados</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombres} {u.apellidos}<br /><small>{u.correo}</small></td>
                      <td>{u.rol}</td>
                      <td>{u.esActive ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <button type="button" className="btn btn-ghost" style={{ padding: '0.35rem 0.65rem' }} onClick={() => {
                          setEditUserId(u.id);
                          setUsuarioForm({ ...emptyUsuario, ...u, password: u.password ?? '' });
                        }}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'medicamentos' && (
        <div className="grid-2">
          <form className="card" onSubmit={saveMedicamento}>
            <h3 className="card-title">{editMedId ? 'Editar medicamento' : 'Registrar medicamento'}</h3>
            <div className="grid-2">
              <Field label="Nombre" value={medForm.nombre} onChange={(v) => setMedForm({ ...medForm, nombre: v })} />
              <Field label="Laboratorio" value={medForm.laboratorio} onChange={(v) => setMedForm({ ...medForm, laboratorio: v })} />
              <Field label="Stock" value={String(medForm.stock)} onChange={(v) => setMedForm({ ...medForm, stock: Number(v) })} />
              <Field label="Presentación" value={medForm.cantidadPorUnidad} onChange={(v) => setMedForm({ ...medForm, cantidadPorUnidad: v })} />
              <Field label="Lote" value={medForm.lote} onChange={(v) => setMedForm({ ...medForm, lote: v })} />
              <Field label="Vencimiento" value={medForm.fechaVencimiento} onChange={(v) => setMedForm({ ...medForm, fechaVencimiento: v })} type="date" />
              <Field label="Registro INVIMA" value={medForm.registroInvima} onChange={(v) => setMedForm({ ...medForm, registroInvima: v })} />
              <Field label="Precio" value={String(medForm.precio)} onChange={(v) => setMedForm({ ...medForm, precio: Number(v) })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              {editMedId ? 'Actualizar' : 'Registrar'}
            </button>
          </form>
          <section className="card">
            <h3 className="card-title">Inventario</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Stock</th><th>Lote</th><th></th></tr></thead>
                <tbody>
                  {medicamentos.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre}</td>
                      <td>{m.stock}</td>
                      <td>{m.lote}</td>
                      <td>
                        <button type="button" className="btn btn-ghost" style={{ padding: '0.35rem 0.65rem' }} onClick={() => {
                          setEditMedId(m.id);
                          setMedForm({ ...emptyMedicamento, ...m, fechaVencimiento: m.fechaVencimiento ?? '' });
                        }}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'puntos' && (
        <div className="grid-2">
          <form className="card" onSubmit={savePunto}>
            <h3 className="card-title">Crear punto de distribución</h3>
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label>Medicamento base</label>
              <select value={medIdPunto} onChange={(e) => setMedIdPunto(Number(e.target.value))}>
                {medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <Field label="Nombre del lugar" value={puntoForm.nombreLugar} onChange={(v) => setPuntoForm({ ...puntoForm, nombreLugar: v })} />
            <Field label="Stock local" value={String(puntoForm.stockDisponible)} onChange={(v) => setPuntoForm({ ...puntoForm, stockDisponible: Number(v) })} />
            <Field label="N° ventanillas" value={String(puntoForm.cantidadVentanillas)} onChange={(v) => setPuntoForm({ ...puntoForm, cantidadVentanillas: Number(v) })} />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Crear punto</button>
          </form>
          <section className="card">
            <h3 className="card-title">Puntos activos</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Lugar</th><th>Medicamento</th><th>Stock</th><th>Ventanillas</th></tr></thead>
                <tbody>
                  {puntos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nombreLugar}</td>
                      <td>{p.medicamento?.nombre}</td>
                      <td>{p.stockDisponible}</td>
                      <td>{p.cantidadVentanillas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}

function Field({
  label, value, onChange, type = 'text', error,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: boolean;
}) {
  return (
    <div className={`field ${error ? 'error' : ''}`} style={{ marginBottom: '0.75rem' }}>
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
