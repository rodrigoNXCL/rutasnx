-- =============================================
-- rutasNX v2.0 - Migración Multi-Tenant
-- =============================================

-- 0. Eliminar tablas antiguas (si existen)
DROP TABLE IF EXISTS gastos CASCADE;
DROP TABLE IF EXISTS viajes CASCADE;
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS camiones CASCADE;
DROP TABLE IF EXISTS choferes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS transportistas CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- 1. Tabla EMPRESAS (tenants)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla USUARIOS (auth propia)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'chofer', 'cliente')),
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla CHOFERES (vinculada a usuario)
CREATE TABLE IF NOT EXISTS choferes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE,
  licencia TEXT,
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla CAMIONES
CREATE TABLE IF NOT EXISTS camiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  patente TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, patente)
);

-- 5. Tabla CLIENTES/MANDANTES
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  rut TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabla SERVICIOS (contratos con clientes)
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  origen TEXT,
  destino TEXT,
  precio_km NUMERIC(10, 2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabla VIAJES
CREATE TABLE IF NOT EXISTS viajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  chofer_id UUID REFERENCES choferes(id) ON DELETE CASCADE NOT NULL,
  camion_id UUID REFERENCES camiones(id) ON DELETE CASCADE NOT NULL,
  servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  km_inicio INTEGER NOT NULL,
  km_termino INTEGER NOT NULL CHECK (km_termino >= km_inicio),
  ruta TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(camion_id, fecha)
);

-- 8. Tabla GASTOS
CREATE TABLE IF NOT EXISTS gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  viaje_id UUID REFERENCES viajes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('combustible', 'peaje', 'comida', 'mecanico', 'otro')),
  monto INTEGER NOT NULL CHECK (monto >= 0),
  descripcion TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_choferes_empresa ON choferes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_choferes_usuario ON choferes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_camiones_empresa ON camiones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicios_empresa ON servicios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicios_cliente ON servicios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_viajes_empresa ON viajes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_viajes_chofer ON viajes(chofer_id);
CREATE INDEX IF NOT EXISTS idx_viajes_camion ON viajes(camion_id);
CREATE INDEX IF NOT EXISTS idx_viajes_fecha ON viajes(fecha);
CREATE INDEX IF NOT EXISTS idx_viajes_servicio ON viajes(servicio_id);
CREATE INDEX IF NOT EXISTS idx_gastos_empresa ON gastos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gastos_viaje ON gastos(viaje_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE choferes ENABLE ROW LEVEL SECURITY;
ALTER TABLE camiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- EMPRESAS: solo superadmin ve todas
CREATE POLICY "superadmin puede leer empresas" ON empresas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'superadmin')
  );

CREATE POLICY "superadmin puede insertar empresas" ON empresas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'superadmin')
  );

CREATE POLICY "superadmin puede actualizar empresas" ON empresas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'superadmin')
  );

-- USUARIOS: superadmin ve todo, admins ven solo su empresa
CREATE POLICY "usuarios pueden leer sus propios datos" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios pueden ver compañeros de empresa" ON usuarios
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY "superadmin puede insertar usuarios" ON usuarios
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'superadmin')
  );

CREATE POLICY "admin puede crear usuarios de su empresa" ON usuarios
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin' AND usuarios.empresa_id = empresa_id))
    OR
    (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'superadmin'))
  );

CREATE POLICY "usuarios pueden actualizar sus propios datos" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admin puede actualizar usuarios de su empresa" ON usuarios
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- CHOFERES: admins ven su empresa, choferes ven su propio registro
CREATE POLICY "admin puede leer choferes de su empresa" ON choferes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "chofer puede leer su propio registro" ON choferes
  FOR SELECT USING (
    usuario_id = auth.uid()
  );

CREATE POLICY "admin puede insertar choferes" ON choferes
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede actualizar choferes" ON choferes
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- CAMIONES: admins ven su empresa
CREATE POLICY "admin puede leer camiones de su empresa" ON camiones
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin', 'chofer'))
  );

