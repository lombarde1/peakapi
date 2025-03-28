const express = require('express');
const router = express.Router();
const { 
  getPixCredentials, 
  getPixCredentialById, 
  createPixCredential, 
  updatePixCredential, 
  deletePixCredential 
} = require('../controllers/pixCredential.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas as rotas de credenciais PIX requerem autenticação e permissões de admin
router.use(verifyToken, isAdmin);

// Rotas
router.get('/', getPixCredentials);
router.get('/:id', getPixCredentialById);
router.post('/', createPixCredential);
router.put('/:id', updatePixCredential);
router.delete('/:id', deletePixCredential);

module.exports = router; 