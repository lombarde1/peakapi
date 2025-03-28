const axios = require('axios');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const PixCredential = require('../models/pixCredential.model');

// @desc    Gerar QR Code PIX para depósito
// @route   POST /api/pix/generate
// @access  Private
exports.generatePixQrCode = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido',
      });
    }

    // Obter credenciais PIX ativas
    const pixCredential = await PixCredential.findOne({ isActive: true }).select('+clientSecret');
    
    if (!pixCredential) {
      return res.status(500).json({
        success: false,
        message: 'Credenciais PIX não configuradas',
      });
    }

    // Gerar ID externo único para esta transação
    const externalId = `PIX_${Date.now()}`;

    // Criar registro de transação pendente
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'DEPOSIT',
      amount: amount,
      status: 'PENDING',
      externalReference: externalId,
      paymentMethod: 'PIX',
    });

    await transaction.save();

    // Preparar credenciais
    const credentials = `${pixCredential.clientId}:${pixCredential.clientSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    // Obter token de autenticação
    const tokenResponse = await axios.post(
      `${pixCredential.baseUrl}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = tokenResponse.data.access_token;

    // Obter usuário para informações do pagador
    const user = await User.findById(req.user.id);

    // Criar solicitação de QR Code PIX
    const pixRequest = {
      amount: parseFloat(amount),
      postbackUrl: pixCredential.webhookUrl,
      payer: {
        name: user.fullName || user.username,
        document: user.cpf || '00000000000',
        email: user.email,
      },
    };

    // Enviar solicitação para gerar QR Code
    const pixResponse = await axios.post(
      `${pixCredential.baseUrl}/pix/qrcode`,
      pixRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    res.json({
      success: true,
      message: 'QR Code PIX gerado com sucesso',
      transaction_id: transaction._id,
      external_id: externalId,
      qr_code: pixResponse.data.qrcode,
      qr_code_image: pixResponse.data.qrcodeImage || null,
      expiration: pixResponse.data.expiration || null,
      amount: amount,
    });
  } catch (error) {
    console.error(`Erro ao gerar QR Code PIX: ${error.message}`);
    const errorData = error.response ? error.response.data : null;
    
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar QR Code PIX',
      error: errorData || error.message,
    });
  }
};

// @desc    Webhook para notificações de pagamento PIX
// @route   POST /api/pix/webhook
// @access  Public
exports.pixWebhook = async (req, res) => {
  try {
    const { requestBody } = req.body;

    console.log('Webhook PIX recebido:', JSON.stringify(requestBody));

    if (!requestBody || requestBody.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Dados de webhook inválidos',
      });
    }

    // Encontrar a transação PIX pendente mais recente
    const latestTransaction = await Transaction.findOne({
      type: 'DEPOSIT',
      status: 'PENDING',
      paymentMethod: 'PIX',
    }).sort({ createdAt: -1 });

    if (!latestTransaction) {
      console.log('Nenhuma transação PIX pendente encontrada');
      return res.status(404).json({
        success: false,
        message: 'Nenhuma transação PIX pendente encontrada',
      });
    }

    console.log(`Atualizando transação ${latestTransaction._id}`);

    // Atualizar status da transação
    latestTransaction.status = 'COMPLETED';
    latestTransaction.metadata = {
      pixTransactionId: requestBody.transactionId || 'unknown',
      dateApproval: requestBody.dateApproval || new Date(),
      payerInfo: requestBody.creditParty || {},
      webhookData: requestBody,
    };

    // Salvar a transação para acionar o middleware que atualiza o saldo
    await latestTransaction.save();

    // Verificar se o saldo foi atualizado (para debug)
    const updatedUser = await User.findById(latestTransaction.userId);
    console.log(`Saldo do usuário atualizado: ${updatedUser.balance}`);

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
    });
  } catch (error) {
    console.error(`Erro ao processar webhook PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar notificação de pagamento',
      error: error.message,
    });
  }
};

// @desc    Verificar status do pagamento PIX
// @route   GET /api/pix/status/:external_id
// @access  Private
exports.checkPixStatus = async (req, res) => {
  try {
    const { external_id } = req.params;

    // Encontrar a transação pelo ID externo
    const transaction = await Transaction.findOne({ externalReference: external_id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada',
      });
    }

    // Verificar se o usuário tem permissão para ver esta transação
    if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a visualizar esta transação',
      });
    }

    res.json({
      success: true,
      status: transaction.status,
      transaction_id: transaction._id,
      external_id: transaction.externalReference,
      amount: transaction.amount,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
      metadata: transaction.metadata,
    });
  } catch (error) {
    console.error(`Erro ao verificar status do pagamento PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do pagamento',
      error: error.message,
    });
  }
};