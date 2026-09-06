-- Migration: Add km photos and estado to viajes table
-- Run this in Supabase SQL Editor

-- Add new columns to viajes table
ALTER TABLE viajes
ADD COLUMN IF NOT EXISTS foto_km_inicio TEXT,
ADD COLUMN IF NOT EXISTS foto_km_termino TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'terminado';

-- Update existing viajes to have estado = 'terminado'
UPDATE viajes SET estado = 'terminado' WHERE estado IS NULL;

-- Add constraint to ensure estado is only 'en_curso' or 'terminado'
ALTER TABLE viajes
DROP CONSTRAINT IF EXISTS estado_check;

ALTER TABLE viajes
ADD CONSTRAINT estado_check
CHECK (estado IN ('en_curso', 'terminado'));

-- Add index for faster queries on estado and fecha
CREATE INDEX IF NOT EXISTS idx_viajes_estado_fecha ON viajes(estado, fecha);
CREATE INDEX IF NOT EXISTS idx_viajes_chofer_estado ON viajes(chofer_id, estado);
