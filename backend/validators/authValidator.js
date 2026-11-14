const { body } = require('express-validator');
const { validar } = require('../middlewares/validacion');

const loginValidator = [
  body('username')
    .isString()
    .withMessage('El usuario es requerido')
    .trim()
    .notEmpty()
    .withMessage('El usuario es requerido')
    .isLength({ max: 80 })
    .withMessage('Usuario demasiado largo'),
  body('contrasenia')
    .isString()
    .withMessage('La contraseña es requerida')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ max: 72 })
    .withMessage('Contraseña demasiado larga'),
  validar,
];

module.exports = { loginValidator };
