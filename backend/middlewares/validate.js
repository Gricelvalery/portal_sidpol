const { param, validationResult } = require('express-validator');

// Último eslabón de cada cadena de validación
const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const idParam = (nombre = 'id') =>
  param(nombre).isInt({ min: 1 }).withMessage('Identificador inválido').toInt();

module.exports = { validar, idParam };
