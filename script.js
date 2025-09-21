// script.js (VERSÃO FINAL E COMPLETA - SEM OMISSÕES)

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
    // FUNÇÕES DE BUSCA DE DADOS (APIs)
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
                handleLogout(); // Desloga se o usuário não for encontrado
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

        if (targetId === 'home-explorar') renderizarListaDeVitrines();
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
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const data = await response.json();
            if (response.ok) {
                usuarioLogado = data.usuario;
                localStorage.setItem('usuarioLogadoPenicius', JSON.stringify(usuarioLogado));
                updateUIBasedOnLoginState();
                showPageContent('home-explorar');
            } else { alert(`Erro: ${data.error}`); }
        } catch (error) { alert('Erro de conexão ao fazer login.'); }
    });
    
    document.getElementById('register-form-actual').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('register-nome').value;
        const email = document.getElementById('register-email').value;
        const senha = document.getElementById('register-senha').value;
        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                showLoginScreen();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            alert('Erro de conexão ao se registrar.');
        }
    });

    function handleLogout() {
        usuarioLogado = null;
        localStorage.removeItem('usuarioLogadoPenicius');
        updateUIBasedOnLoginState();
        showPageContent('home-explorar');
        document.getElementById('product-management-panel').style.display = 'none';
    }

    // =================================================================
    // LÓGICA DO PAINEL "MEU PAINEL"
    // =================================================================
    
    const productManagementPanel = document.getElementById('product-management-panel');
    const vitrineSelect = document.getElementById('vitrine-select');
    const productListBody = document.getElementById('product-list-body');
    const productForm = document.getElementById('product-form');

    async function populateMeuPainel() {
        if (!usuarioLogado) return;
        
        const currentUserData = await fetchAndUpdateUsuarioLogado();
        if (!currentUserData) return; // Sai se o usuário foi deslogado
        
        document.getElementById('user-name-display').textContent = currentUserData.nome;
        document.getElementById('user-email-display').textContent = currentUserData.email;
        
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
            productListBody.innerHTML += `
                <tr data-product-id="${p._id}">
                    <td>${p.nome}</td>
                    <td>R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</td>
                    <td><button class="btn-delete" data-id="${p._id}">Excluir</button></td>
                </tr>`;
        });
    }

    document.getElementById('create-vitrine-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('vitrine-nome').value;
        const descricao = document.getElementById('vitrine-descricao').value;
        try {
            const response = await fetch('http://localhost:3000/api/vitrines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao, userId: usuarioLogado.id }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                await populateMeuPainel();
                e.target.reset();
            } else { alert(`Erro: ${data.error}`); }
        } catch (error) { alert('Erro de conexão ao criar vitrine.'); }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vitrineId = vitrineSelect.value;
        if (!vitrineId) { alert('Selecione uma vitrine.'); return; }
        const productData = {
            nome: document.getElementById('product-nome').value,
            descricao: document.getElementById('product-descricao').value,
            preco: document.getElementById('product-preco').value,
            categoria: document.getElementById('product-categoria').value,
            imagem_url: document.getElementById('product-imagem').value,
            userId: usuarioLogado.id,
            vitrineId: vitrineId
        };
        try {
            const response = await fetch('http://localhost:3000/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                productForm.reset();
                await fetchProductsForAdmin();
            } else { alert(`Erro: ${result.error}`); }
        } catch (error) { console.error('Erro ao salvar produto:', error); }
    });
    
    productListBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const productId = e.target.dataset.id;
            if (confirm('Tem certeza que deseja excluir este produto?')) {
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
        if (target.classList.contains('close-modal-btn')) showPageContent('home-explorar');
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
        showPageContent('home-explorar');
    }

    initializeApp();
});