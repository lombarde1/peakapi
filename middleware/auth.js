const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware para verificar token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    let token;

    // Verificar se o token está presente no header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar se o token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso não autorizado. Token não fornecido.',
      });
    }

    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obter o usuário pelo ID decodificado do token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta de usuário suspensa ou inativa',
      });
    }

    // Adicionar o usuário à requisição
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro ao autenticar usuário',
    });
  }
};

// Middleware para verificar permissões de admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar esta rota.',
    });
  }
}; 