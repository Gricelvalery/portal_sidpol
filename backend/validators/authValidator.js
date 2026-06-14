const { body, validationResult } = require('express-validator');

const loginValidator = [
  body('username').trim().notEmpty().withMessage('El usuario es requerido'),
  body('contrasenia').notEmpty().withMessage('La contraseña es requerida'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { loginValidator };