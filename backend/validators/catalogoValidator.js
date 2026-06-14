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
  body('descripcion_area').optional().trim(),
  validar
];

const posicionValidator = [
  body('nombre_posicion').trim().notEmpty().withMessage('El nombre de la posición es requerido'),
  body('id_area').isInt().withMessage('El área es requerida'),
  validar
];

const moduloValidator = [
  body('nombre_m').trim().notEmpty().withMessage('El nombre del módulo es requerido'),
  body('id_area').isInt().withMessage('El área es requerida'),
  validar
];

const submoduloValidator = [
  body('nombre_sm').trim().notEmpty().withMessage('El nombre del submódulo es requerido'),
  body('modulos_id_m').isInt().withMessage('El módulo es requerido'),
  validar
];

const dashboardValidator = [
  body('nombre_d').trim().notEmpty().withMessage('El nombre del dashboard es requerido'),
  body('link_d').trim().notEmpty().withMessage('El link es requerido'),
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