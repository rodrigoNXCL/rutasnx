-- ============================================================
-- rutasNX - Fase 2
-- Puntos de viaje, historial de auditoría y evidencias de guía
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Puntos de viaje
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.viaje_puntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  orden INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('retiro', 'entrega')),
  nombre_punto TEXT NOT NULL,
  nombre_punto_normalizado TEXT NOT NULL,
  km_llegada INTEGER NOT NULL,
  foto_guia_url TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  anulado BOOLEAN NOT NULL DEFAULT false,
  anulado_at TIMESTAMPTZ,
  anulado_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  UNIQUE (viaje_id, orden)
);

CREATE INDEX IF NOT EXISTS idx_viaje_puntos_viaje
  ON public.viaje_puntos(viaje_id, orden);

CREATE INDEX IF NOT EXISTS idx_viaje_puntos_cliente
  ON public.viaje_puntos(empresa_id, cliente_id, nombre_punto_normalizado);

CREATE INDEX IF NOT EXISTS idx_viaje_puntos_vigentes
  ON public.viaje_puntos(viaje_id, orden)
  WHERE anulado = false;

CREATE OR REPLACE FUNCTION public.set_viaje_punto_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.empresa_id IS NULL OR NEW.cliente_id IS NULL THEN
    SELECT v.empresa_id, v.cliente_id
      INTO NEW.empresa_id, NEW.cliente_id
      FROM public.viajes v
     WHERE v.id = NEW.viaje_id;
  END IF;

  IF NEW.nombre_punto_normalizado IS NULL OR NEW.nombre_punto_normalizado = '' THEN
    NEW.nombre_punto_normalizado := lower(trim(NEW.nombre_punto));
  END IF;

  IF NEW.captured_at IS NULL THEN
    NEW.captured_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_viaje_puntos_defaults ON public.viaje_puntos;
CREATE TRIGGER trg_viaje_puntos_defaults
BEFORE INSERT OR UPDATE ON public.viaje_puntos
FOR EACH ROW
EXECUTE FUNCTION public.set_viaje_punto_defaults();

ALTER TABLE public.viaje_puntos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. Historial de puntos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.viaje_punto_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_id UUID NOT NULL REFERENCES public.viaje_puntos(id) ON DELETE CASCADE,
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  accion TEXT NOT NULL CHECK (accion IN ('modificado', 'anulado')),
  orden_anterior INTEGER,
  orden_nuevo INTEGER,
  tipo_anterior TEXT,
  tipo_nuevo TEXT,
  nombre_punto_anterior TEXT,
  nombre_punto_nuevo TEXT,
  nombre_punto_normalizado_anterior TEXT,
  nombre_punto_normalizado_nuevo TEXT,
  km_llegada_anterior INTEGER,
  km_llegada_nuevo INTEGER,
  foto_guia_url_anterior TEXT,
  foto_guia_url_nuevo TEXT,
  motivo TEXT NOT NULL,
  changed_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viaje_punto_historial_punto
  ON public.viaje_punto_historial(punto_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_viaje_punto_historial_viaje
  ON public.viaje_punto_historial(viaje_id, changed_at DESC);

ALTER TABLE public.viaje_punto_historial ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. Historial de viajes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.viaje_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  accion TEXT NOT NULL CHECK (accion IN ('creado', 'modificado', 'cerrado')),
  km_inicio_anterior INTEGER,
  km_inicio_nuevo INTEGER,
  km_termino_anterior INTEGER,
  km_termino_nuevo INTEGER,
  foto_km_inicio_anterior TEXT,
  foto_km_inicio_nuevo TEXT,
  foto_km_termino_anterior TEXT,
  foto_km_termino_nuevo TEXT,
  observaciones_anterior TEXT,
  observaciones_nuevo TEXT,
  estado_anterior TEXT,
  estado_nuevo TEXT,
  motivo TEXT,
  changed_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viaje_historial_viaje
  ON public.viaje_historial(viaje_id, changed_at DESC);

ALTER TABLE public.viaje_historial ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. Evidencias de guía
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('guias', 'guias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

COMMIT;
