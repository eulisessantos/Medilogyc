# Medilogyc Frontend

Interfaz web para la plataforma **Medilogyc — Cero Filas**.

## Requisitos

- Node.js 18+
- Backend Spring Boot corriendo en `http://localhost:8080`

## Instalación

```bash
cd medilogyc-frontend
npm install
npm run dev
```

Abra `http://localhost:5173`

## Paneles por rol

| Rol | Ruta |
|-----|------|
| Paciente | `/paciente` |
| Médico | `/medico` |
| Farmacéutico | `/farmaceutico` |
| Admin | `/admin` |

## Autenticación

El login usa `POST /auth/login`. Las peticiones autenticadas envían la cabecera `X-User-Email`.

## Paleta de colores

- Verde primario `#6bcb47` — CTAs, slots disponibles
- Rojo médico `#dc2626` — alertas de alergia
- Navy `#0f172a` — sidebar clínico
- Cyan `#38bdf8` — entregas, slots informativos
"# Medilogyc" 
"# Medilogyc" 
