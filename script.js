document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const mainAppScreen = document.getElementById('main-app');
    const minhaContaScreen = document.getElementById('minha-conta');

    const loginForm = document.getElementById('login-form-actual');
    const registerForm = document.getElementById('register-form-actual');

    const sideMenu = document.getElementById('sideMenu');
    const menuToggle = document.getElementById('menuToggle');
    const closeSideMenuBtn = document.querySelector('.close-side-menu-btn');
    const menuOverlay = document.querySelector('.menu-overlay');

    const pageNavLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');

    const goToLoginFromRegister = document.querySelector('.go-to-login-from-register');
    const closeLoginButton = document.querySelector('.close-login-btn');
    const closeRegisterButton = document.querySelector('.close-register-btn');

    const authLinksHeader = document.querySelector('.site-header .auth-links');
    const siteLogoHeader = document.querySelector('.site-logo-header');

    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');
    const btnLogoutMyAccount = document.getElementById('btn-logout-my-account');

    // --- NOVOS SELETORES DO PAINEL ADMIN ---
    const adminPanel = document.getElementById('admin-panel');
    const productForm = document.getElementById('product-form');
    const productListBody = document.getElementById('product-list-body');
    const formTitle = document.getElementById('form-title');
    const productIdInput = document.getElementById('product-id');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');


    // --- ESTADO DA APLICAÇÃO ---
    let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogadoPenicius')) || null;


    // --- DADOS DOS PRODUTOS (AGORA DINÂMICOS) ---
    async function renderizarProdutos() {
        try {
            const response = await fetch('http://localhost:3000/api/produtos');
            if (!response.ok) throw new Error('Falha na resposta da rede ao buscar produtos');
            const produtos = await response.json();

            // Separa os produtos por categoria
            const produtosModelos = produtos.filter(p => p.categoria === 'modelos');
            const produtosMasculinos = produtos.filter(p => p.categoria === 'masculino');
            const produtosInfantis = produtos.filter(p => p.categoria === 'infantil');

            // Renderiza cada seção
            renderizarSecao('grid-modelos', produtosModelos);
            renderizarSecao('grid-masculino', produtosMasculinos);
            renderizarSecao('grid-infantil', produtosInfantis);

        } catch (error) {
            console.error("Não foi possível buscar os produtos:", error);
        }
    }

    function renderizarSecao(containerId, arrayDeProdutos) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        if (arrayDeProdutos.length === 0) {
            container.innerHTML = '<p>Nenhum produto encontrado nesta categoria.</p>';
            return;
        }
        arrayDeProdutos.forEach(produto => {
            const precoFormatado = Number(produto.preco).toFixed(2).replace('.', ',');
            container.innerHTML += `
                <div class="product-card">
                    <div class="product-image-container"><img src="${produto.imagem_url || '/images/placeholder.jpg'}" alt="${produto.nome}"></div>
                    <div class="product-info">
                        <h3 class="product-name">${produto.nome}</h3>
                        <p class="product-price">R$ ${precoFormatado}</p>
                        <button class="add-to-cart-btn">Ver Detalhes</button>
                    </div>
                </div>`;
        });
    }


    // --- FUNÇÕES AUXILIARES ---
  // script.js

