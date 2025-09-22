// script.js (VERSÃO FINAL REVISADA E COMPLETA)

document.addEventListener('DOMContentLoaded', () => {
    // SELETORES GLOBAIS
    const mainAppScreen = document.getElementById('main-app');
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const sideMenu = document.getElementById('sideMenu');
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.querySelector('.menu-overlay');
    const pageContents = document.querySelectorAll('.page-content');
    const authLinksHeader = document.querySelector('.site-header .auth-links');

    // ESTADO DA APLICAÇÃO
    let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogadoPenicius')) || null;
    
    // =================================================================
    // FUNÇÕES DE BUSCA DE DADOS
    // =================================================================
    
    async function fetchAndUpdateUsuarioLogado() {
        if (!usuarioLogado || !usuarioLogado.id) return null;
        try {
            const response = await fetch(`http://localhost:3000/api/meus-dados/${usuarioLogado.id}`);
            const data = await response.json();
            if (response.ok) {
                usuarioLogado = data;
                localStorage.setItem('usuarioLogadoPenicius', JSON.stringify(usuarioLogado));
                return usuarioLogado;
            } else {
                handleLogout();
                return null;
            }
        } catch (error) {
            console.error("Erro ao atualizar dados do usuário:", error);
            return null;
        }
    }
    
    // =================================================================
    // FUNÇÕES DE RENDERIZAÇÃO
    // =================================================================
    
    async function renderizarListaDeVitrines() {
        const container = document.getElementById('grid-vitrines');
        if (!container) return;
        container.innerHTML = '<p>Carregando vitrines...</p>';
        try {
            const response = await fetch('http://localhost:3000/api/vitrines');
            const vitrines = await response.json();
            container.innerHTML = '';
            if (vitrines.length === 0) {
                container.innerHTML = "<p>Nenhuma vitrine foi criada ainda. Seja o primeiro!</p>";
                return;
            }
            vitrines.forEach(vitrine => {
                container.innerHTML += `
                    <a href="/vitrine.html?id=${vitrine._id}" class="vitrine-card">
                        <div class="vitrine-info">
                            <h3 class="vitrine-name">${vitrine.nome}</h3>
                            <p class="vitrine-owner">Criado por: ${vitrine.dono.nome}</p>
                        </div>
                    </a>`;
            });
        } catch (error) { 
            console.error("Erro ao buscar vitrines:", error);
            container.innerHTML = "<p>Não foi possível carregar as vitrines.</p>";
        }
    }

    // =================================================================
    // LÓGICA DE UI E NAVEGAÇÃO
    // =================================================================
    
    function updateUIBasedOnLoginState() {
        if (usuarioLogado) {
            authLinksHeader.innerHTML = `<a href="#" data-target="minha-conta">Olá, ${usuarioLogado.nome.split(' ')[0]}</a> <a href="#" id="logout-link">Sair</a>`;
            const loginLink = sideMenu.querySelector('.go-to-login');
            if (loginLink) {
                loginLink.textContent = 'Meu Painel';
                loginLink.dataset.target = 'minha-conta';
                loginLink.classList.remove('go-to-login');
                loginLink.classList.add('nav-link');
            }
            sideMenu.querySelector('.go-to-register').style.display = 'none';
        } else {
            authLinksHeader.innerHTML = `<a href="#" class="go-to-register">Cadastrar</a> <a href="#" class="go-to-login">Entrar</a>`;
            const contaLink = sideMenu.querySelector('[data-target="minha-conta"]');
            if(contaLink) {
                contaLink.textContent = 'Meu Painel / Login';
                delete contaLink.dataset.target;
                contaLink.classList.add('go-to-login');
                contaLink.classList.remove('nav-link');
            }
            sideMenu.querySelector('.go-to-register').style.display = 'block';
        }
    }

    function showPageContent(targetId) {
        if (!targetId) return;
        if (targetId === 'minha-conta' && !usuarioLogado) {
            showLoginScreen();
            return;
        }
        pageContents.forEach(page => page.style.display = 'none');
        const pageToShow = document.getElementById(targetId);
        if (pageToShow) pageToShow.style.display = 'block';

        if (targetId === 'explorar') renderizarListaDeVitrines();
        if (targetId === 'home') { /* A home agora é estática, não precisa de ação */ }
        if (targetId === 'minha-conta') populateMeuPainel();
        
        closeSideMenu();
        showScreen(mainAppScreen);
    }

    function showScreen(screen) {
        [mainAppScreen, loginScreen, registerScreen].forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }
    
    function closeSideMenu() { sideMenu.classList.remove('open'); menuOverlay.classList.remove('active'); }
    function showLoginScreen() { showScreen(loginScreen); closeSideMenu(); }

    // =================================================================
    // LÓGICA DE AUTENTICAÇÃO
    // =================================================================
    
    document.getElementById('login-form-actual').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        try {
            const response = await fetch('http://localhost:3000/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }), });
            const data = await response.json();
            if (response.ok) {
                usuarioLogado = data.usuario;
                localStorage.setItem('usuarioLogadoPenicius', JSON.stringify(usuarioLogado));
                updateUIBasedOnLoginState();
                showPageContent('home');
            } else { alert(`Erro: ${data.error}`); }
        } catch (error) { alert('Erro de conexão ao fazer login.'); }
    });
    
    document.getElementById('register-form-actual').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('register-nome').value;
        const email = document.getElementById('register-email').value;
        const senha = document.getElementById('register-senha').value;
        const tipoConta = document.querySelector('input[name="tipoConta"]:checked').value;
        try {
            const response = await fetch('http://localhost:3000/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, email, senha, tipoConta }), });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                showLoginScreen();
            } else { alert(`Erro: ${data.error}`); }
        } catch (error) { alert('Erro de conexão ao se registrar.'); }
    });

    function handleLogout() {
        usuarioLogado = null;
        localStorage.removeItem('usuarioLogadoPenicius');
        updateUIBasedOnLoginState();
        showPageContent('home');
    }

    // =================================================================
    // LÓGICA DO PAINEL "MEU PAINEL"
    // =================================================================
    
    const vitrineManagementContainer = document.querySelector('.vitrine-management-container');
    const productManagementPanel = document.getElementById('product-management-panel');
    const vitrineSelect = document.getElementById('vitrine-select');
    const productListBody = document.getElementById('product-list-body');
    const productForm = document.getElementById('product-form');

    async function populateMeuPainel() {
        if (!usuarioLogado) return;
        const currentUserData = await fetchAndUpdateUsuarioLogado();
        if (!currentUserData) return;
        
        document.getElementById('user-name-display').textContent = currentUserData.nome;
        document.getElementById('user-email-display').textContent = currentUserData.email;
        
        if (currentUserData.tipoConta === 'vitrinista') {
            vitrineManagementContainer.style.display = 'block';
            vitrineSelect.innerHTML = '<option value="">-- Selecione uma vitrine --</option>';
            productListBody.innerHTML = '';
            
            if (currentUserData.vitrines && currentUserData.vitrines.length > 0) {
                currentUserData.vitrines.forEach(v => {
                    vitrineSelect.innerHTML += `<option value="${v._id}">${v.nome}</option>`;
                });
                productManagementPanel.style.display = 'block';
            } else {
                productManagementPanel.style.display = 'none';
            }
        } else {
            vitrineManagementContainer.style.display = 'none';
            productManagementPanel.style.display = 'none';
        }
    }

    vitrineSelect.addEventListener('change', fetchProductsForAdmin);
    
    async function fetchProductsForAdmin() {
        const vitrineId = vitrineSelect.value;
        productListBody.innerHTML = '';
        if (vitrineId) {
            try {
                const response = await fetch(`http://localhost:3000/api/vitrines/${vitrineId}/produtos`);
                const produtos = await response.json();
                renderAdminProductList(produtos);
            } catch (error) { console.error('Erro ao buscar produtos:', error); }
        }
    }

    function renderAdminProductList(produtos) {
        productListBody.innerHTML = '';
        produtos.forEach(p => {
            productListBody.innerHTML += `<tr data-product-id="${p._id}"><td>${p.nome}</td><td>R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</td><td><button class="btn-delete" data-id="${p._id}">Excluir</button></td></tr>`;
        });
    }

    document.getElementById('create-vitrine-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('vitrine-nome').value;
        const descricao = document.getElementById('vitrine-descricao').value;
        try {
            const response = await fetch('http://localhost:3000/api/vitrines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, descricao, userId: usuarioLogado.id }), });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                await populateMeuPainel();
                e.target.reset();
            } else { alert(`Erro: ${data.error}`); }
        } catch (error) { alert('Erro de conexão ao criar vitrine.'); }
    });

 // COPIE ESTE BLOCO DE CÓDIGO
