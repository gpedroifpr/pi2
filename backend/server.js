// backend/server.js (VERSÃO FINAL E COMPLETA)

// 1. Importações e Configurações
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;
const saltRounds = 10;

// 2. Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// 3. Conexão com o Banco de Dados
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'penicius'
}).promise();


// --- 4. MIDDLEWARE DE SEGURANÇA (Porteiro Admin) - CORRIGIDO ---
const isAdmin = async (req, res, next) => {
    // Unifica a forma de obter o userId. Ele pode vir do corpo (para POST/PUT)
    // ou da query string (para DELETE).
    const userId = req.body.userId || req.query.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Acesso não autorizado: ID do usuário faltando.' });
    }

    try {
        const sql = `SELECT role FROM usuarios WHERE id = ?`;
        const [results] = await db.query(sql, [userId]);

        if (results.length > 0 && results[0].role === 'admin') {
            next(); // Permissão concedida
        } else {
            return res.status(403).json({ error: 'Acesso negado: você não é um administrador.' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno ao verificar permissões.' });
    }
};


// --- 5. ROTAS DE AUTENTICAÇÃO ---
app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Por favor, preencha todos os campos." });
    }

    try {
        const hash = await bcrypt.hash(senha, saltRounds);
        const sql = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;
        await db.query(sql, [nome, email, hash]);
        res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Este email já está cadastrado." });
        }
        console.error("Erro no registro:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar usuário." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const sql = `SELECT * FROM usuarios WHERE email = ?`;
        const [results] = await db.query(sql, [email]);

        if (results.length > 0) {
            const usuario = results[0];
            const match = await bcrypt.compare(senha, usuario.senha);
            if (match) {
                res.status(200).json({
                    message: "Login realizado com sucesso!",
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        role: usuario.role
                    }
                });
            } else {
                res.status(401).json({ error: "Email ou senha inválidos." });
            }
        } else {
            res.status(401).json({ error: "Email ou senha inválidos." });
        }
    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ error: "Erro interno ao tentar fazer login." });
    }
});


// --- 6. ROTAS DO CRUD DE PRODUTOS ---

// READ (Ler todos os produtos) - Rota pública
app.get('/api/produtos', async (req, res) => {
    try {
        const sql = `SELECT * FROM produtos ORDER BY id DESC`;
        const [produtos] = await db.query(sql);
        res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
});

// CREATE (Criar um produto) - Rota protegida
app.post('/api/produtos', isAdmin, async (req, res) => {
    const { nome, descricao, preco, categoria, imagem_url } = req.body;
    try {
        const sql = `INSERT INTO produtos (nome, descricao, preco, categoria, imagem_url) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [nome, descricao, preco, categoria, imagem_url]);
        res.status(201).json({ message: 'Produto criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ error: 'Erro ao criar produto.' });
    }
});

// UPDATE (Atualizar um produto) - Rota protegida
app.put('/api/produtos/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, categoria, imagem_url } = req.body;
    try {
        const sql = `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria = ?, imagem_url = ? WHERE id = ?`;
        await db.query(sql, [nome, descricao, preco, categoria, imagem_url, id]);
        res.status(200).json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
});

// DELETE (Deletar um produto) - Rota protegida
app.delete('/api/produtos/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `DELETE FROM produtos WHERE id = ?`;
        await db.query(sql, [id]);
        res.status(200).json({ message: 'Produto deletado com sucesso!' });
    } catch (error) {
        console.error("Erro ao deletar produto:", error);
        res.status(500).json({ error: 'Erro ao deletar produto.' });
    }
});


// --- 7. Iniciar o servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando e ouvindo na porta http://localhost:${PORT}`);
    console.log("Conectado com sucesso ao banco de dados MySQL 'penicius'");
});