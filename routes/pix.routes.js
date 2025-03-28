const express = require('express');
const router = express.Router();
const { 
  generatePixQrCode, 
  pixWebhook, 
  checkPixStatus 
} = require('../controllers/pix.controller');
const { verifyToken } = require('../middleware/auth');

// Rotas para usuários autenticados
router.post('/generate', verifyToken, generatePixQrCode);
router.get('/status/:external_id', verifyToken, checkPixStatus);

// Webhook público para notificações de pagamento
router.post('/webhook', pixWebhook);

module.exports = router; 