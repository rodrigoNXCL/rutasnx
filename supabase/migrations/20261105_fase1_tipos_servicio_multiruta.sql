-- ============================================================
-- rutasNX - Fase 1
-- Catálogo de tipos de servicio + soporte multi-ruta
-- ============================================================

-- ------------------------------------------------------------
-- 0. Preflight: evitar que los índices únicos de "ruta abierta"
--    fallen por datos existentes inconsistentes.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.viajes
    WHERE estado = 'en_curso'
    GROUP BY camion_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay camiones con más de una ruta en curso. Cierra las rutas duplicadas antes de aplicar esta migración.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.viajes
    WHERE estado = 'en_curso'
    GROUP BY chofer_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay choferes con más de una ruta en curso. Cierra las rutas duplicadas antes de aplicar esta migración.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1. Catálogo de tipos de servicio por empresa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tipos_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  flujo TEXT NOT NULL CHECK (flujo IN ('simple', 'puntos')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_tipos_servicio_empresa
  ON public.tipos_servicio(empresa_id);

ALTER TABLE public.tipos_servicio ENABLE ROW LEVEL SECURITY;

INSERT INTO public.tipos_servicio (empresa_id, codigo, nombre, flujo)
SELECT e.id, v.codigo, v.nombre, v.flujo
FROM public.empresas e
CROSS JOIN (
  VALUES
    ('reparto', 'Reparto', 'simple'),
    ('fruta', 'Fruta', 'puntos')
) AS v(codigo, nombre, flujo)
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Servicios: tipo de servicio
-- ------------------------------------------------------------
ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS tipo_servicio_id UUID
  REFERENCES public.tipos_servicio(id) ON DELETE RESTRICT;

UPDATE public.servicios s
SET tipo_servicio_id = t.id
FROM public.tipos_servicio t
WHERE s.tipo_servicio_id IS NULL
  AND t.empresa_id = s.empresa_id
  AND t.codigo = 'reparto';

CREATE INDEX IF NOT EXISTS idx_servicios_tipo
  ON public.servicios(tipo_servicio_id);

CREATE OR REPLACE FUNCTION public.set_servicio_tipo_default()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tipo_servicio_id IS NULL THEN
    SELECT t.id
      INTO NEW.tipo_servicio_id
      FROM public.tipos_servicio t
     WHERE t.empresa_id = NEW.empresa_id
       AND t.codigo = 'reparto'
     LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_servicios_tipo_default ON public.servicios;
CREATE TRIGGER trg_servicios_tipo_default
BEFORE INSERT OR UPDATE ON public.servicios
FOR EACH ROW
EXECUTE FUNCTION public.set_servicio_tipo_default();

ALTER TABLE public.servicios
  ALTER COLUMN tipo_servicio_id SET NOT NULL;

-- ------------------------------------------------------------
-- 3. Viajes: snapshots y datos de jornada
-- ------------------------------------------------------------
ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS tipo_servicio_id UUID
  REFERENCES public.tipos_servicio(id) ON DELETE RESTRICT;

ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS cliente_id UUID
  REFERENCES public.clientes(id) ON DELETE SET NULL;

ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS iniciado_at TIMESTAMPTZ;

ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS cerrado_at TIMESTAMPTZ;

ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS cerrado_by UUID
  REFERENCES public.usuarios(id) ON DELETE SET NULL;

UPDATE public.viajes
SET iniciado_at = COALESCE(created_at, now())
WHERE iniciado_at IS NULL;

ALTER TABLE public.viajes
  ALTER COLUMN iniciado_at SET DEFAULT now();

ALTER TABLE public.viajes
  ALTER COLUMN iniciado_at SET NOT NULL;

UPDATE public.viajes v
SET tipo_servicio_id = s.tipo_servicio_id
FROM public.servicios s
WHERE v.tipo_servicio_id IS NULL
  AND v.servicio_id = s.id;

UPDATE public.viajes v
SET tipo_servicio_id = t.id
FROM public.tipos_servicio t
WHERE v.tipo_servicio_id IS NULL
  AND t.empresa_id = v.empresa_id
  AND t.codigo = 'reparto';

UPDATE public.viajes v
SET cliente_id = s.cliente_id
FROM public.servicios s
WHERE v.cliente_id IS NULL
  AND v.servicio_id = s.id;

CREATE OR REPLACE FUNCTION public.set_viaje_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.servicio_id IS NOT NULL THEN
    IF NEW.tipo_servicio_id IS NULL THEN
      SELECT s.tipo_servicio_id
        INTO NEW.tipo_servicio_id
        FROM public.servicios s
       WHERE s.id = NEW.servicio_id;
    END IF;

    IF NEW.cliente_id IS NULL THEN
      SELECT s.cliente_id
        INTO NEW.cliente_id
        FROM public.servicios s
       WHERE s.id = NEW.servicio_id;
    END IF;
  END IF;

  IF NEW.tipo_servicio_id IS NULL THEN
    SELECT t.id
      INTO NEW.tipo_servicio_id
      FROM public.tipos_servicio t
     WHERE t.empresa_id = NEW.empresa_id
       AND t.codigo = 'reparto'
     LIMIT 1;
  END IF;

  IF NEW.iniciado_at IS NULL THEN
    NEW.iniciado_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_viajes_defaults ON public.viajes;
CREATE TRIGGER trg_viajes_defaults
BEFORE INSERT OR UPDATE ON public.viajes
FOR EACH ROW
EXECUTE FUNCTION public.set_viaje_defaults();

ALTER TABLE public.viajes
  ALTER COLUMN tipo_servicio_id SET NOT NULL;

ALTER TABLE public.viajes
  DROP CONSTRAINT IF EXISTS viajes_cliente_si_servicio;

ALTER TABLE public.viajes
  ADD CONSTRAINT viajes_cliente_si_servicio
  CHECK (servicio_id IS NULL OR cliente_id IS NOT NULL);

-- ------------------------------------------------------------
-- 4. Múltiples rutas por camión/día
-- ------------------------------------------------------------
ALTER TABLE public.viajes
  DROP CONSTRAINT IF EXISTS viajes_camion_id_fecha_key;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.viajes'::regclass
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = k.attnum
      ) = ARRAY['camion_id', 'fecha']::text[]
  LOOP
    EXECUTE format('ALTER TABLE public.viajes DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_viajes_camion_en_curso
  ON public.viajes(camion_id)
  WHERE estado = 'en_curso';

CREATE UNIQUE INDEX IF NOT EXISTS ux_viajes_chofer_en_curso
  ON public.viajes(chofer_id)
  WHERE estado = 'en_curso';

CREATE INDEX IF NOT EXISTS idx_viajes_camion_fecha
  ON public.viajes(camion_id, fecha);

CREATE INDEX IF NOT EXISTS idx_viajes_chofer_fecha
  ON public.viajes(chofer_id, fecha);

CREATE INDEX IF NOT EXISTS idx_viajes_cliente_fecha
  ON public.viajes(empresa_id, cliente_id, fecha);

CREATE INDEX IF NOT EXISTS idx_viajes_tipo
  ON public.viajes(tipo_servicio_id);
