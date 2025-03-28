const express = require('express');
const router = express.Router();
const { 
  getTransactions, 
  getAllTransactions, 
  getTransactionById, 
  createWithdrawal,
  updateTransactionStatus 
} = require('../controllers/transaction.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Rotas para usuários autenticados
router.get('/', verifyToken, getTransactions);
router.get('/:id', verifyToken, getTransactionById);
router.post('/withdraw', verifyToken, createWithdrawal);

// Rotas para administradores
router.get('/admin/all', verifyToken, isAdmin, getAllTransactions);
router.put('/:id', verifyToken, isAdmin, updateTransactionStatus);

module.exports = router; 