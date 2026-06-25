# Inventario de Carnes - Sistema de Gestión

Backend Node.js + Frontend React para gestionar inventario de canales de cerdo con picking inteligente y alertas de reorden.

## Quick Start

### 1. Setup PostgreSQL

```bash
# Crear base de datos
createdb inventario_carnes

# Ejecutar schema
psql inventario_carnes < backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu conexión PostgreSQL
npm start
```

Servidor en `http://localhost:3001`

### 3. Frontend (próximo)

```bash
cd frontend
npm install
npm start
```

---

## API Endpoints

### Inventario
- `POST /api/inventario/entrada` — Registrar canales
- `GET /api/inventario/actual` — Ver inventario actual
- `GET /api/inventario/resumen` — Resumen (totales, clasificación)

### Picking
- `GET /api/picking/lista?fecha=2026-06-24` — Generar picking list
- `POST /api/picking/confirmar` — Marcar canales como vendidos

### Reorden
- `GET /api/reorden/alerta` — ¿Hay que pedir hoy?
- `GET /api/reorden/proyeccion` — Proyección de agotamiento

### Clientes
- `POST /api/clientes` — Crear cliente
- `GET /api/clientes` — Listar clientes
- `POST /api/clientes/:id/pedidos-agendados` — Agregar pedido agendado
