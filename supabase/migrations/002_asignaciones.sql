-- Tabla para asignaciones de choferes y camiones a servicios
CREATE TABLE IF NOT EXISTS asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  chofer_id UUID REFERENCES choferes(id) ON DELETE CASCADE NOT NULL,
  camion_id UUID REFERENCES camiones(id) ON DELETE CASCADE NOT NULL,
  servicio_id UUID REFERENCES servicios(id) ON DELETE CASCADE NOT NULL,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chofer_id, camion_id, servicio_id)
);
