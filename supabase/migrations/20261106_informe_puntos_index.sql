-- Optimiza los informes de puntos por cliente y rango de fechas.
-- Filtros usados por /api/cliente/informes/puntos:
--   cliente_id IN (...), estado = 'terminado', fecha BETWEEN ...
CREATE INDEX IF NOT EXISTS idx_viajes_cliente_estado_fecha
  ON public.viajes(cliente_id, estado, fecha);
