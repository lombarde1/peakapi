const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Gerar Token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, cpf } = req.body;

    // Verificar se os campos obrigatórios foram fornecidos
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios',
      });
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Usuário ou email já cadastrado',
      });
    }

    // Verificar se o CPF já existe (se fornecido)
    if (cpf) {
      const cpfExists = await User.findOne({ cpf });
      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado',
        });
      }
    }

    // Criar novo usuário
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      cpf,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token: generateToken(user._id),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Dados de usuário inválidos',
      });
    }
  } catch (error) {
    console.error(`Erro ao registrar usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar usuário',
      error: error.message,
    });
  }
};

// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificar se o username e a senha foram fornecidos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça nome de usuário e senha',
      });
    }

    // Verificar se o usuário existe
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar se a senha está correta
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta suspensa ou inativa',
      });
    }

    // Atualizar data do último login
    user.lastLogin = Date.now();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        balance: user.balance,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(`Erro ao autenticar usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao autenticar usuário',
      error: error.message,
    });
  }
};

// @desc    Obter perfil do usuário
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          cpf: user.cpf,
          balance: user.balance,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
  } catch (error) {
    console.error(`Erro ao obter perfil de usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil de usuário',
      error: error.message,
    });
  }
}; 