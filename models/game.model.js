const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do jogo é obrigatório'],
      trim: true,
    },
    provider: {
      type: String,
      required: [true, 'Provedor do jogo é obrigatório'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['slots', 'table', 'live', 'crash', 'sport', 'other'],
      default: 'slots',
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    minBet: {
      type: Number,
      default: 1,
    },
    maxBet: {
      type: Number,
      default: 1000,
    },
    rtp: {
      type: Number,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    gameConfig: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Índice para pesquisa por nome do jogo
gameSchema.index({ name: 'text', provider: 'text' });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game; 