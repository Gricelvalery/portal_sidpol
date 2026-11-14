const { body } = require('express-validator');
const env = require('../config/env');
const { validar, idParam } = require('../middlewares/validacion');
const { esUrlDashboardPermitida } = require('../utils/urlDashboard');

// Los largos máximos coinciden con las columnas de la BD
const textoObligatorio = (campo, mensaje, max) =>
  body(campo)
    .isString()
    .withMessage(mensaje)
    .trim()
    .notEmpty()
    .withMessage(mensaje)
    .isLength({ max })
    .withMessage(`Máximo ${max} caracteres`);

const textoOpcional = (campo, max) =>
  body(campo)
    .optional({ values: 'null' })
    .isString()
    .withMessage('Valor inválido')
    .trim()
    .isLength({ max })
    .withMessage(`Máximo ${max} caracteres`)
    // Un opcional vacío o con solo espacios se guarda como null, no como ''
    .customSanitizer((valor) => (valor === '' ? null : valor));

const enteroObligatorio = (campo, mensaje) =>
  body(campo).isInt({ min: 1 }).withMessage(mensaje).toInt();

const areaCampos = [
  textoObligatorio('nombre_area', 'El nombre del área es requerido', 100),
  textoObligatorio('descripcion_area', 'La descripción del área es requerida', 255),
];

const moduloCampos = [
  textoObligatorio('nombre_m', 'El nombre del módulo es requerido', 100),
  textoObligatorio('descripcion_m', 'La descripción del módulo es requerida', 200),
  enteroObligatorio('id_area', 'El área es requerida'),
];

const submoduloCampos = [
  textoObligatorio('nombre_sm', 'El nombre del submódulo es requerido', 45),
  textoObligatorio('descripcion_sm', 'La descripción del submódulo es requerida', 255),
  enteroObligatorio('modulos_id_m', 'El módulo es requerido'),
];

const dashboardCampos = [
  textoObligatorio('nombre_d', 'El nombre del dashboard es requerido', 100),
  body('link_d')
    .isString()
    .withMessage('El link es requerido')
    .trim()
    .notEmpty()
    .withMessage('El link es requerido')
    .isLength({ max: 500 })
    .withMessage('Máximo 500 caracteres')
    .custom((link) => esUrlDashboardPermitida(link))
    .withMessage(`El link debe ser un enlace https de Power BI (${env.POWERBI_HOSTS.join(', ')})`),
  enteroObligatorio('submodulos_id_sm', 'El submódulo es requerido'),
  // paginas: [{ nombre, seccion }]. "seccion" se concatena en la URL de Power BI.
  body('paginas')
    .optional({ values: 'null' })
    .isArray({ max: 50 })
    .withMessage('Las páginas deben ser una lista (máximo 50)'),
  body('paginas.*.nombre')
    .isString()
    .withMessage('Cada página necesita un nombre')
    .trim()
    .notEmpty()
    .withMessage('Cada página necesita un nombre')
    .isLength({ max: 100 })
    .withMessage('Máximo 100 caracteres'),
  body('paginas.*.seccion')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Sección inválida')
    .matches(/^[A-Za-z0-9_-]{1,100}$/)
    .withMessage('La sección solo puede tener letras, números, "_" y "-"'),
];

const posicionCampos = [
  textoObligatorio('nombre_posicion', 'El nombre de la posición es requerido', 100),
  textoOpcional('descripcion_p', 255),
  enteroObligatorio('id_area', 'El área es requerida'),
];

module.exports = {
  areaValidator: [...areaCampos, validar],
  areaActualizarValidator: [idParam(), ...areaCampos, validar],
  moduloValidator: [...moduloCampos, validar],
  moduloActualizarValidator: [idParam(), ...moduloCampos, validar],
  submoduloValidator: [...submoduloCampos, validar],
  submoduloActualizarValidator: [idParam(), ...submoduloCampos, validar],
  dashboardValidator: [...dashboardCampos, validar],
  dashboardActualizarValidator: [idParam(), ...dashboardCampos, validar],
  posicionValidator: [...posicionCampos, validar],
};
