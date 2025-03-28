const User = require('../models/user.model');

// @desc    Obter todos os usuários
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    // Construir filtro
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      filter.status = status;
    }

    // Contar total de usuários com o filtro
    const total = await User.countDocuments(filter);
    
    // Obter usuários com paginação e filtro
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      users,
    });
  } catch (error) {
    console.error(`Erro ao obter usuários: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter usuários',
      error: error.message,
    });
  }
};

// @desc    Obter um usuário por ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json({
        success: true,
        user,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
  } catch (error) {
    console.error(`Erro ao obter usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter usuário',
      error: error.message,
    });
  }
};

// @desc    Atualizar usuário
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { fullName, email, phone, cpf, status, role, balance } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Verificar se o email está sendo atualizado e se já existe
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso',
        });
      }
    }

    // Verificar se o CPF está sendo atualizado e se já existe
    if (cpf && cpf !== user.cpf) {
      const cpfExists = await User.findOne({ cpf });
      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já está em uso',
        });
      }
    }

    // Atualizar usuário
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phone = phone !== undefined ? phone : user.phone;
    user.cpf = cpf !== undefined ? cpf : user.cpf;
    user.status = status || user.status;
    user.role = role || user.role;
    
    // Apenas atualizar o saldo se for explicitamente fornecido
    if (balance !== undefined) {
      user.balance = balance;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        cpf: updatedUser.cpf,
        status: updatedUser.status,
        role: updatedUser.role,
        balance: updatedUser.balance,
      },
    });
  } catch (error) {
    console.error(`Erro ao atualizar usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error.message,
    });
  }
};

// @desc    Excluir usuário
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Usuário removido com sucesso',
    });
  } catch (error) {
    console.error(`Erro ao excluir usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir usuário',
      error: error.message,
    });
  }
}; 