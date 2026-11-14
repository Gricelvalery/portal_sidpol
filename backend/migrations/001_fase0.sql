-- =====================================================================
-- SIDPOL · Migración Fase 0
--  - Contraseñas a bcrypt (cost 12)
--  - Nombres separados (nombres / apellido paterno / apellido materno)
--  - Roles normalizados a 'admin' / 'user'
--  - Correo institucional username@sidpol.pe
--  - Permisos por submódulo
--
-- Ejecutar completo en Supabase → SQL Editor (hacer backup antes).
-- Corre en una sola transacción y es idempotente (se puede re-ejecutar).
-- =====================================================================
BEGIN;

-- 0. Respaldo de los datos que se van a sobrescribir (SIN contraseñas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '_backup_usuario_fase0') THEN
    EXECUTE $q$
      CREATE TABLE public._backup_usuario_fase0 AS
      SELECT id_u, nombre_u, apellido_u, correo_u, rol_u, username, now() AS respaldado_en
      FROM public.usuario
    $q$;
    EXECUTE 'ALTER TABLE public._backup_usuario_fase0 ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 1. Contraseñas → bcrypt cost 12 (solo las que aún no son hash)
ALTER TABLE public.usuario ALTER COLUMN contrasenia_u TYPE varchar(72);
UPDATE public.usuario
   SET contrasenia_u = extensions.crypt(contrasenia_u, extensions.gen_salt('bf', 12))
 WHERE contrasenia_u !~ '^\$2[aby]\$';

-- 2. Nombres separados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'usuario' AND column_name = 'nombre_u') THEN
    ALTER TABLE public.usuario RENAME COLUMN nombre_u TO nombres_u;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'usuario' AND column_name = 'apellido_u') THEN
    ALTER TABLE public.usuario RENAME COLUMN apellido_u TO apellido_paterno_u;
  END IF;
END $$;
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS apellido_materno_u varchar(100);

-- 3. Roles normalizados; todo usuario nuevo nace como 'user'
UPDATE public.usuario SET rol_u = lower(rol_u) WHERE rol_u <> lower(rol_u);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuario_rol_chk') THEN
    ALTER TABLE public.usuario ADD CONSTRAINT usuario_rol_chk CHECK (rol_u IN ('admin', 'user'));
  END IF;
END $$;
ALTER TABLE public.usuario ALTER COLUMN rol_u SET DEFAULT 'user';

-- 4. Username obligatorio (se conservan los actuales) + correo institucional
ALTER TABLE public.usuario ALTER COLUMN username SET NOT NULL;
UPDATE public.usuario
   SET correo_u = username || '@sidpol.pe'
 WHERE correo_u IS DISTINCT FROM username || '@sidpol.pe';
-- usuario_correo_u_key (UNIQUE) y usuario_username_key (UNIQUE) ya existen

-- 5. Permisos por submódulo + evitar duplicados en permisos por dashboard
CREATE TABLE IF NOT EXISTS public.permisos_submodulo (
  id_ps            serial PRIMARY KEY,
  usuario_id_u     int NOT NULL REFERENCES public.usuario(id_u)     ON DELETE CASCADE,
  submodulos_id_sm int NOT NULL REFERENCES public.submodulos(id_sm) ON DELETE CASCADE,
  UNIQUE (usuario_id_u, submodulos_id_sm)
);
ALTER TABLE public.permisos_submodulo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permisos_usuario_dashboard_uq') THEN
    ALTER TABLE public.permisos
      ADD CONSTRAINT permisos_usuario_dashboard_uq UNIQUE (usuario_id_u, dashboards_id_d);
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificación (ejecutar después; debe dar 0 en sin_hash y 0 en correo_mal)
-- ---------------------------------------------------------------------
-- SELECT count(*) FILTER (WHERE contrasenia_u !~ '^\$2[aby]\$')        AS sin_hash,
--        count(*) FILTER (WHERE correo_u <> username || '@sidpol.pe')   AS correo_mal,
--        count(*) FILTER (WHERE rol_u = 'admin')                       AS admins,
--        count(*) FILTER (WHERE rol_u = 'user')                        AS users
--   FROM public.usuario;
