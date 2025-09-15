// backend/server.js (VERSÃO FINAL E COMPLETA)

// 1. Importações
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

// 2. Configurações
const app = express();
const PORT = 3000;
const saltRounds = 10;
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// 3. Conexão com o Banco de Dados MongoDB Atlas
// IMPORTANTE: Substitua pela sua string de conexão real!
const MONGO_URI = "mongodb+srv://gpedroifpr:PedroSamara123@penicius.s0ji1as.mongodb.net/penicius_db?retryWrites=true&w=majority&appName=penicius";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Conectado com sucesso ao banco de dados MongoDB Atlas!"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// 4. Modelos (Schemas)
const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const ProdutoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: String,
    preco: { type: Number, required: true },
    categoria: { type: String, required: true },
    imagem_url: String
});
const Produto = mongoose.model('Produto', ProdutoSchema);

// --- 5. MIDDLEWARE DE SEGURANÇA ---
const isAdmin = async (req, res, next) => {
    console.log(">>> EXECUTANDO O NOVO MIDDLEWARE ISADMIN - v2 <<<"); 
    const userId = req.body.userId || req.query.userId;

    // 1. Validação se o ID existe
    if (!userId) {
        return res.status(401).json({ error: 'Acesso não autorizado: ID do usuário faltando.' });
    }

    // 2. NOVA VALIDAÇÃO: Verifica se o formato do ID é válido para o MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'ID de usuário fornecido não é válido.' });
    }

    // 3. Busca no banco de dados com segurança
    try {
        const usuario = await Usuario.findById(userId);
        if (usuario && usuario.role === 'admin') {
            next(); // Permissão concedida, continua para a próxima função (deletar, criar, etc.)
        } else {
            return res.status(403).json({ error: 'Acesso negado: você não tem permissão de administrador.' });
        }
    } catch (error) {
        // Este catch agora lida com outros erros inesperados do banco de dados
        console.error("Erro no middleware isAdmin:", error);
        return res.status(500).json({ error: 'Erro interno ao verificar permissões de usuário.' });
    }
};

// --- 6. ROTAS DE AUTENTICAÇÃO ---
app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hash = await bcrypt.hash(senha, saltRounds);
        const novoUsuario = new Usuario({ nome, email, senha: hash });
        await novoUsuario.save();
        res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Este email já está cadastrado." });
        }
        res.status(500).json({ error: "Erro interno ao cadastrar." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: "Email ou senha inválidos." });
        }
        const match = await bcrypt.compare(senha, usuario.senha);
        if (match) {
            res.status(200).json({
                message: "Login realizado!",
                usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, role: usuario.role }
            });
        } else {
            res.status(401).json({ error: "Email ou senha inválidos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro interno no login." });
    }
});

// --- 7. ROTAS DO CRUD DE PRODUTOS ---
app.get('/api/produtos', async (req, res) => {
    try {
        const produtos = await Produto.find().sort({ _id: -1 });
        res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro no servidor ao buscar produtos:", error);
        res.status(500).json({ error: "Ocorreu um erro interno ao buscar os produtos." });
    }
});

app.get('/api/produtos/:id', async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);
        if (produto) {
            res.json(produto);
        } else {
            res.status(404).json({ error: "Produto não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar produto" });
    }
});

app.post('/api/produtos', isAdmin, async (req, res) => {
    try {
        const novoProduto = new Produto(req.body);
        await novoProduto.save();
        res.status(201).json({ message: 'Produto criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar produto" });
    }
});

app.put('/api/produtos/:id', isAdmin, async (req, res) => {
    try {
        await Produto.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar produto" });
    }
});

app.delete('/api/produtos/:id', isAdmin, async (req, res) => {
    try {
        const result = await Produto.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Produto deletado com sucesso!' });
        } else {
            res.status(404).json({ error: "Produto não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar produto" });
    }
});

// --- 8. Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando e ouvindo na porta http://localhost:${PORT}`);
});