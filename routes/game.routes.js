const express = require('express');
const router = express.Router();
const { 
  getGames, 
  getFeaturedGames,
  getGameById, 
  createGame, 
  updateGame, 
  deleteGame 
} = require('../controllers/game.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Rotas públicas
router.get('/', getGames);
router.get('/featured', getFeaturedGames);
router.get('/:id', getGameById);

// Rotas para administradores
router.post('/', verifyToken, isAdmin, createGame);
router.put('/:id', verifyToken, isAdmin, updateGame);
router.delete('/:id', verifyToken, isAdmin, deleteGame);

module.exports = router; 