const db = require('../config/db');

// Los submódulos de configuración solo son accesibles para admin; nunca se asignan.
const ES_CONFIG = `coalesce(s.ruta, '') LIKE 'configuracion/%'`;

const esAdmin = (usuario) => usuario?.rol === 'admin';

const permisoService = {

  esAdmin,

  /** IDs de dashboards que el usuario puede ver (permiso directo o por su submódulo). */
  async dashboardsAccesibles(usuarioId) {
    const result = await db.query(`
      SELECT d.id_d
        FROM dashboards d
       WHERE EXISTS (SELECT 1 FROM permisos p
                      WHERE p.usuario_id_u = $1 AND p.dashboards_id_d = d.id_d)
          OR EXISTS (SELECT 1 FROM permisos_submodulo ps
                      WHERE ps.usuario_id_u = $1 AND ps.submodulos_id_sm = d.submodulos_id_sm)
    `, [usuarioId]);
    return result.rows.map(r => r.id_d);
  },

  /** IDs de submódulos visibles: asignados directamente o que contienen un dashboard permitido. */
  async submodulosAccesibles(usuarioId) {
    const result = await db.query(`
      SELECT s.id_sm
        FROM submodulos s
       WHERE NOT (${ES_CONFIG})
         AND (
           EXISTS (SELECT 1 FROM permisos_submodulo ps
                    WHERE ps.usuario_id_u = $1 AND ps.submodulos_id_sm = s.id_sm)
           OR EXISTS (SELECT 1 FROM permisos p
                        JOIN dashboards d ON d.id_d = p.dashboards_id_d
                       WHERE p.usuario_id_u = $1 AND d.submodulos_id_sm = s.id_sm)
         )
    `, [usuarioId]);
    return result.rows.map(r => r.id_sm);
  },

  async tieneAcceso(usuario, tipo, id) {
    if (esAdmin(usuario)) return true;
    const ids = tipo === 'dashboard'
      ? await this.dashboardsAccesibles(usuario.id)
      : await this.submodulosAccesibles(usuario.id);
    return ids.includes(id);
  },

  /** IDs (de la lista dada) que son submódulos de configuración. */
  async submodulosDeConfiguracion(ids) {
    if (!ids.length) return [];
    const result = await db.query(
      `SELECT s.id_sm FROM submodulos s WHERE s.id_sm = ANY($1::int[]) AND ${ES_CONFIG}`,
      [ids]
    );
    return result.rows.map(r => r.id_sm);
  }

};

module.exports = permisoService;
