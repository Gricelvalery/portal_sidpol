const db = require('../config/db');

// Los submódulos de configuración solo son accesibles para admin; nunca se asignan.
const ES_CONFIG = `coalesce(s.ruta, '') LIKE 'configuracion/%'`;

/**
 * ÚNICA consulta de accesos efectivos de un usuario ($1 = id_u). Devuelve filas (tipo, id):
 *  - dashboard: con permiso directo o cuyo submódulo está asignado.
 *  - submodulo: asignado directamente o que contiene un dashboard accesible
 *    (los de configuración se excluyen siempre).
 * La usan tanto los listados como checkPermission.
 */
const SQL_ACCESOS = `
  WITH subs_asignados AS (
         SELECT submodulos_id_sm AS id_sm FROM permisos_submodulo WHERE usuario_id_u = $1
       ),
       dashboards_acc AS (
         SELECT d.id_d, d.submodulos_id_sm
           FROM dashboards d
          WHERE d.id_d IN (SELECT dashboards_id_d FROM permisos WHERE usuario_id_u = $1)
             OR d.submodulos_id_sm IN (SELECT id_sm FROM subs_asignados)
       ),
       submodulos_acc AS (
         SELECT s.id_sm
           FROM submodulos s
          WHERE NOT (${ES_CONFIG})
            AND (s.id_sm IN (SELECT id_sm FROM subs_asignados)
                 OR s.id_sm IN (SELECT submodulos_id_sm FROM dashboards_acc))
       )
  SELECT 'dashboard' AS tipo, id_d AS id FROM dashboards_acc
  UNION ALL
  SELECT 'submodulo' AS tipo, id_sm AS id FROM submodulos_acc`;

const permisoRepository = {
  /** Accesos efectivos: { submodulos: [ids], dashboards: [ids] } */
  async accesos(usuarioId, ejecutor = db) {
    const { rows } = await ejecutor.query(SQL_ACCESOS, [usuarioId]);
    return {
      submodulos: rows.filter((r) => r.tipo === 'submodulo').map((r) => r.id),
      dashboards: rows.filter((r) => r.tipo === 'dashboard').map((r) => r.id),
    };
  },

  /** ¿Tiene acceso a ese submódulo/dashboard? Reutiliza la misma consulta base. */
  async tieneAcceso(usuarioId, tipo, id, ejecutor = db) {
    const { rows } = await ejecutor.query(
      `SELECT EXISTS (SELECT 1 FROM (${SQL_ACCESOS}) a WHERE a.tipo = $2 AND a.id = $3) AS ok`,
      [usuarioId, tipo, id],
    );
    return rows[0].ok;
  },

  /** Permisos asignados explícitamente (lo que ve y edita el admin). */
  async asignados(usuarioId, ejecutor = db) {
    const { rows } = await ejecutor.query(
      `
      SELECT 'submodulo' AS tipo, submodulos_id_sm AS id FROM permisos_submodulo WHERE usuario_id_u = $1
      UNION ALL
      SELECT 'dashboard' AS tipo, dashboards_id_d AS id FROM permisos WHERE usuario_id_u = $1`,
      [usuarioId],
    );
    return {
      submodulos_ids: rows.filter((r) => r.tipo === 'submodulo').map((r) => r.id),
      dashboards_ids: rows.filter((r) => r.tipo === 'dashboard').map((r) => r.id),
    };
  },

  /** Reemplaza todos los permisos del usuario. Usar dentro de una transacción. */
  async reemplazar(usuarioId, submodulosIds, dashboardsIds, ejecutor) {
    await this.eliminarDeUsuario(usuarioId, ejecutor);
    if (submodulosIds.length) {
      await ejecutor.query(
        'INSERT INTO permisos_submodulo (usuario_id_u, submodulos_id_sm) SELECT $1, unnest($2::int[])',
        [usuarioId, submodulosIds],
      );
    }
    if (dashboardsIds.length) {
      await ejecutor.query(
        'INSERT INTO permisos (usuario_id_u, dashboards_id_d) SELECT $1, unnest($2::int[])',
        [usuarioId, dashboardsIds],
      );
    }
  },

  async eliminarDeUsuario(usuarioId, ejecutor) {
    await ejecutor.query('DELETE FROM permisos_submodulo WHERE usuario_id_u = $1', [usuarioId]);
    await ejecutor.query('DELETE FROM permisos WHERE usuario_id_u = $1', [usuarioId]);
  },

  /** De los ids dados, cuáles son submódulos de configuración. */
  async submodulosDeConfiguracion(ids, ejecutor = db) {
    if (!ids.length) return [];
    const { rows } = await ejecutor.query(
      `SELECT s.id_sm FROM submodulos s WHERE s.id_sm = ANY($1::int[]) AND ${ES_CONFIG}`,
      [ids],
    );
    return rows.map((r) => r.id_sm);
  },
};

module.exports = permisoRepository;
