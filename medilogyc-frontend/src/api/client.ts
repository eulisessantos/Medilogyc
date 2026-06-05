import type { ApiError } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function getAuthEmail(): string | null {
  return localStorage.getItem('medilogyc_user_email');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const email = getAuthEmail();
  if (email && !path.startsWith('/auth/login')) {
    headers['X-User-Email'] = email;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    const text = await response.text();
    return text as unknown as T;
  }

  let message = 'Error inesperado del servidor.';
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    message = data.message ?? data.error ?? JSON.stringify(data);
  } else {
    message = await response.text();
  }

  throw parseApiError(message, response.status);
}

export function parseApiError(message: string, status?: number): ApiError {
  const normalized = message.trim();
  if (normalized.includes('ALERTA MÉDICA') || normalized.includes('alérgico')) {
    return { message: normalized, type: 'allergy' };
  }
  if (normalized.includes('COMPATIBILIDAD CRÍTICA') || normalized.includes('interactúa peligrosamente')) {
    return { message: normalized, type: 'compatibility' };
  }
  if (
    normalized.includes('ya está registrado') ||
    normalized.includes('Ya existe') ||
    (status === 400 && normalized.toLowerCase().includes('correo'))
  ) {
    return { message: normalized, type: 'duplicate' };
  }
  if (normalized.includes('Stock insuficiente') || normalized.includes('Insufficient Stock')) {
    return { message: normalized, type: 'stock' };
  }
  return { message: normalized, type: 'generic' };
}

export const api = {
  login: (correo: string, password: string) =>
    apiRequest<import('../types').AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    }),

  getPerfilCompleto: (id: number) =>
    apiRequest<import('../types').PerfilCompleto>(`/usuarios/${id}/perfil-completo`),

  getMedicos: () => apiRequest<import('../types').Usuario[]>('/usuarios/medicos'),

  buscarPaciente: (documento: string) =>
    apiRequest<import('../types').Usuario>(`/usuarios/buscar?documento=${encodeURIComponent(documento)}`),

  getDisponibilidad: (medicoId: number, fecha: string, pacienteId?: number) =>
    apiRequest<{ bloques: import('../types').TimeSlot[]; mensaje?: string }>(
      `/api/citas/medico/${medicoId}/disponibilidad?fecha=${fecha}${
        pacienteId != null ? `&pacienteId=${pacienteId}` : ''
      }`,
    ),

  agendarCita: (pacienteId: number, body: object) =>
    apiRequest<import('../types').Cita>(`/api/citas/paciente/${pacienteId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getCitasPaciente: (pacienteId: number) =>
    apiRequest<import('../types').Cita[]>(`/api/citas/paciente/${pacienteId}`),

  getCitasMedico: (medicoId: number) =>
    apiRequest<import('../types').Cita[]>(`/api/citas/medico/${medicoId}`),

  getEntregasPaciente: (pacienteId: number) =>
    apiRequest<import('../types').Entrega[]>(`/api/entregas/paciente/${pacienteId}`),

  recetar: (citaId: number, params: URLSearchParams) =>
    apiRequest<import('../types').Entrega>(`/api/citas/${citaId}/recetar?${params}`, {
      method: 'POST',
    }),

  buscarEntrega: (params: URLSearchParams) =>
    apiRequest<import('../types').Entrega | import('../types').Entrega[]>(
      `/api/entregas/buscar?${params}`,
    ),

  procesarEntrega: (entregaId: number, llegoAHora: boolean, sedeId: number) =>
    apiRequest<string>(
      `/api/entregas/${entregaId}/procesar?llegoAHora=${llegoAHora}&sedeId=${sedeId}`,
      { method: 'PUT' },
    ),

  consultarStockEntrega: (entregaId: number, sedeId: number) =>
    apiRequest<{ disponible: boolean }>(
      `/api/entregas/${entregaId}/stock-disponible?sedeId=${sedeId}`,
    ),

  getMedicamentos: () => apiRequest<import('../types').Medicamento[]>('/api/medicamentos'),

  getPuntos: () => apiRequest<import('../types').PuntoDistribucion[]>('/api/puntos-distribucion'),

  getUsuarios: () => apiRequest<import('../types').Usuario[]>('/usuarios'),

  getUsuario: (id: number) => apiRequest<import('../types').Usuario>(`/usuarios/${id}`),

  crearUsuario: (body: object) =>
    apiRequest<import('../types').Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(body) }),

  crearPaciente: (body: object) =>
    apiRequest<import('../types').Usuario>('/usuarios/paciente', { method: 'POST', body: JSON.stringify(body) }),

  crearMedico: (body: object) =>
    apiRequest<import('../types').Usuario>('/usuarios/medico', { method: 'POST', body: JSON.stringify(body) }),

  crearFarmaceutico: (body: object) =>
    apiRequest<import('../types').Usuario>('/usuarios/farmaceutico', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  actualizarUsuario: (id: number, body: object) =>
    apiRequest<import('../types').Usuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  desactivarUsuario: (id: number) =>
    apiRequest<string>(`/usuarios/${id}`, { method: 'DELETE' }),

  crearMedicamento: (body: object) =>
    apiRequest<import('../types').Medicamento>('/api/medicamentos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  actualizarMedicamento: (id: number, body: object) =>
    apiRequest<import('../types').Medicamento>(`/api/medicamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  eliminarMedicamento: (id: number) =>
    apiRequest<string>(`/api/medicamentos/${id}`, { method: 'DELETE' }),

  crearPunto: (medicamentoId: number, body: object) =>
    apiRequest<import('../types').PuntoDistribucion>(
      `/api/puntos-distribucion/medicamento/${medicamentoId}`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  getPerfilMedico: (usuarioId: number) =>
    apiRequest<import('../types').PerfilMedico>(`/api/perfiles/usuario/${usuarioId}`),

  crearPerfilMedico: (usuarioId: number, body: object) =>
    apiRequest<import('../types').PerfilMedico>(`/api/perfiles/usuario/${usuarioId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  actualizarPerfilMedico: (usuarioId: number, body: object) =>
    apiRequest<import('../types').PerfilMedico>(`/api/perfiles/usuario/${usuarioId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getMetricas: () => apiRequest<import('../types').MetricasReporte>('/api/reportes/metricas'),

  getSedes: () => apiRequest<import('../types').Sede[]>('/api/sedes'),

  crearSede: (body: object) =>
    apiRequest<import('../types').Sede>('/api/sedes', { method: 'POST', body: JSON.stringify(body) }),

  getInventarioSede: (sedeId: number) =>
    apiRequest<import('../types').InventarioSede[]>(`/api/inventario-sedes/sede/${sedeId}`),

  asignarInventarioSede: (body: object) =>
    apiRequest<import('../types').InventarioSede>('/api/inventario-sedes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  activarUsuario: (id: number) =>
    apiRequest<string>(`/usuarios/${id}/activar`, { method: 'PUT' }),

  desactivarUsuario: (id: number) =>
    apiRequest<string>(`/usuarios/${id}/desactivar`, { method: 'PUT' }),
};
