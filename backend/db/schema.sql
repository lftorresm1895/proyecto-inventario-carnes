CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  telefono TEXT,
  email TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos_agendados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  dia TEXT NOT NULL,
  cantidad_canales INTEGER NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_canal INTEGER,
  peso_lbs REAL NOT NULL,
  clasificacion TEXT,
  ubicacion_riel INTEGER NOT NULL,
  fecha_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_salida DATETIME,
  cliente_id INTEGER REFERENCES clientes(id),
  estado TEXT DEFAULT 'en_reefer',
  observaciones TEXT
);

CREATE TABLE IF NOT EXISTS subproductos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  peso_lbs REAL NOT NULL,
  ubicacion TEXT DEFAULT 'reefer',
  fecha_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_salida DATETIME,
  cliente_id INTEGER REFERENCES clientes(id),
  estado TEXT DEFAULT 'disponible',
  observaciones TEXT
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  fecha_pedido TEXT NOT NULL,
  cantidad_canales INTEGER NOT NULL,
  peso_total_lbs REAL,
  estado TEXT DEFAULT 'pendiente',
  hoja_entrega_url TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedido_detalles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
  canal_id INTEGER REFERENCES canales(id),
  peso_lbs REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_canales_estado ON canales(estado);
CREATE INDEX IF NOT EXISTS idx_canales_riel ON canales(ubicacion_riel);
CREATE INDEX IF NOT EXISTS idx_canales_fecha ON canales(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_subproductos_estado ON subproductos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
