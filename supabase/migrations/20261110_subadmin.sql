-- ============================================================
-- Subadmin por empresa: rol + camiones asignados
-- ============================================================

BEGIN;

-- 1) Permitir el rol 'subadmin'
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('superadmin', 'admin', 'subadmin', 'chofer', 'cliente'));

-- 2) Camiones asignados a cada subadmin
CREATE TABLE IF NOT EXISTS public.subadmin_camiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  subadmin_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  camion_id uuid NOT NULL REFERENCES public.camiones(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subadmin_id, camion_id)
);

CREATE INDEX IF NOT EXISTS idx_subadmin_camiones_subadmin
  ON public.subadmin_camiones(subadmin_id);

CREATE INDEX IF NOT EXISTS idx_subadmin_camiones_camion
  ON public.subadmin_camiones(camion_id);

ALTER TABLE public.subadmin_camiones ENABLE ROW LEVEL SECURITY;

COMMIT;