CREATE POLICY "admin puede insertar camiones" ON camiones
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede actualizar camiones" ON camiones
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- CLIENTES: admins ven su empresa, clientes ven su propio registro
CREATE POLICY "admin puede leer clientes de su empresa" ON clientes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "cliente puede leer su propio registro" ON clientes
  FOR SELECT USING (
    id IN (SELECT cliente_id FROM servicios WHERE id = servicios.id)
  );

CREATE POLICY "admin puede insertar clientes" ON clientes
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede actualizar clientes" ON clientes
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- SERVICIOS: admins ven su empresa, clientes ven servicios contratados
CREATE POLICY "admin puede leer servicios de su empresa" ON servicios
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "cliente puede leer sus servicios" ON servicios
  FOR SELECT USING (
    cliente_id IN (
      SELECT c.id FROM clientes c
      JOIN servicios s ON s.cliente_id = c.id
      WHERE c.empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );

CREATE POLICY "admin puede insertar servicios" ON servicios
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede actualizar servicios" ON servicios
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- VIAJES: admins ven su empresa, choferes ven sus propios
CREATE POLICY "admin puede leer viajes de su empresa" ON viajes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "chofer puede leer sus propios viajes" ON viajes
  FOR SELECT USING (
    chofer_id IN (SELECT id FROM choferes WHERE usuario_id = auth.uid())
  );

CREATE POLICY "cliente puede leer viajes de sus servicios" ON viajes
  FOR SELECT USING (
    servicio_id IN (
      SELECT s.id FROM servicios s
      JOIN clientes c ON c.id = s.cliente_id
      WHERE c.empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );

CREATE POLICY "chofer puede insertar viajes" ON viajes
  FOR INSERT WITH CHECK (
    chofer_id IN (SELECT id FROM choferes WHERE usuario_id = auth.uid())
  );

CREATE POLICY "admin puede insertar viajes" ON viajes
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "chofer puede actualizar sus propios viajes" ON viajes
  FOR UPDATE USING (
    chofer_id IN (SELECT id FROM choferes WHERE usuario_id = auth.uid())
  );

CREATE POLICY "admin puede actualizar viajes" ON viajes
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- GASTOS: igual que viajes
CREATE POLICY "admin puede leer gastos de su empresa" ON gastos
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "chofer puede leer gastos de sus viajes" ON gastos
  FOR SELECT USING (
    viaje_id IN (SELECT id FROM viajes WHERE chofer_id IN (SELECT id FROM choferes WHERE usuario_id = auth.uid()))
  );

CREATE POLICY "cliente puede leer gastos de sus servicios" ON gastos
  FOR SELECT USING (
    viaje_id IN (
      SELECT v.id FROM viajes v
      JOIN servicios s ON s.id = v.servicio_id
      JOIN clientes c ON c.id = s.cliente_id
      WHERE c.empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );

CREATE POLICY "chofer puede insertar gastos" ON gastos
  FOR INSERT WITH CHECK (
    viaje_id IN (SELECT id FROM viajes WHERE chofer_id IN (SELECT id FROM choferes WHERE usuario_id = auth.uid()))
  );

CREATE POLICY "admin puede insertar gastos" ON gastos
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "chofer puede actualizar gastos de sus viajes" ON gastos
  FOR UPDATE USING (
    viaje_id IN (SELECT id FROM viajes WHERE chofer_id IN (SELECT id FROM choferes WHERE usuario_id = auth.uid()))
  );

CREATE POLICY "admin puede actualizar gastos" ON gastos
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

-- =============================================
-- STORAGE (Bucket para fotos de gastos)
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gastos', 'gastos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuarios autenticados pueden subir fotos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gastos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Usuarios pueden leer sus propias fotos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'gastos' AND
    auth.uid() = owner
  );

CREATE POLICY "Usuarios pueden eliminar sus fotos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gastos' AND
    auth.uid() = owner
  );

CREATE POLICY "Admins pueden leer todas las fotos de su empresa" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'gastos' AND
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol IN ('admin', 'superadmin'))
  );
