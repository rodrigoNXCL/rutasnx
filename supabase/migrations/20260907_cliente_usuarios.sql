-- Migration: multi-usuario por cliente (tabla de relación cliente ↔ usuarios)
-- Permite asociar más de un usuario de login a un mismo cliente.
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cliente_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_cliente ON cliente_usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_usuario ON cliente_usuarios(usuario_id);

-- Backfill: enlaza los clientes que ya tienen usuario_id (migración 003/004)
INSERT INTO cliente_usuarios (cliente_id, usuario_id)
SELECT c.id, c.usuario_id
FROM clientes c
WHERE c.usuario_id IS NOT NULL
ON CONFLICT (cliente_id, usuario_id) DO NOTHING;

ALTER TABLE cliente_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin puede ver cliente_usuarios de su empresa" ON cliente_usuarios
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')
      )
    )
  );

CREATE POLICY "admin puede insertar cliente_usuarios" ON cliente_usuarios
  FOR INSERT WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')
      )
    )
  );

CREATE POLICY "admin puede eliminar cliente_usuarios" ON cliente_usuarios
  FOR DELETE USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')
      )
    )
  );
