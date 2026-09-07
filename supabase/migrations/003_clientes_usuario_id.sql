-- Migration: vínculo cliente ↔ usuario (portal cliente)
-- Run this in Supabase SQL Editor

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON clientes(usuario_id);