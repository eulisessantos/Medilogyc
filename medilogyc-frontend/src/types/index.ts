export type Rol = 'ADMIN' | 'MEDICO' | 'FARMACEUTICO' | 'PACIENTE';

export interface AuthUser {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  numeroDocumento: string;
  sedeId?: number;
  puntoDistribucionId?: number;
  penalizadoCitas?: boolean;
}

export interface Usuario extends AuthUser {
  tipoDocumento?: string;
  telefono?: string;
  esActive?: boolean;
  direccionResidencia?: string;
  barrio?: string;
  estrato?: number;
  genero?: string;
  estadoCivil?: string;
  horaInicioJornada?: string;
  horaFinJornada?: string;
  password?: string;
  tarjetaProfesional?: string;
  especialidad?: string;
  duracionConsultaMinutos?: number;
  sedeId?: number;
  rolOperativo?: string;
}

export interface PerfilMedico {
  id?: number;
  fechaNacimiento?: string;
  tipoSangre?: string;
  eps?: string;
  regimen?: string;
  alergias?: string;
  antecedentesPatologicos?: string;
  antecedentesQuirurgicos?: string;
  antecedentesFarmacologicos?: string;
  antecedentesFamiliares?: string;
  peso?: number;
  estatura?: number;
  imc?: number;
  presionArterial?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
  esDonante?: boolean;
}

export interface PerfilCompleto {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  rol: Rol;
  telefono: string;
  esActive: boolean;
  direccionResidencia: string;
  barrio: string;
  estrato: number;
  genero: string;
  estadoCivil: string;
  perfilMedico?: PerfilMedico | null;
  historialCitas?: Cita[];
  historialEntregas?: Entrega[];
}

export interface Medicamento {
  id: number;
  nombre: string;
  laboratorio: string;
  stock: number;
  cantidadPorUnidad: string;
  lote?: string;
  fechaVencimiento?: string;
  registroInvima?: string;
  precio?: number;
}

export interface PuntoDistribucion {
  id: number;
  nombreLugar: string;
  stockDisponible: number;
  cantidadVentanillas: number;
  medicamento?: Medicamento;
}

export interface Cita {
  id: number;
  fechaHora: string;
  motivo: string;
  estado: string;
  paciente?: Usuario;
  medico?: Usuario;
  medicamento?: Medicamento;
  cantidadRecetada?: number;
}

export interface Entrega {
  id: number;
  fechaHoraEntrega: string;
  ventanillaAsignada: number;
  estado: string;
  cita?: Cita;
  puntoDistribucion?: PuntoDistribucion;
}

export interface TimeSlot {
  fechaHora: string;
  hora: string;
  disponible: boolean;
  estado?: 'DISPONIBLE' | 'OCUPADO' | 'PASADO';
}

export interface Sede {
  id: number;
  nombreLugar: string;
  cantidadVentanillas: number;
}

export interface InventarioSede {
  id: number;
  stockLocal: number;
  sede?: Sede;
  medicamento?: Medicamento;
}

export interface MetricasReporte {
  citasTotales: number;
  citasPendientes: number;
  citasCompletadas: number;
  entregasTotales: number;
  medicamentosMasUsados: { medicamento: string; totalRecetas: number }[];
}

export interface ApiError {
  message: string;
  type: 'allergy' | 'compatibility' | 'duplicate' | 'stock' | 'generic';
}
