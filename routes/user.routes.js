const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas as rotas de usuário requerem autenticação e permissões de admin
router.use(verifyToken, isAdmin);

// Rotas
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router; 