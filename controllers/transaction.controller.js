import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';

// @desc    Obter todas as transações do usuário
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    
    const type = req.query.type || '';
    const status = req.query.status || '';
    
    // Construir filtro base
    const filter = { userId: req.user.id };
    
    // Adicionar filtros opcionais
    if (type && ['DEPOSIT', 'WITHDRAW', 'BET', 'WIN'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }
    
    if (status && ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    // Contar total de transações com o filtro
    const total = await Transaction.countDocuments(filter);
    
    // Obter transações com paginação e filtro
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex);

    res.json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: transactions
    });
  } catch (error) {
    console.error('Erro ao obter transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter transações'
    });
  }
};

// @desc    Obter todas as transações (admin)
// @route   GET /api/transactions/all
// @access  Private/Admin
export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    
    const type = req.query.type || '';
    const status = req.query.status || '';
    const userId = req.query.userId || '';
    
    // Construir filtro
    const filter = {};
    
    // Adicionar filtros opcionais
    if (type && ['DEPOSIT', 'WITHDRAW', 'BET', 'WIN'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }
    
    if (status && ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }
    
    if (userId) {
      filter.userId = userId;
    }

    // Contar total de transações com o filtro
    const total = await Transaction.countDocuments(filter);
    
    // Obter transações com paginação e filtro
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .populate('userId', 'username email fullName');

    res.json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      transactions,
    });
  } catch (error) {
    console.error(`Erro ao obter todas as transações: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter todas as transações',
      error: error.message,
    });
  }
};

// @desc    Obter uma transação por ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Erro ao obter transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter transação'
    });
  }
};

// @desc    Iniciar retirada
// @route   POST /api/transactions/withdraw
// @access  Private
export const createWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, pixKey, pixKeyType } = req.body;

    // Verificar se o valor é válido
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor de retirada inválido',
      });
    }

    // Verificar se o método de pagamento é suportado
    if (!paymentMethod || !['PIX', 'BANK_TRANSFER'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pagamento inválido ou não suportado',
      });
    }

    // Verificar se a chave PIX foi fornecida para método PIX
    if (paymentMethod === 'PIX' && (!pixKey || !pixKeyType)) {
      return res.status(400).json({
        success: false,
        message: 'Chave PIX e tipo de chave PIX são obrigatórios para retiradas via PIX',
      });
    }

    // Obter informações do usuário
    const user = await User.findById(req.user.id);

    // Verificar se o usuário tem saldo suficiente
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente',
      });
    }

    // Criar nova transação de retirada
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'WITHDRAW',
      amount,
      status: 'PENDING',
      paymentMethod,
      metadata: {
        pixKey: pixKey,
        pixKeyType: pixKeyType,
        requestedAt: new Date(),
      },
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Solicitação de retirada enviada com sucesso',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error(`Erro ao processar retirada: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar retirada',
      error: error.message,
    });
  }
};

// @desc    Atualizar status da transação (admin)
// @route   PUT /api/transactions/:id
// @access  Private/Admin
export const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido',
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada',
      });
    }

    // Atualizar status
    transaction.status = status;
    
    // Adicionar metadados para auditoria
    if (!transaction.metadata) {
      transaction.metadata = {};
    }
    
    transaction.metadata.lastUpdatedBy = req.user.id;
    transaction.metadata.lastUpdatedAt = new Date();
    transaction.metadata.statusHistory = transaction.metadata.statusHistory || [];
    transaction.metadata.statusHistory.push({
      from: transaction.status,
      to: status,
      updatedBy: req.user.id,
      updatedAt: new Date(),
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Status da transação atualizado com sucesso',
      transaction,
    });
  } catch (error) {
    console.error(`Erro ao atualizar status da transação: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da transação',
      error: error.message,
    });
  }
};

// @desc    Cancelar transação
// @route   POST /api/transactions/:id/cancel
// @access  Private
export const cancelTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'PENDING'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada ou não pode ser cancelada'
      });
    }

    // Atualizar status da transação
    transaction.status = 'CANCELLED';
    transaction.cancelledAt = new Date();
    await transaction.save();

    // Se for uma aposta, reembolsar o valor
    if (transaction.type === 'BET') {
      const user = await User.findById(req.user.id);
      user.balance += transaction.amount;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Transação cancelada com sucesso',
      data: transaction
    });
  } catch (error) {
    console.error('Erro ao cancelar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar transação'
    });
  }
}; 