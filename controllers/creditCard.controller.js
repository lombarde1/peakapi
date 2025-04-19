import axios from 'axios';
import CreditCard from '../models/creditCard.model.js';
import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';

// Função auxiliar para validar cartão de crédito usando algoritmo de Luhn
function isValidCreditCard(number) {
  let sum = 0;
  let isEven = false;
  
  // Loop através dos dígitos em ordem reversa
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Função auxiliar para gerar número de cartão válido
function generateValidCreditCardNumber() {
  const prefix = '4532'; // Começando com 4 (Visa)
  let number = prefix;
  
  // Gerar 11 dígitos aleatórios
  for (let i = 0; i < 11; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  // Calcular dígito verificador
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return number + checkDigit;
}

// @desc    Gerar novo cartão de crédito
// @route   POST /api/credit-card/generate
// @access  Private (Admin)


export const generateCreditCard = async (req, res) => {
  try {
    // Gerar dados usando a API Faker
    const fakerResponse = await axios.get('https://fakerapi.it/api/v1/persons?_quantity=1&_locale=ar_SA');
    const person = fakerResponse.data.data[0];
    
    // Gerar cartão de crédito válido
    const cardNumber = generateValidCreditCardNumber();
    
    // Gerar data de validade (entre 2 e 5 anos a partir de agora)
    const today = new Date();
    const years = Math.floor(Math.random() * 4) + 2;
    const month = Math.floor(Math.random() * 12) + 1;
    const expirationDate = `${month.toString().padStart(2, '0')}/${(today.getFullYear() + years).toString().slice(-2)}`;
    
    // Gerar CVV
    const cvv = Math.floor(Math.random() * 900) + 100;
    
    // Gerar CPF válido
    const generateCPF = () => {
      const generateDigit = (digits) => {
        let sum = 0;
        let weight = digits.length + 1;
        
        for(let i = 0; i < digits.length; i++) {
          sum += digits[i] * weight;
          weight--;
        }
        
        const digit = 11 - (sum % 11);
        return digit > 9 ? 0 : digit;
      };
      
      const numbers = [];
      for(let i = 0; i < 9; i++) {
        numbers.push(Math.floor(Math.random() * 10));
      }
      
      const digit1 = generateDigit(numbers);
      numbers.push(digit1);
      const digit2 = generateDigit(numbers);
      numbers.push(digit2);
      
      return numbers.join('');
    };
    
    const cpf = generateCPF();

    // Criar novo cartão no banco de dados
    const creditCard = await CreditCard.create({
      number: cardNumber,
      expirationDate,
      cvv: cvv.toString(),
      holderName: person.firstname + ' ' + person.lastname,
      cpf,
      isUsed: false
    });

    res.status(201).json({
      success: true,
      message: 'Cartão de crédito gerado com sucesso',
      creditCard: {
        number: creditCard.number,
        expirationDate: creditCard.expirationDate,
        cvv: creditCard.cvv,
        holderName: creditCard.holderName,
        cpf: creditCard.cpf
      }
    });
  } catch (error) {
    console.error(`Erro ao gerar cartão de crédito: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar cartão de crédito',
      error: error.message
    });
  }
};

// @desc    Listar cartões de crédito
// @route   GET /api/credit-card
// @access  Private (Admin)
export const listCreditCards = async (req, res) => {
  try {
    const cards = await CreditCard.find().select('-cvv');
    
    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar cartões de crédito'
    });
  }
};

// @desc    Obter detalhes de um cartão
// @route   GET /api/credit-card/:id
// @access  Private (Admin)
export const getCreditCardDetails = async (req, res) => {
  try {
    const card = await CreditCard.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: card._id,
        number: card.number,
        expirationDate: card.expirationDate,
        holderName: card.holderName,
        cpf: card.cpf,
        isUsed: card.isUsed,
        createdAt: card.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do cartão'
    });
  }
};

// @desc    Realizar depósito com cartão de crédito
// @route   POST /api/credit-card/deposit
// @access  Private
export const depositWithCreditCard = async (req, res) => {
  try {
    const { cardNumber, expirationDate, cvv, holderName, cpf, amount } = req.body;
    const userId = req.user.id;

    // Validar campos obrigatórios
    if (!cardNumber || !expirationDate || !cvv || !holderName || !cpf || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Validar valor do depósito
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'O valor do depósito deve ser maior que zero'
      });
    }

    // Verificar se o cartão existe e não foi usado
    const card = await CreditCard.findOne({
      number: cardNumber,
      expirationDate,
      cvv,
      holderName,
      cpf,
      isUsed: false
    });

    if (!card) {
      return res.status(400).json({
        success: false,
        message: 'Cartão inválido ou já utilizado'
      });
    }

    // Buscar usuário para verificar bônus
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Calcular valor total (depósito + bônus se for primeiro depósito)
    const bonus = user.hasReceivedFirstDepositBonus ? 0 : 10;
    const totalAmount = amount + bonus;

    // Marcar cartão como usado
    card.isUsed = true;
    await card.save();

    // Criar transação
    const transaction = await Transaction.create({
      userId,
      type: 'DEPOSIT',
      amount: totalAmount,
      status: 'COMPLETED',
      paymentMethod: 'CREDIT_CARD',
      metadata: {
        cardLastFour: cardNumber.slice(-4),
        cardHolderName: holderName,
        bonus
      }
    });

    // Atualizar apenas o status de bônus do usuário, não o saldo
    if (bonus > 0) {
      user.hasReceivedFirstDepositBonus = true;
      await user.save();
    }

    // O saldo será atualizado automaticamente pelo middleware post-save da transação

    res.status(201).json({
      success: true,
      data: {
        transactionId: transaction._id,
        amount: totalAmount,
        bonus,
        newBalance: user.balance + totalAmount // Calculamos aqui apenas para exibição, não modificamos diretamente
      }
    });
  } catch (error) {
    console.error('Erro ao processar depósito:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar depósito'
    });
  }
};