function updateUIBasedOnLoginState() {
    // Primeiro, limpa qualquer estado anterior para evitar duplicações
    const oldAdminLink = sideMenu.querySelector('[data-target="admin-panel"]');
    if (oldAdminLink) {
        oldAdminLink.remove();
    }
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }

    // Adiciona um log para sabermos que a função rodou e qual o estado do usuário
    console.log("Atualizando UI. Usuário logado:", usuarioLogado);

    if (usuarioLogado) {
        // --- Interface para usuário LOGADO ---
        if (authLinksHeader) {
            authLinksHeader.innerHTML = `<a href="#" id="my-account-link-header" data-target="min-conta">Olá, ${usuarioLogado.nome.split(' ')[0]}</a> <a href="#" id="logout-link">Sair</a>`;
        }
        if (siteLogoHeader) {
            siteLogoHeader.classList.remove('go-to-login');
            siteLogoHeader.title = "Ver Minha Conta";
            siteLogoHeader.dataset.action = 'go-to-my-account-logo';
        }
        const authLinksSideMenu = sideMenu ? sideMenu.querySelectorAll('.side-menu-link') : [];
        authLinksSideMenu.forEach(link => {
            if (link.classList.contains('go-to-login')) {
                link.textContent = 'Minha Conta';
                link.classList.remove('go-to-login');
                link.dataset.target = "minha-conta";
                link.href = "#minha-conta";
            } else if (link.classList.contains('go-to-register')) {
                link.style.display = 'none';
            }
        });

        // --- LÓGICA DE ADMINISTRAÇÃO ---
        // Adiciona um log para verificar a "role" do usuário
        console.log("Verificando se é admin. Role do usuário:", usuarioLogado.role);

        if (usuarioLogado.role === 'admin') {
            // Log de confirmação
            console.log("É ADMIN! Adicionando o link e mostrando o painel.");
            
            const adminLinkInMenu = document.createElement('a');
            adminLinkInMenu.href = "#admin-panel";
            adminLinkInMenu.textContent = "Gerenciar Produtos";
            adminLinkInMenu.classList.add('side-menu-link', 'nav-link');
            adminLinkInMenu.dataset.target = 'admin-panel';

            const aboutUsLink = sideMenu.querySelector('[data-target="sobre"]');
            if (aboutUsLink) {
                aboutUsLink.insertAdjacentElement('afterend', adminLinkInMenu);
            } else {
                // Caso o link "Sobre Nós" não seja encontrado, adiciona no final do menu
                sideMenu.appendChild(adminLinkInMenu);
            }
            adminPanel.style.display = 'block';
            fetchAndDisplayAdminProducts();
        }

    } else {
        // --- Interface para usuário DESLOGADO ---
        console.log("Nenhum usuário logado. Configurando UI para visitante.");

        if (authLinksHeader) {
            authLinksHeader.innerHTML = `<a href="#" class="go-to-register">Cadastrar</a> <a href="#" class="go-to-login">Entrar</a>`;
        }
        if (siteLogoHeader) {
            siteLogoHeader.classList.add('go-to-login');
            siteLogoHeader.title = "Ir para Login";
            delete siteLogoHeader.dataset.action;
        }
        const authLinksSideMenu = sideMenu ? sideMenu.querySelectorAll('.side-menu-link') : [];
        authLinksSideMenu.forEach(link => {
            const originalText = link.dataset.originalText || 'Minha Conta / Login';
            if (link.dataset.target === 'minha-conta') {
                link.textContent = originalText;
                link.classList.add('go-to-login');
                delete link.dataset.target;
                link.href = "#";
            }
            const registerLinkInSideMenu = sideMenu ? sideMenu.querySelector('.go-to-register') : null;
            if (registerLinkInSideMenu) {
                registerLinkInSideMenu.style.display = 'block';
                registerLinkInSideMenu.textContent = 'Cadastrar';
            }
        });
    }
}

    function populateMinhaConta() {
        if (usuarioLogado) {
            if (userNameDisplay) userNameDisplay.textContent = usuarioLogado.nome;
            if (userEmailDisplay) userEmailDisplay.textContent = usuarioLogado.email;
        } else {
            showLoginScreen();
        }
    }

    function showScreen(screenToShow) {
        [mainAppScreen, loginScreen, registerScreen].forEach(s => {
            if (s) s.classList.remove('active');
        });
        if (screenToShow) screenToShow.classList.add('active');
    }

    function showMainApp() { showScreen(mainAppScreen); }
    function showLoginScreen() { showScreen(loginScreen); closeSideMenu(); }
    function showRegisterScreen() { showScreen(registerScreen); closeSideMenu(); }

    function openSideMenu() {
        if (sideMenu) sideMenu.classList.add('open');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSideMenu() {
        if (sideMenu) sideMenu.classList.remove('open');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // SUBSTITUA A SUA FUNÇÃO 'showPageContent' POR ESTA

function showPageContent(targetId) {
    if (!targetId) return;

    if ((targetId === 'minha-conta' || targetId === 'admin-panel') && !usuarioLogado) {
        showLoginScreen();
        return;
    }

    // --- CORREÇÃO PRINCIPAL ---
    // Força TODAS as seções de conteúdo a serem escondidas primeiro.
    pageContents.forEach(page => {
        if (page) {
            page.classList.remove('active-page');
            page.style.display = 'none'; // A linha chave que força o elemento a sumir.
        }
    });

    // Em seguida, mostra APENAS a seção alvo.
    const pageToShow = document.getElementById(targetId);
    if (pageToShow) {
        pageToShow.classList.add('active-page');
        pageToShow.style.display = 'block'; // A linha chave que força o elemento a aparecer.
    }
    // --- FIM DA CORREÇÃO ---
    
    // O resto da sua função original permanece para que tudo continue funcionando.
    pageNavLinks.forEach(link => {
        if (link) link.classList.remove('active-nav-link');
        if (link && link.dataset.target === targetId) {
            link.classList.add('active-nav-link');
        }
    });

    if (targetId === 'minha-conta') {
        populateMinhaConta();
    }

    const validContentPages = ['modelos', 'masculino', 'infantil', 'sobre', 'minha-conta', 'admin-panel'];
    if (validContentPages.includes(targetId)) {
        if (history.pushState) {
            history.pushState({ page: targetId }, document.title, '#' + targetId);
        } else {
            window.location.hash = '#' + targetId;
        }
    }
    
    closeSideMenu();

    if (targetId !== 'login-screen' && targetId !== 'register-screen') {
        showMainApp();
    }
}

    // --- LÓGICA DE CADASTRO, LOGIN E LOGOUT ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nome = document.getElementById('register-nome').value.trim();
            const email = document.getElementById('register-email').value.trim().toLowerCase();
            const senha = document.getElementById('register-senha').value;
            const confirmarSenha = document.getElementById('register-confirmar-senha').value;

            if (!nome || !email || !senha || !confirmarSenha) { alert("Por favor, preencha todos os campos."); return; }
            if (senha !== confirmarSenha) { alert("As senhas não coincidem!"); return; }
            if (senha.length < 6) { alert("A senha deve ter pelo menos 6 caracteres."); return; }

            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify({ nome, email, senha }),
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    showLoginScreen();
                    registerForm.reset();
                } else {
                    alert(`Erro no cadastro: ${data.error}`);
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor:', error);
                alert('Não foi possível se conectar ao servidor.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const senha = document.getElementById('login-senha').value;

            if (!email || !senha) { alert("Por favor, preencha email e senha."); return; }

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify({ email, senha }),
                });

                const data = await response.json();

                if (response.ok) {
                    usuarioLogado = data.usuario;
                    localStorage.setItem('usuarioLogadoPenicius', JSON.stringify(usuarioLogado));
                    alert(data.message);
                    updateUIBasedOnLoginState();
                    showPageContent('modelos');
                    loginForm.reset();
                } else {
                    alert(`Erro no login: ${data.error}`);
                    usuarioLogado = null;
                    localStorage.removeItem('usuarioLogadoPenicius');
                    updateUIBasedOnLoginState();
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor:', error);
                alert('Não foi possível se conectar ao servidor.');
            }
        });
    }

    function handleLogout() {
        if (usuarioLogado) {
            alert(`Até logo, ${usuarioLogado.nome.split(' ')[0]}!`);
        }
        usuarioLogado = null;
        localStorage.removeItem('usuarioLogadoPenicius');
        updateUIBasedOnLoginState();
        showPageContent('modelos');
        if (!mainAppScreen.classList.contains('active')) {
            showMainApp();
        }
    }


    // --- LÓGICA DO PAINEL DE ADMINISTRAÇÃO ---
    async function fetchAndDisplayAdminProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/produtos');
            const products = await response.json();
            productListBody.innerHTML = '';
            products.forEach(product => {
                const precoFormatado = Number(product.preco).toFixed(2).replace('.', ',');
                productListBody.innerHTML += `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.nome}</td>
                        <td>R$ ${precoFormatado}</td>
                        <td>
                            <button class="btn-edit" data-id="${product.id}">Editar</button>
                            <button class="btn-delete" data-id="${product.id}">Excluir</button>
                        </td>
                    </tr>`;
            });
        } catch (error) { console.error('Erro ao buscar produtos para o admin:', error); }
    }

    async function populateFormForEdit(id) {
        try {
            const response = await fetch('http://localhost:3000/api/produtos');
            const products = await response.json();
            const product = products.find(p => p.id === id);
            if (product) {
                formTitle.textContent = 'Editar Produto';
                productIdInput.value = product.id;
                document.getElementById('product-nome').value = product.nome;
                document.getElementById('product-descricao').value = product.descricao;
                document.getElementById('product-preco').value = product.preco;
                document.getElementById('product-categoria').value = product.categoria;
                document.getElementById('product-imagem').value = product.imagem_url;
                cancelEditBtn.style.display = 'inline-block';
                window.scrollTo(0, adminPanel.offsetTop);
            }
        } catch(error) { console.error('Erro ao popular formulário:', error); }
    }

    function resetProductForm() {
        formTitle.textContent = 'Adicionar Novo Produto';
        productForm.reset();
        productIdInput.value = '';
        cancelEditBtn.style.display = 'none';
    }

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = productIdInput.value;
            const isEditing = !!id;
            const productData = {
                nome: document.getElementById('product-nome').value,
                descricao: document.getElementById('product-descricao').value,
                preco: document.getElementById('product-preco').value,
                categoria: document.getElementById('product-categoria').value,
                imagem_url: document.getElementById('product-imagem').value,
                userId: usuarioLogado.id
            };
            const url = isEditing ? `http://localhost:3000/api/produtos/${id}` : 'http://localhost:3000/api/produtos';
            const method = isEditing ? 'PUT' : 'POST';
            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    resetProductForm();
                    fetchAndDisplayAdminProducts();
                    renderizarProdutos(); // Atualiza a vitrine principal
                } else { alert(`Erro: ${result.error}`); }
            } catch (error) { console.error('Erro ao salvar produto:', error); }
        });
    }

    if (productListBody) {
        productListBody.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (target.classList.contains('btn-edit')) {
                populateFormForEdit(parseInt(id));
                return;
            }
            if (target.classList.contains('btn-delete')) {
    if (confirm(`Tem certeza que deseja excluir o produto ID ${id}?`)) {
        try {
            // A URL agora inclui o ID do admin para verificação
            const url = `http://localhost:3000/api/produtos/${id}?userId=${usuarioLogado.id}`;

            const response = await fetch(url, {
                method: 'DELETE' // A requisição ficou mais simples
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                fetchAndDisplayAdminProducts();
                renderizarProdutos();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            alert('Ocorreu um erro de rede ao tentar deletar o produto.');
        }
    }
}
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', resetProductForm);
    }


    // --- EVENT LISTENERS GERAIS ---
    pageNavLinks.forEach(link => {
        if (link.dataset.target) {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = link.dataset.target;
                showPageContent(targetId);
            });
        }
    });

    document.body.addEventListener('click', function (event) {
        const targetElement = event.target.closest('a') || event.target.closest('button');
        if (!targetElement) return;

        if (targetElement.classList.contains('go-to-login')) { event.preventDefault(); showLoginScreen(); }
        else if (targetElement.classList.contains('go-to-register')) { event.preventDefault(); showRegisterScreen(); }
        else if (targetElement.id === 'my-account-link-header') { event.preventDefault(); showPageContent('minha-conta'); }
        else if (targetElement.dataset.action === 'go-to-my-account-logo') { event.preventDefault(); showPageContent('minha-conta'); }
        else if (targetElement.id === 'logout-link') { event.preventDefault(); handleLogout(); }
        else if (targetElement.classList.contains('go-to-login-from-register')) { event.preventDefault(); showLoginScreen(); }
    });

    if (btnLogoutMyAccount) { btnLogoutMyAccount.addEventListener('click', handleLogout); }
    if (closeLoginButton) { closeLoginButton.addEventListener('click', showMainApp); }
    if (closeRegisterButton) { closeRegisterButton.addEventListener('click', showMainApp); }
    if (menuToggle) menuToggle.addEventListener('click', openSideMenu);
    if (closeSideMenuBtn) closeSideMenuBtn.addEventListener('click', closeSideMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeSideMenu);


    // --- NAVEGAÇÃO PELO HISTÓRICO DO NAVEGADOR ---
    window.addEventListener('popstate', (event) => {
        let targetPage = 'modelos';
        if (event.state && event.state.page) {
            targetPage = event.state.page;
        } else {
            const hash = window.location.hash.substring(1);
            if (hash) targetPage = hash;
        }
        showPageContent(targetPage);
    });

    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    function initializeApp() {
        updateUIBasedOnLoginState();
        renderizarProdutos();

        const currentHash = window.location.hash.substring(1);
        const validPages = ['modelos', 'masculino', 'infantil', 'sobre', 'minha-conta', 'admin-panel'];
        if (validPages.includes(currentHash)) {
            showPageContent(currentHash);
        } else {
            showPageContent('modelos');
        }

        const activePageId = document.querySelector('.page-content.active-page')?.id;
        if (activePageId) {
            const activeLink = sideMenu?.querySelector(`.nav-link[data-target="${activePageId}"]`);
            if (activeLink) activeLink.classList.add('active-nav-link');
        }
    }

    initializeApp();
});