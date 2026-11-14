const { body } = require('express-validator');
const { validar, idParam: idParamDe } = require('../middlewares/validacion');

// Letras (con tildes/ñ) y espacios simples entre palabras: "Juan Carlos", "De la Cruz"
const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+( [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
const limpiarEspacios = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

const idParam = idParamDe();

const camposNombre = [
  body('nombres_u')
    .customSanitizer(limpiarEspacios)
    .notEmpty().withMessage('Los nombres son requeridos')
    .isLength({ max: 60 }).withMessage('Máximo 60 caracteres')
    .matches(soloLetras).withMessage('Los nombres solo deben contener letras'),
  body('apellido_paterno_u')
    .customSanitizer(limpiarEspacios)
    .notEmpty().withMessage('El apellido paterno es requerido')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres')
    .matches(soloLetras).withMessage('El apellido paterno solo debe contener letras'),
  body('apellido_materno_u')
    .customSanitizer(limpiarEspacios)
    .optional({ values: 'falsy' })
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres')
    .matches(soloLetras).withMessage('El apellido materno solo debe contener letras'),
  body('id_posicion').isInt({ min: 1 }).withMessage('Posición inválida').toInt()
];

// Crear: el rol se fuerza a 'user' en el servicio; username y correo se generan en el backend.
const crearUsuarioValidator = [
  ...camposNombre,
  body('contrasenia_u')
    .isLength({ min: 6, max: 72 }).withMessage('La contraseña debe tener entre 6 y 72 caracteres'),
  body('autorizado').optional().isBoolean().withMessage('Valor inválido').toBoolean(),
  validar
];

const actualizarUsuarioValidator = [
  idParam,
  ...camposNombre,
  body('rol_u').isIn(['admin', 'user']).withMessage('Rol inválido'),
  body('autorizado').isBoolean().withMessage('Valor inválido').toBoolean(),
  validar
];

const idUsuarioValidator = [idParam, validar];

const permisosValidator = [
  idParam,
  body('submodulos_ids').optional().isArray().withMessage('Formato inválido'),
  body('submodulos_ids.*').isInt({ min: 1 }).withMessage('Submódulo inválido').toInt(),
  body('dashboards_ids').optional().isArray().withMessage('Formato inválido'),
  body('dashboards_ids.*').isInt({ min: 1 }).withMessage('Dashboard inválido').toInt(),
  validar
];

module.exports = {
  crearUsuarioValidator,
  actualizarUsuarioValidator,
  idUsuarioValidator,
  permisosValidator
};
