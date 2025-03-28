const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas privadas (requer autenticação)
router.get('/profile', verifyToken, getProfile);

module.exports = router; 