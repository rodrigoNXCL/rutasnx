-- Migration: vincular clientes existentes con sus usuarios (rol='cliente')
-- Los usuarios de cliente se crean con email = RUT del cliente (ver api/clientes POST).

-- 1) Backfill: enlaza cada cliente que ya tiene cuenta de usuario
UPDATE clientes c
SET usuario_id = u.id
FROM usuarios u
WHERE c.usuario_id IS NULL
  AND u.rol = 'cliente'
  AND u.empresa_id = c.empresa_id
  AND (
    regexp_replace(lower(trim(u.email)), '[.-]', '', 'g') = regexp_replace(lower(trim(c.rut)), '[.-]', '', 'g')
    OR lower(trim(u.email)) = lower(trim(c.email))
  );

-- 2) Verificación: clientes que quedaron sin usuario (faltan sus cuentas)
SELECT c.id, c.nombre, c.rut, c.email
FROM clientes c
WHERE c.usuario_id IS NULL;