// Dentro do script.js, substitua a função de submit do produto por esta:

if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Botão 'Salvar Produto' clicado!");

        const vitrineIdSelecionada = vitrineSelect.value;
        if (!vitrineIdSelecionada) {
            alert('Por favor, selecione a vitrine à qual este produto pertence.');
            return;
        }
        if (!usuarioLogado || !usuarioLogado.id) {
            alert("Erro: Usuário não está logado. Por favor, faça login novamente.");
            return;
        }

        // CORREÇÃO ESTÁ AQUI:
        // O backend espera um campo chamado 'vitrineId', não 'vitrine'.
        // Estamos garantindo que o nome do campo enviado é exatamente o que o middleware precisa.
        const productData = {
            nome: document.getElementById('product-nome').value,
            descricao: document.getElementById('product-descricao').value,
            preco: document.getElementById('product-preco').value,
            categoria: document.getElementById('product-categoria').value,
            imagem_url: document.getElementById('product-imagem').value,
            
            // Dados para o middleware de segurança:
            userId: usuarioLogado.id,
            vitrineId: vitrineIdSelecionada // O nome 'vitrineId' corresponde ao que o backend espera
        };
        
        console.log("Enviando dados do produto para o backend:", productData);

        try {
            const response = await fetch('http://localhost:3000/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            const result = await response.json(); 
            
            console.log("Resposta recebida do servidor:", result);

            if (response.ok) {
                alert(result.message);
                productForm.reset();
                await fetchProductsForAdmin();
            } else {
                console.error("Erro retornado pelo servidor:", result);
                alert(`Erro ao criar produto: ${result.error || 'Erro desconhecido.'}`);
            }
        } catch (error) {
            console.error('Falha de conexão ao tentar salvar o produto:', error);
            alert('Falha de conexão ao tentar salvar o produto. Verifique se o servidor está rodando e tente novamente.');
        }
    });
}
    
    productListBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const productId = e.target.dataset.id;
            if (confirm('Tem certeza?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/produtos/${productId}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (response.ok) {
                        alert(result.message);
                        document.querySelector(`tr[data-product-id="${productId}"]`).remove();
                    } else { alert(`Erro: ${result.error}`); }
                } catch (error) { alert('Erro de conexão ao deletar produto.'); }
            }
        }
    });

    // =================================================================
    // EVENT LISTENERS GERAIS E INICIALIZAÇÃO
    // =================================================================
    
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a') || e.target.closest('button');
        if (!target) return;
        if (target.dataset.target) { e.preventDefault(); showPageContent(target.dataset.target); }
        if (target.classList.contains('go-to-login')) { e.preventDefault(); showLoginScreen(); }
        if (target.classList.contains('go-to-register')) { e.preventDefault(); showScreen(registerScreen); }
        if (target.id === 'logout-link') { e.preventDefault(); handleLogout(); }
        if (target.classList.contains('close-modal-btn')) { e.preventDefault(); showPageContent('home'); }
        if (target.classList.contains('go-to-login-from-register')) { e.preventDefault(); showLoginScreen(); }
    });

    menuToggle.addEventListener('click', () => { sideMenu.classList.add('open'); menuOverlay.classList.add('active'); });
    document.querySelector('.close-side-menu-btn').addEventListener('click', closeSideMenu);
    menuOverlay.addEventListener('click', closeSideMenu);
    document.getElementById('btn-logout-my-account').addEventListener('click', handleLogout);

    async function initializeApp() {
        if (usuarioLogado) {
            await fetchAndUpdateUsuarioLogado();
        }
        updateUIBasedOnLoginState();
        showPageContent('home');
    }

    initializeApp();
});