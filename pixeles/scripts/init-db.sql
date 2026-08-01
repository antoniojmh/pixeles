-- ============================================
-- PIXELES - Inicialización de Base de Datos
-- Esquema ampliado: multi-sucursal + negocio completo
-- ============================================

-- ============================================
-- Tablas base (existen en DB actual; IF NOT EXISTS para frescas)
-- ============================================
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  genre VARCHAR(60) DEFAULT '',
  platform VARCHAR(40) DEFAULT '',
  price_per_hour DECIMAL(10,2) DEFAULT 0,
  image_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consoles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL DEFAULT 'free',
  current_game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  current_session_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  console_id INTEGER NOT NULL REFERENCES consoles(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  client_name VARCHAR(100) DEFAULT '',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Sucursales (cadena multi-ubicación)
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  address VARCHAR(255) DEFAULT '',
  phone VARCHAR(40) DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Juegos (catálogo) - ampliar columnas (ignora si ya existen)
-- NOTA: para la DB actual, games ya existe; agregamos columnas nuevas
-- ============================================
ALTER TABLE games ADD COLUMN IF NOT EXISTS genre VARCHAR(60) DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS platform VARCHAR(40) DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2) DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================
-- Usuarios (empleados / administradores)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) DEFAULT '',
  role VARCHAR(30) NOT NULL DEFAULT 'operator'
    CHECK (role IN ('superadmin','admin','operator','viewer')),
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Juegos (catálogo) - No duplicar definición (ya está arriba)
-- ============================================

-- ============================================
-- Consolas / Estaciones (consoles + PCs unificados)
-- Se extiende la tabla existente para no romper el backend actual.
-- ============================================
ALTER TABLE consoles ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE consoles ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'console';
ALTER TABLE consoles ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- Ampliar CHECK de status (agregar estados nuevos: off, no_internet, error)
ALTER TABLE consoles DROP CONSTRAINT IF EXISTS consoles_status_check;
ALTER TABLE consoles ADD CONSTRAINT consoles_status_check
  CHECK (status IN ('free','occupied','reserved','maintenance','off','no_internet','error'));

-- ============================================
-- Sesiones
-- ============================================
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pause_started_at TIMESTAMP;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paused_seconds INTEGER DEFAULT 0;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('active','paused','completed','cancelled'));

-- ============================================
-- Clientes (fidelización / historial)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) DEFAULT '',
  email VARCHAR(120) DEFAULT '',
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Ventas (POS)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash'
    CHECK (payment_method IN ('cash','card','transfer','points')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name VARCHAR(120) DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- ============================================
-- Inventario (bebidas / snacks / productos)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'snacks'
    CHECK (category IN ('drinks','snacks','food','other')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  image_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Reservas
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  console_id INTEGER REFERENCES consoles(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  notes TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled','no_show')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Logs de auditoría
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(60) NOT NULL DEFAULT '',
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Configuración (NULL branch_id = global)
-- ============================================
ALTER TABLE settings ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE;

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consoles_branch ON consoles(branch_id);
CREATE INDEX IF NOT EXISTS idx_consoles_status ON consoles(status);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_console_id ON sessions(console_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_reservations_console ON reservations(console_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- Datos por defecto
-- ============================================

-- Sucursal principal
INSERT INTO branches (name, address) VALUES ('Sucursal Principal', '')
ON CONFLICT (name) DO NOTHING;

-- Juegos iniciales
INSERT INTO games (name) VALUES
  ('Fortnite'), ('Warzone'), ('Rocket League'), ('Valorant'),
  ('eFootball'), ('Halo Infinite'), ('Marvel Rivals'), ('Brawlhalla'),
  ('Apex Legends'), ('Minecraft'), ('FIFA'), ('GTA V')
ON CONFLICT (name) DO NOTHING;

-- Asignar consolas existentes a la sucursal principal
UPDATE consoles SET branch_id = (SELECT id FROM branches WHERE name='Sucursal Principal')
WHERE branch_id IS NULL;

-- Productos iniciales (inventario) en la sucursal principal
INSERT INTO products (branch_id, name, category, price, stock)
SELECT b.id, p.name, p.cat, p.price, p.stock
FROM branches b, (VALUES
  ('Coca Cola','drinks',5.00,30),
  ('Agua Pura','drinks',3.00,40),
  ('Fanta','drinks',5.00,25),
  ('Sprite','drinks',5.00,25),
  ('Papas Fritas','snacks',7.00,20),
  ('Doritos','snacks',8.00,20),
  ('Churros','snacks',5.00,30),
  ('Galletas','snacks',4.00,30)
) AS p(name, category, price, stock)
WHERE b.name = 'Sucursal Principal'
AND NOT EXISTS (SELECT 1 FROM products pr WHERE pr.name = p.name);

-- Configuración de la sucursal principal
INSERT INTO settings (key, value, branch_id)
SELECT 'prices', '{"30":5,"60":10,"90":14,"120":18}', b.id
FROM branches b WHERE b.name='Sucursal Principal'
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, branch_id)
SELECT 'currency', 'Q', b.id
FROM branches b WHERE b.name='Sucursal Principal'
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, branch_id)
SELECT 'business_name', 'PIXELES', b.id
FROM branches b WHERE b.name='Sucursal Principal'
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, branch_id)
SELECT 'alert_minutes', '5', b.id
FROM branches b WHERE b.name='Sucursal Principal'
ON CONFLICT (key) DO NOTHING;
