-- =====================================================================
-- SIDPOL · S8 · Row Level Security
-- Activa RLS en TODAS las tablas de public y quita el acceso de la API
-- pública de Supabase (roles anon / authenticated).
-- El backend se conecta como postgres (bypassrls), así que no se ve afectado.
-- El frontend Angular no usa supabase-js.
-- =====================================================================
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Tablas / secuencias / funciones futuras tampoco nacen expuestas
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Verificación: todas deben salir con rls = true
-- SELECT c.relname, c.relrowsecurity AS rls
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--  WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;
