const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Modelo de Jogo
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
      enum: ['slots', 'table', 'live', 'crash', 'sport', 'arcade', 'other', 'Slots', 'Arcade'],
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
      default: 95,
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

// Registrar o modelo
const Game = mongoose.model('Game', gameSchema);

// Lista de jogos a serem adicionados
const games = [
    {
        "name": "Dino Rex",
        "imageUrl": "https://i.imgur.com/OciHanc.jpeg",
        "provider": "Horizon777",
        "category": "Arcade",
        "isActive": true,
        "isFeatured": true,
        "popularity": 80
    },
    {
        "name": "Piggy Bank Bills",
        "imageUrl": "https://solawins-sg0.pragmaticplay.net/game_pic/rec/325/vs9piggybank.png",
        "provider": "Pragmatic Play",
        "category": "Slots",
        "isActive": true,
        "popularity": 60
    },
    {
        "name": "Fortune Tiger",
        "imageUrl": "https://i.imgur.com/lCMY74B.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "isFeatured": true,
        "popularity": 95
    },
    {
        "name": "Fortune Mouse",
        "imageUrl": "https://i.imgur.com/NDp35jD.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 90
    },
    {
        "name": "Fortune Ox",
        "imageUrl": "https://i.imgur.com/uWYQEcx.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 85
    },
    {
        "name": "Fortune Panda",
        "imageUrl": "https://i.imgur.com/RT88no7.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 82
    },
    {
        "name": "Fortune Rabbit",
        "imageUrl": "https://i.imgur.com/tfvTL5n.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "isFeatured": true,
        "popularity": 93
    },
    {
        "name": "Bikini Paradise",
        "imageUrl": "https://i.imgur.com/1CEw72w.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 75
    },
    {
        "name": "Hood Vs. Woolf",
        "imageUrl": "https://i.imgur.com/v10091x.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 70
    },
    {
        "name": "Jack Frost",
        "imageUrl": "https://i.imgur.com/7ye5yNJ.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 65
    },
    {
        "name": "Phoenix Rises",
        "imageUrl": "https://i.imgur.com/Pu9bOyU.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 78
    },
    {
        "name": "Queen Of Bounty",
        "imageUrl": "https://i.imgur.com/KGMsnER.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 72
    },
    {
        "name": "Songkran",
        "imageUrl": "https://i.imgur.com/gnC2ryu.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "popularity": 68
    },
    {
        "name": "Treasures Of Aztec",
        "imageUrl": "https://i.imgur.com/pHACDLU.png",
        "provider": "PG Soft",
        "category": "Slots",
        "isActive": true,
        "isFeatured": true,
        "popularity": 88
    }
];

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Função para adicionar jogos ao banco de dados
const seedGames = async () => {
  try {
    // Conectar ao banco de dados
    const conn = await connectDB();

    // Limpar todos os jogos existentes (opcional - remova esta linha se quiser manter os jogos existentes)
    console.log('Removendo jogos existentes...');
    await Game.deleteMany({});

    // Adicionar novos jogos
    console.log('Adicionando novos jogos...');
    await Game.insertMany(games);

    console.log(`${games.length} jogos foram adicionados com sucesso!`);
    
    // Fechar a conexão
    await mongoose.connection.close();
    console.log('Conexão com o MongoDB fechada');
    
    process.exit(0);
  } catch (error) {
    console.error(`Erro ao adicionar jogos: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Executar o script
seedGames(); 