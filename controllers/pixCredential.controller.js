const PixCredential = require('../models/pixCredential.model');

// @desc    Obter todas as credenciais PIX
// @route   GET /api/pix-credentials
// @access  Private/Admin
exports.getPixCredentials = async (req, res) => {
  try {
    const pixCredentials = await PixCredential.find({}).select('-clientSecret');

    res.json({
      success: true,
      count: pixCredentials.length,
      pixCredentials,
    });
  } catch (error) {
    console.error(`Erro ao obter credenciais PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter credenciais PIX',
      error: error.message,
    });
  }
};

// @desc    Obter uma credencial PIX por ID
// @route   GET /api/pix-credentials/:id
// @access  Private/Admin
exports.getPixCredentialById = async (req, res) => {
  try {
    const pixCredential = await PixCredential.findById(req.params.id).select('-clientSecret');

    if (pixCredential) {
      res.json({
        success: true,
        pixCredential,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Credencial PIX não encontrada',
      });
    }
  } catch (error) {
    console.error(`Erro ao obter credencial PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter credencial PIX',
      error: error.message,
    });
  }
};

// @desc    Criar uma nova credencial PIX
// @route   POST /api/pix-credentials
// @access  Private/Admin
exports.createPixCredential = async (req, res) => {
  try {
    const {
      name,
      baseUrl,
      clientId,
      clientSecret,
      webhookUrl,
      provider,
      isActive,
      metadata,
    } = req.body;

    // Verificar se os campos obrigatórios foram fornecidos
    if (!name || !baseUrl || !clientId || !clientSecret || !webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos obrigatórios devem ser fornecidos',
      });
    }

    // Se estiver definindo esta credencial como ativa, desativar outras credenciais
    if (isActive) {
      await PixCredential.updateMany({}, { isActive: false });
    }

    // Criar nova credencial
    const pixCredential = await PixCredential.create({
      name,
      baseUrl,
      clientId,
      clientSecret,
      webhookUrl,
      provider,
      isActive,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Credencial PIX criada com sucesso',
      pixCredential: {
        id: pixCredential._id,
        name: pixCredential.name,
        baseUrl: pixCredential.baseUrl,
        clientId: pixCredential.clientId,
        webhookUrl: pixCredential.webhookUrl,
        provider: pixCredential.provider,
        isActive: pixCredential.isActive,
        metadata: pixCredential.metadata,
      },
    });
  } catch (error) {
    console.error(`Erro ao criar credencial PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar credencial PIX',
      error: error.message,
    });
  }
};

// @desc    Atualizar uma credencial PIX
// @route   PUT /api/pix-credentials/:id
// @access  Private/Admin
exports.updatePixCredential = async (req, res) => {
  try {
    const {
      name,
      baseUrl,
      clientId,
      clientSecret,
      webhookUrl,
      provider,
      isActive,
      metadata,
    } = req.body;

    const pixCredential = await PixCredential.findById(req.params.id);

    if (!pixCredential) {
      return res.status(404).json({
        success: false,
        message: 'Credencial PIX não encontrada',
      });
    }

    // Se estiver ativando esta credencial, desativar outras
    if (isActive && !pixCredential.isActive) {
      await PixCredential.updateMany({ _id: { $ne: pixCredential._id } }, { isActive: false });
    }

    // Atualizar credencial
    if (name) pixCredential.name = name;
    if (baseUrl) pixCredential.baseUrl = baseUrl;
    if (clientId) pixCredential.clientId = clientId;
    if (clientSecret) pixCredential.clientSecret = clientSecret;
    if (webhookUrl) pixCredential.webhookUrl = webhookUrl;
    if (provider) pixCredential.provider = provider;
    if (isActive !== undefined) pixCredential.isActive = isActive;
    if (metadata) pixCredential.metadata = metadata;

    const updatedPixCredential = await pixCredential.save();

    res.json({
      success: true,
      message: 'Credencial PIX atualizada com sucesso',
      pixCredential: {
        id: updatedPixCredential._id,
        name: updatedPixCredential.name,
        baseUrl: updatedPixCredential.baseUrl,
        clientId: updatedPixCredential.clientId,
        webhookUrl: updatedPixCredential.webhookUrl,
        provider: updatedPixCredential.provider,
        isActive: updatedPixCredential.isActive,
        metadata: updatedPixCredential.metadata,
      },
    });
  } catch (error) {
    console.error(`Erro ao atualizar credencial PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar credencial PIX',
      error: error.message,
    });
  }
};

// @desc    Excluir uma credencial PIX
// @route   DELETE /api/pix-credentials/:id
// @access  Private/Admin
exports.deletePixCredential = async (req, res) => {
  try {
    const pixCredential = await PixCredential.findById(req.params.id);

    if (!pixCredential) {
      return res.status(404).json({
        success: false,
        message: 'Credencial PIX não encontrada',
      });
    }

    // Verificar se é a única credencial ativa
    if (pixCredential.isActive) {
      const activeCount = await PixCredential.countDocuments({ isActive: true });
      if (activeCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir a única credencial PIX ativa',
        });
      }
    }

    await pixCredential.deleteOne();

    res.json({
      success: true,
      message: 'Credencial PIX removida com sucesso',
    });
  } catch (error) {
    console.error(`Erro ao excluir credencial PIX: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir credencial PIX',
      error: error.message,
    });
  }
}; 