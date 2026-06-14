const { body, validationResult } = require('express-validator');

const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const crearUsuarioValidator = [
  body('nombre_u').trim().notEmpty().withMessage('El nombre es requerido'),
  body('apellido_u').trim().notEmpty().withMessage('El apellido es requerido'),
  body('correo_u').isEmail().withMessage('Correo inválido'),
  body('contrasenia_u').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol_u').isIn(['Admin', 'User']).withMessage('Rol inválido'),
  body('id_posicion').isInt().withMessage('Posición inválida'),
  validar
];

const actualizarUsuarioValidator = [
  body('nombre_u').trim().notEmpty().withMessage('El nombre es requerido'),
  body('apellido_u').trim().notEmpty().withMessage('El apellido es requerido'),
  body('correo_u').isEmail().withMessage('Correo inválido'),
  body('rol_u').isIn(['Admin', 'User']).withMessage('Rol inválido'),
  body('id_posicion').isInt().withMessage('Posición inválida'),
  validar
];

module.exports = { crearUsuarioValidator, actualizarUsuarioValidator };