const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAW', 'BET', 'WIN'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['PIX', 'BANK_TRANSFER', 'CRYPTO', 'CREDIT', 'SYSTEM'],
      required: true,
    },
    externalReference: {
      type: String,
      sparse: true,
      unique: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
    },
    betDetails: {
      type: Object,
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para atualizar saldo do usuário após salvar transação completa
transactionSchema.post('save', async function () {
  if (this.status === 'COMPLETED') {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      console.error(`Usuário não encontrado: ${this.userId}`);
      return;
    }

    if (this.type === 'DEPOSIT' || this.type === 'WIN') {
      user.balance += this.amount;
    } else if ((this.type === 'WITHDRAW' || this.type === 'BET') && user.balance >= this.amount) {
      user.balance -= this.amount;
    } else {
      console.error(`Saldo insuficiente para a transação: ${this._id}`);
      return;
    }

    await user.save();
    console.log(`Saldo atualizado para usuário ${user._id}: ${user.balance}`);
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 