// backend/server.js (VERSÃO FINAL E COMPLETA)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const saltRounds = 10;
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const MONGO_URI = "mongodb+srv://gpedroifpr:PedroSamara123@penicius.s0ji1as.mongodb.net/penicius_db?retryWrites=true&w=majority&appName=penicius";
mongoose.connect(MONGO_URI).then(() => console.log("Conectado ao MongoDB Atlas!")).catch(err => console.error("Erro ao conectar:", err));

// SCHEMAS
const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipoConta: { type: String, enum: ['cliente', 'vitrinista'], required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    vitrines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vitrine' }]
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const VitrineSchema = new mongoose.Schema({ nome: { type: String, required: true, unique: true }, descricao: String, dono: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true } });
const Vitrine = mongoose.model('Vitrine', VitrineSchema);

const ProdutoSchema = new mongoose.Schema({ nome: { type: String, required: true }, descricao: String, preco: { type: Number, required: true }, categoria: { type: String, required: true }, imagem_url: String, vitrine: { type: mongoose.Schema.Types.ObjectId, ref: 'Vitrine', required: true } });
const Produto = mongoose.model('Produto', ProdutoSchema);

// MIDDLEWARE (sem alterações)
const isVitrineOwner = async (req, res, next) => { /* ... */ };

// ROTAS
app.post('/api/register', async (req, res) => {
    // Vamos verificar o que está chegando do frontend
    console.log("Recebida requisição de registro com o corpo:", req.body);

    const { nome, email, senha, tipoConta } = req.body;

    // Validação robusta
    if (!nome || !email || !senha || !tipoConta) {
        console.log("Erro de validação: Campo obrigatório faltando.");
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    try {
        const hash = await bcrypt.hash(senha, saltRounds);
        const novoUsuario = new Usuario({ nome, email, senha: hash, tipoConta });
        await novoUsuario.save();
        console.log("Usuário salvo com sucesso:", novoUsuario);
        res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
        console.error("Erro ao salvar usuário:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "Este email já está cadastrado." });
        }
        res.status(500).json({ error: "Erro interno ao cadastrar." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await Usuario.findOne({ email }).populate('vitrines');
        if (!usuario) return res.status(401).json({ error: "Email ou senha inválidos." });
        const match = await bcrypt.compare(senha, usuario.senha);
        if (match) {
            res.status(200).json({
                message: "Login realizado!",
                usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, tipoConta: usuario.tipoConta, role: usuario.role, vitrines: usuario.vitrines }
            });
        } else {
            res.status(401).json({ error: "Email ou senha inválidos." });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro interno no login." });
    }
});

app.get('/api/meus-dados/:userId', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.userId).populate('vitrines');
        if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });
        res.status(200).json({ id: usuario._id, nome: usuario.nome, email: usuario.email, tipoConta: usuario.tipoConta, role: usuario.role, vitrines: usuario.vitrines });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados do usuário." });
    }
});

app.get('/api/vitrines', async (req, res) => {
    try {
        const vitrines = await Vitrine.find().populate('dono', 'nome').sort({ _id: -1 });
        res.status(200).json(vitrines);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar vitrines.' }); }
});

app.get('/api/vitrines/:id', async (req, res) => {
    try {
        const vitrine = await Vitrine.findById(req.params.id).populate('dono', 'nome email');
        if (!vitrine) return res.status(404).json({ error: 'Vitrine não encontrada.' });
        res.status(200).json(vitrine);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar detalhes da vitrine.' }); }
});

app.get('/api/vitrines/:id/produtos', async (req, res) => {
    try {
        const produtos = await Produto.find({ vitrine: req.params.id }).sort({ _id: -1 });
        res.status(200).json(produtos);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar produtos da vitrine.' }); }
});

app.post('/api/vitrines', async (req, res) => {
    const { nome, descricao, userId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' });
    try {
        const novaVitrine = new Vitrine({ nome, descricao, dono: userId });
        await novaVitrine.save();
        await Usuario.findByIdAndUpdate(userId, { $push: { vitrines: novaVitrine._id } });
        const vitrinePopulada = await Vitrine.findById(novaVitrine._id);
        res.status(201).json({ message: 'Vitrine criada com sucesso!', vitrine: vitrinePopulada });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: "Este nome de vitrine já está em uso." });
        res.status(500).json({ error: 'Erro ao criar a vitrine.' });
    }
});

app.post('/api/produtos', isVitrineOwner, async (req, res) => {
    try {
        const { nome, descricao, preco, categoria, imagem_url, vitrineId } = req.body;
        const novoProduto = new Produto({ nome, descricao, preco, categoria, imagem_url, vitrine: vitrineId });
        await novoProduto.save();
        res.status(201).json({ message: 'Produto criado com sucesso!', produto: novoProduto });
    } catch (error) { res.status(500).json({ error: "Erro ao criar produto" }); }
});

app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const result = await Produto.findByIdAndDelete(req.params.id);
        if (result) res.json({ message: 'Produto deletado com sucesso!' });
        else res.status(404).json({ error: "Produto não encontrado" });
    } catch (error) { res.status(500).json({ error: "Erro ao deletar produto" }); }
});

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`); });