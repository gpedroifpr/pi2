// backend/seed.js (VERSÃO FINAL E COMPLETA)

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = "mongodb+srv://gpedroifpr:PedroSamara123@penicius.s0ji1as.mongodb.net/penicius_db?retryWrites=true&w=majority&appName=penicius";
const saltRounds = 10;

const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipoConta: { type: String, enum: ['cliente', 'vitrinista'], required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    vitrines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vitrine' }]
});
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado ao MongoDB...");

        await Usuario.deleteOne({ email: "admin@vitrinechic.com" });
        console.log("Usuário admin antigo removido (se existia).");

        console.log("Criando a conta de administrador padrão...");
        const adminSenhaHash = await bcrypt.hash('admin123', saltRounds);
        const adminUser = new Usuario({
            nome: "Admin",
            email: "admin@vitrinechic.com",
            senha: adminSenhaHash,
            tipoConta: "vitrinista",
            role: "admin"
        });
        await adminUser.save();
        
        console.log("\n🎉 Processo de seed concluído com sucesso! 🎉\n");
        console.log("======================================================================");
        console.log(" Conta de Administrador Criada: Login: admin@vitrinechic.com / Senha: admin123");
        console.log("======================================================================");

    } catch (error) {
        console.error("\n❌ Erro durante o processo de seed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Conexão com o MongoDB fechada.");
    }
};

seedDatabase();