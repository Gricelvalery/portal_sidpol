-- =====================================================================
-- SIDPOL · Fase 1 · Índices para las foreign keys sin índice
-- (Supabase → Advisors → Performance → "Unindexed foreign keys").
-- Tablas pequeñas: CREATE INDEX normal es instantáneo. Idempotente.
-- Ejecutado en Supabase el 2026-11-13.
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_dashboards_submodulo         ON public.dashboards (submodulos_id_sm);
CREATE INDEX IF NOT EXISTS idx_modulos_area                 ON public.modulos (id_area);
CREATE INDEX IF NOT EXISTS idx_permisos_dashboard           ON public.permisos (dashboards_id_d);
CREATE INDEX IF NOT EXISTS idx_permisos_submodulo_submodulo ON public.permisos_submodulo (submodulos_id_sm);
CREATE INDEX IF NOT EXISTS idx_posicion_area                ON public.posicion (id_area);
CREATE INDEX IF NOT EXISTS idx_submodulos_modulo            ON public.submodulos (modulos_id_m);
CREATE INDEX IF NOT EXISTS idx_usuario_posicion             ON public.usuario (id_posicion);

-- Índice duplicado (usuario_username_key ya garantiza UNIQUE y sirve de índice)
DROP INDEX IF EXISTS public.usuario_username_uq;
