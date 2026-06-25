-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  email VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pedidos Agendados (Lunes, Miércoles, Viernes)
CREATE TABLE IF NOT EXISTS pedidos_agendados (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  dia VARCHAR(20) NOT NULL, -- 'lunes', 'miercoles', 'viernes'
  cantidad_canales INTEGER NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Canales (main inventory)
CREATE TABLE IF NOT EXISTS canales (
  id SERIAL PRIMARY KEY,
  numero_canal INTEGER,
  peso_lbs DECIMAL(10, 2) NOT NULL,
  clasificacion VARCHAR(50), -- 'light', 'normal'
  ubicacion_riel INTEGER NOT NULL, -- 1, 2, 3, 4
  fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP,
  cliente_id INTEGER REFERENCES clientes(id),
  estado VARCHAR(50) DEFAULT 'en_reefer', -- 'en_reefer', 'en_congelador', 'vendido'
  observaciones TEXT
);

-- Tabla de Subproductos (cabezas, patas, untos, grasa)
CREATE TABLE IF NOT EXISTS subproductos (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'cabeza', 'pata', 'unto', 'grasa'
  cantidad INTEGER NOT NULL,
  peso_lbs DECIMAL(10, 2) NOT NULL,
  ubicacion VARCHAR(50) DEFAULT 'reefer', -- 'reefer', 'congelador'
  fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP,
  cliente_id INTEGER REFERENCES clientes(id),
  estado VARCHAR(50) DEFAULT 'disponible', -- 'disponible', 'vendido'
  observaciones TEXT
);

-- Tabla de Pedidos (entregas)
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  fecha_pedido DATE NOT NULL,
  cantidad_canales INTEGER NOT NULL,
  peso_total_lbs DECIMAL(10, 2),
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'entregado', 'cancelado'
  hoja_entrega_url TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalle de pedidos (qué canales van en cada pedido)
CREATE TABLE IF NOT EXISTS pedido_detalles (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
  canal_id INTEGER REFERENCES canales(id),
  peso_lbs DECIMAL(10, 2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_canales_estado ON canales(estado);
CREATE INDEX idx_canales_riel ON canales(ubicacion_riel);
CREATE INDEX idx_canales_fecha_entrada ON canales(fecha_entrada);
CREATE INDEX idx_subproductos_estado ON subproductos(estado);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_pedido);
