import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import type { Usuario } from '../../types';

export function AdminUsuarios() {
  const { handleApiError, showToast } = useAlert();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setUsuarios(await api.getUsuarios());
    } catch (err) {
      handleApiError(err);
    }
  }

  async function toggleActivo(u: Usuario) {
    try {
      if (u.esActive) {
        await api.desactivarUsuario(u.id);
        showToast('Usuario desactivado', 'success');
      } else {
        await api.activarUsuario(u.id);
        showToast('Usuario activado', 'success');
      }
      load();
    } catch (err) {
      handleApiError(err);
    }
  }

  return (
    <section className="card">
      <h3 className="card-title">Usuarios del sistema</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombres} {u.apellidos}<br /><small>{u.correo}</small></td>
                <td>{u.rol}</td>
                <td><span className={`badge ${u.esActive ? 'badge-completada' : 'badge-cancelada'}`}>{u.esActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => toggleActivo(u)}>
                    {u.esActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
