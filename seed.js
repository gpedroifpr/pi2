const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURAÇÃO ---
// Copie EXATAMENTE a mesma string de conexão do seu server.js
const MONGO_URI = "mongodb+srv://gpedroifpr:PedroSamara123@penicius.s0ji1as.mongodb.net/?retryWrites=true&w=majority&appName=penicius"; 

// Copie EXATAMENTE as mesmas definições de Schema do seu server.js
const ProdutoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: String,
    preco: { type: Number, required: true },
    categoria: { type: String, required: true },
    imagem_url: String,
    data_criacao: { type: Date, default: Date.now }
});
const Produto = mongoose.model('Produto', ProdutoSchema);


// --- 2. FUNÇÃO DE SEED ---
const seedDatabase = async () => {
    try {
        // Conecta ao banco de dados
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Conectado ao MongoDB Atlas para o processo de seed...");

        // Apaga todos os produtos existentes para começar do zero
        console.log("Limpando a coleção de produtos...");
        await Produto.deleteMany({});

        // Lê o arquivo de dados
        const dataPath = path.join(__dirname, 'seed-data.json');
        const seedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        
        // Insere os novos produtos no banco de dados
        console.log("Inserindo novos produtos de demonstração...");
        await Produto.insertMany(seedData.produtos);
        
        console.log("✅ Processo de seed concluído com sucesso!");

    } catch (error) {
        console.error("❌ Erro durante o processo de seed:", error);
    } finally {
        // Garante que a conexão seja fechada no final
        mongoose.connection.close();
    }
};


// --- 3. EXECUÇÃO ---
seedDatabase();