ALTER TABLE viaje_puntos
  ADD COLUMN IF NOT EXISTS archivos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE viaje_punto_historial
  ADD COLUMN IF NOT EXISTS archivos_anterior jsonb,
  ADD COLUMN IF NOT EXISTS archivos_nuevo jsonb;

UPDATE viaje_puntos
SET archivos = jsonb_build_array(
  jsonb_build_object(
    'url', foto_guia_url,
    'nombre', 'Guía',
    'tipo', CASE
      WHEN split_part(foto_guia_url, '?', 1) ILIKE '%.pdf' THEN 'application/pdf'
      WHEN split_part(foto_guia_url, '?', 1) ILIKE '%.png' THEN 'image/png'
      WHEN split_part(foto_guia_url, '?', 1) ILIKE '%.webp' THEN 'image/webp'
      ELSE 'image/jpeg'
    END
  )
)
WHERE (archivos IS NULL OR archivos = '[]'::jsonb)
  AND foto_guia_url IS NOT NULL
  AND btrim(foto_guia_url) <> '';

COMMENT ON COLUMN viaje_puntos.archivos IS 'Archivos del punto: [{url, nombre, tipo}]';
COMMENT ON COLUMN viaje_punto_historial.archivos_anterior IS 'Archivos antes de la corrección';
COMMENT ON COLUMN viaje_punto_historial.archivos_nuevo IS 'Archivos después de la corrección';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'guias';
