const { body, validationResult } = require('express-validator');

const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const areaValidator = [
  body('nombre_area').trim().notEmpty().withMessage('El nombre del área es requerido'),
  body('descripcion_area').trim().notEmpty().withMessage('La descripción del área es requerida'),
  validar
];

const posicionValidator = [
  body('nombre_posicion').trim().notEmpty().withMessage('El nombre de la posición es requerido'),
  body('id_area').isInt().withMessage('El área es requerida'),
  validar
];

const moduloValidator = [
  body('nombre_m').trim().notEmpty().withMessage('El nombre del módulo es requerido'),
  body('descripcion_m').trim().notEmpty().withMessage('La descripción del módulo es requerida'),
  body('id_area').isInt().withMessage('El área es requerida'),
  validar
];

const submoduloValidator = [
  body('nombre_sm').trim().notEmpty().withMessage('El nombre del submódulo es requerido'),
  body('descripcion_sm').trim().notEmpty().withMessage('La descripción del submódulo es requerida'),
  body('modulos_id_m').isInt().withMessage('El módulo es requerido'),
  validar
];

const dashboardValidator = [
  body('nombre_d').trim().notEmpty().withMessage('El nombre del dashboard es requerido'),
  body('link_d')
    .trim()
    .notEmpty().withMessage('El link es requerido')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Ingresa un link válido que empiece con http:// o https://'),
  body('submodulos_id_sm').isInt().withMessage('El submódulo es requerido'),
  validar
];

module.exports = {
  areaValidator,
  posicionValidator,
  moduloValidator,
  submoduloValidator,
  dashboardValidator
};
