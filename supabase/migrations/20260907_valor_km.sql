-- Migration: valorizador de kilometraje (valor por km en rangos de fecha)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS valor_km (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  valor INTEGER NOT NULL CHECK (valor >= 0),
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (fecha_hasta >= fecha_desde)
);

CREATE INDEX IF NOT EXISTS idx_valor_km_empresa ON valor_km(empresa_id);
CREATE INDEX IF NOT EXISTS idx_valor_km_rango ON valor_km(empresa_id, fecha_desde, fecha_hasta);

CREATE TABLE IF NOT EXISTS valor_km_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor_km_id UUID REFERENCES valor_km(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('creado', 'modificado', 'eliminado')),
  valor_anterior INTEGER,
  valor_nuevo INTEGER NOT NULL,
  fecha_desde_anterior DATE,
  fecha_hasta_anterior DATE,
  fecha_desde_nuevo DATE NOT NULL,
  fecha_hasta_nuevo DATE NOT NULL,
  changed_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valor_km_historial_valor ON valor_km_historial(valor_km_id);
CREATE INDEX IF NOT EXISTS idx_valor_km_historial_empresa ON valor_km_historial(empresa_id);

ALTER TABLE valor_km ENABLE ROW LEVEL SECURITY;
ALTER TABLE valor_km_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin puede ver valor_km de su empresa" ON valor_km
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede insertar valor_km" ON valor_km
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede actualizar valor_km" ON valor_km
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede eliminar valor_km" ON valor_km
  FOR DELETE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede ver valor_km_historial de su empresa" ON valor_km_historial
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin puede insertar valor_km_historial" ON valor_km_historial
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
  );
