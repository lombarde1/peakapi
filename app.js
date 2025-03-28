const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Conectar ao banco de dados
connectDB();

// Inicializar o aplicativo Express
const app = express();

// Middleware de segurança
app.use(helmet());

// Middleware para compressão de respostas
app.use(compression());

// Middleware para logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware para CORS
app.use(cors());

// Middleware para parse de JSON
app.use(express.json());

// Middleware para parse de URL-encoded
app.use(express.urlencoded({ extended: false }));

// Rotas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/games', require('./routes/game.routes'));
app.use('/api/pix', require('./routes/pix.routes'));
app.use('/api/pix-credentials', require('./routes/pixCredential.routes'));

// Rota padrão para verificação de status da API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API PeakBet em funcionamento',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// Middleware para tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
  });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(`Erro: ${err.message}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando no modo ${process.env.NODE_ENV} na porta ${PORT}`);
}); 