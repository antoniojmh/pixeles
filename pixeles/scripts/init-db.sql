-- ============================================
-- PIXELES - Inicialización de Base de Datos
-- ============================================

-- Tabla de juegos (catálogo)
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de consolas
CREATE TABLE IF NOT EXISTS consoles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'occupied', 'reserved', 'maintenance')),
  current_game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  current_session_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  console_id INTEGER NOT NULL REFERENCES consoles(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  client_name VARCHAR(100) DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_console_id ON sessions(console_id);
CREATE INDEX IF NOT EXISTS idx_consoles_status ON consoles(status);

-- ============================================
-- Datos por defecto
-- ============================================

-- Juegos iniciales
INSERT INTO games (name) VALUES
  ('Fortnite'),
  ('Warzone'),
  ('Rocket League'),
  ('Valorant'),
  ('eFootball'),
  ('Halo Infinite'),
  ('Marvel Rivals'),
  ('Brawlhalla'),
  ('Apex Legends'),
  ('Minecraft'),
  ('FIFA'),
  ('GTA V')
ON CONFLICT (name) DO NOTHING;

-- Consolas iniciales (4 Xbox)
INSERT INTO consoles (name, number, status) VALUES
  ('Xbox 1', 1, 'free'),
  ('Xbox 2', 2, 'free'),
  ('Xbox 3', 3, 'free'),
  ('Xbox 4', 4, 'free')
ON CONFLICT (number) DO NOTHING;

-- Configuración inicial
INSERT INTO settings (key, value) VALUES
  ('prices', '{"30":5,"60":10,"90":14,"120":18}'),
  ('currency', 'Q'),
  ('business_name', 'PIXELES'),
  ('alert_minutes', '5')
ON CONFLICT (key) DO NOTHING;
