// backend/seed.js (VERSÃO FINAL SIMPLIFICADA)

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const MONGO_URI = "mongodb+srv://gpedroifpr:PedroSamara123@penicius.s0ji1as.mongodb.net/penicius_db?retryWrites=true&w=majority&appName=penicius";
const saltRounds = 10;

// Schema de Usuário (Apenas o necessário para criar o admin)
const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    vitrines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vitrine' }]
});
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado ao MongoDB Atlas para o processo de seed...");

        // Limpa APENAS o usuário admin para evitar duplicatas, mas mantém outros dados
        await Usuario.deleteOne({ email: "admin@vitrinechic.com" });

        console.log("Criando a conta de administrador padrão...");
        const adminSenhaHash = await bcrypt.hash('admin123', saltRounds);
        const adminUser = new Usuario({
            nome: "Admin",
            email: "admin@vitrinechic.com",
            senha: adminSenhaHash,
            role: "admin"
        });
        await adminUser.save();
        
        console.log("\n🎉 Processo de seed concluído com sucesso! 🎉\n");
        console.log("======================================================================");
        console.log(" Conta de Administrador Criada:");
        console.log(" Login: admin@vitrinechic.com / Senha: admin123");
        console.log(" Use esta conta para criar a primeira vitrine 'Vitrine Chic' pela interface.");
        console.log("======================================================================");

    } catch (error) {
        console.error("\n❌ Erro durante o processo de seed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Conexão com o MongoDB fechada.");
    }
};

seedDatabase();