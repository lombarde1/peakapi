# PeakBet API

API RESTful para a casa de apostas PeakBet.

## Tecnologias Utilizadas

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT para autenticação
- Integração com PIX para pagamentos

## Configuração

### Pré-requisitos

- Node.js (v12 ou superior)
- MongoDB

### Instalação

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   PORT=3000
   MONGODB_URI=mongodb://darkvips:lombarde1@147.79.111.143:27017/peakbet2?authSource=admin
   JWT_SECRET=seu_segredo_jwt
   NODE_ENV=development
   ```
4. Inicie o servidor:
   ```
   npm run dev
   ```

## Estrutura do Projeto

```
├── config/         # Configurações (conexão com banco de dados)
├── controllers/    # Controladores das rotas
├── middleware/     # Middleware personalizado (autenticação)
├── models/         # Modelos do Mongoose
├── routes/         # Rotas da API
├── utils/          # Utilitários
├── .env            # Variáveis de ambiente
├── app.js          # Arquivo principal
└── package.json    # Dependências do projeto
```

## Endpoints da API

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Autenticar usuário e obter token
- `GET /api/auth/profile` - Obter perfil do usuário autenticado

### Usuários (Admin)

- `GET /api/users` - Obter todos os usuários
- `GET /api/users/:id` - Obter usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário

### Transações

- `GET /api/transactions` - Obter transações do usuário autenticado
- `GET /api/transactions/:id` - Obter detalhes de uma transação
- `POST /api/transactions/withdraw` - Solicitar retirada
- `GET /api/transactions/admin/all` - Obter todas as transações (admin)
- `PUT /api/transactions/:id` - Atualizar status de uma transação (admin)

### Jogos

- `GET /api/games` - Obter todos os jogos
- `GET /api/games/featured` - Obter jogos em destaque
- `GET /api/games/:id` - Obter jogo por ID
- `POST /api/games` - Criar novo jogo (admin)
- `PUT /api/games/:id` - Atualizar jogo (admin)
- `DELETE /api/games/:id` - Excluir jogo (admin)

### Pagamentos PIX

- `POST /api/pix/generate` - Gerar QR Code PIX para depósito
- `GET /api/pix/status/:external_id` - Verificar status do pagamento PIX
- `POST /api/pix/webhook` - Webhook para notificações de pagamento PIX

### Credenciais PIX (Admin)

- `GET /api/pix-credentials` - Obter todas as credenciais PIX
- `GET /api/pix-credentials/:id` - Obter credencial PIX por ID
- `POST /api/pix-credentials` - Criar nova credencial PIX
- `PUT /api/pix-credentials/:id` - Atualizar credencial PIX
- `DELETE /api/pix-credentials/:id` - Excluir credencial PIX

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas, inclua o token JWT no cabeçalho da solicitação:

```
Authorization: Bearer seu_token_jwt
```

## Exemplos de Uso

### Registro de Usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "fullName": "Nome Completo"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "password": "senha123"
  }'
```

### Gerar QR Code PIX para Depósito

```bash
curl -X POST http://localhost:3000/api/pix/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{
    "amount": 100
  }'
```

## Licença

Este projeto está licenciado sob a licença ISC. 