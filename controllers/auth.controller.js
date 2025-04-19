import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Gerar Token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, cpf } = req.body;

    // Verificar se os campos obrigatórios foram fornecidos
    if (!username || !email || !password || !fullName || !cpf) {
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

    // Verificar se o CPF já existe
    const cpfExists = await User.findOne({ cpf });
    if (cpfExists) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado',
      });
    }

    // Criar novo usuário
    const user = await User.create({
      username,
      email,
      password,
      name: fullName,
      phone,
      cpf,
      role: 'USER',
      status: 'ACTIVE'
    });

    // Gerar token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar usuário',
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificar se os campos foram fornecidos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça username e senha',
      });
    }

    // Buscar usuário
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Conta suspensa ou inativa',
      });
    }

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
    });
  }
};

// @desc    Obter perfil do usuário
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil',
    });
  }
}; 