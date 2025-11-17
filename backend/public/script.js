// script.js (VERSÃO FINAL COM FUNCIONALIDADE DE EDIÇÃO)

document.addEventListener('DOMContentLoaded', () => {
    // SELETORES GERAIS
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
    let currentProductList = []; // !!!!! NOVO !!!!! -> Guarda a lista de produtos atual
    
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
            } else { handleLogout(); return null; }
        } catch (error) { console.error("Erro ao atualizar dados do usuário:", error); return null; }
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
                container.innerHTML = "<p>Nenhuma vitrine foi criada ainda. Seja o primeiro!</p>"; return;
            }
            vitrines.forEach(vitrine => {
                container.innerHTML += `<a href="/vitrine.html?id=${vitrine._id}" class="vitrine-card"><div class="vitrine-info"><h3 class="vitrine-name">${vitrine.nome}</h3><p class="vitrine-owner">Criado por: ${vitrine.dono.nome}</p></div></a>`;
            });
        } catch (error) { console.error("Erro ao buscar vitrines:", error); container.innerHTML = "<p>Não foi possível carregar as vitrines.</p>"; }
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
        if (targetId === 'minha-conta' && !usuarioLogado) { showLoginScreen(); return; }
        pageContents.forEach(page => page.style.display = 'none');
        const pageToShow = document.getElementById(targetId);
        if (pageToShow) pageToShow.style.display = 'block';

        if (targetId === 'explorar') renderizarListaDeVitrines();
        if (targetId === 'home') { /* A home agora é estática */ }
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
    
    async function populateMeuPainel() {
        if (!usuarioLogado) return;
        const currentUserData = await fetchAndUpdateUsuarioLogado();
        if (!currentUserData) return;
        
        const vitrineManagementContainer = document.querySelector('.vitrine-management-container');
        const productManagementPanel = document.getElementById('product-management-panel');
        const vitrineSelect = document.getElementById('vitrine-select');
        
        document.getElementById('user-name-display').textContent = currentUserData.nome;
        document.getElementById('user-email-display').textContent = currentUserData.email;
        
        if (currentUserData.tipoConta === 'vitrinista') {
            vitrineManagementContainer.style.display = 'block';
            vitrineSelect.innerHTML = '<option value="">-- Selecione uma vitrine --</option>';
            
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
        resetProductForm();
    }

    document.getElementById('vitrine-select').addEventListener('change', (e) => {
        resetProductForm();
        fetchProductsForAdmin(e.target.value);
    });
    
    async function fetchProductsForAdmin(vitrineId) {
        const productListContainer = document.querySelector('.product-list-container');
        const productListBody = document.getElementById('product-list-body');
        productListBody.innerHTML = '';
        currentProductList = []; // Limpa a lista antiga

        if (!vitrineId) {
            productListContainer.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/vitrines/${vitrineId}/produtos`);
            const produtos = await response.json();
            currentProductList = produtos; // Salva a lista de produtos atual
            renderAdminProductList(produtos);
            
            productListContainer.style.display = produtos.length > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            productListContainer.style.display = 'none';
        }
    }

    function renderAdminProductList(produtos) {
        const productListBody = document.getElementById('product-list-body');
        productListBody.innerHTML = '';
        produtos.forEach(p => {
            productListBody.innerHTML += `<tr data-product-id="${p._id}"><td>${p.nome}</td><td>R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</td><td><button class="btn-edit" data-id="${p._id}">Editar</button><button class="btn-delete" data-id="${p._id}">Excluir</button></td></tr>`;
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

    // !!!!! LÓGICA DE EDIÇÃO/CRIAÇÃO DE PRODUTO ATUALIZADA !!!!!
    const productForm = document.getElementById('product-form');
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vitrineId = document.getElementById('vitrine-select').value;
        if (!vitrineId) { alert('Selecione uma vitrine.'); return; }

        const productData = {
            nome: document.getElementById('product-nome').value,
            descricao: document.getElementById('product-descricao').value,
            preco: parseFloat(document.getElementById('product-preco').value),
            categoria: document.getElementById('product-categoria').value,
            imagem_url: document.getElementById('product-imagem').value,
            userId: usuarioLogado.id
        };

        const editingId = e.target.dataset.editingId;
        const isEditing = !!editingId;

        const url = isEditing ? `http://localhost:3000/api/produtos/${editingId}` : 'http://localhost:3000/api/produtos';
        const method = isEditing ? 'PUT' : 'POST';
        if (!isEditing) {
            productData.vitrineId = vitrineId; // Apenas envie vitrineId na criação
        }

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                resetProductForm();
                await fetchProductsForAdmin(vitrineId);
            } else {
                alert(`Erro: ${result.error || 'Erro desconhecido.'}`);
            }
        } catch (error) {
            alert('Falha de conexão ao salvar produto.');
        }
    });

    // !!!!! LÓGICA DE CLIQUE NA LISTA DE PRODUTOS ATUALIZADA !!!!!
    document.getElementById('product-list-body').addEventListener('click', async (e) => {
        const target = e.target;
        const productId = target.dataset.id;

        if (target.classList.contains('btn-delete')) {
            if (confirm('Tem certeza que deseja apagar este produto?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/produtos/${productId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: usuarioLogado.id })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        alert(result.message);
                        document.querySelector(`tr[data-product-id="${productId}"]`).remove();
                    } else {
                        alert(`Erro: ${result.error}`);
                    }
                } catch (error) {
                    alert('Erro de conexão ao deletar produto.');
                }
            }
        } else if (target.classList.contains('btn-edit')) {
            const productToEdit = currentProductList.find(p => p._id === productId);
            if (productToEdit) {
                // Preencher o formulário
                document.getElementById('product-nome').value = productToEdit.nome;
                document.getElementById('product-descricao').value = productToEdit.descricao || '';
                document.getElementById('product-preco').value = productToEdit.preco;
                document.getElementById('product-categoria').value = productToEdit.categoria;
                document.getElementById('product-imagem').value = productToEdit.imagem_url || '';

                // Mudar para o modo de edição
                document.getElementById('form-title').textContent = 'Editar Produto';
                document.getElementById('product-submit-button').textContent = 'Atualizar Produto';
                document.getElementById('product-cancel-button').style.display = 'inline-block';
                productForm.dataset.editingId = productId;
                
                // Rolar a tela até o formulário para melhor experiência do usuário
                productForm.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // !!!!! NOVA FUNÇÃO PARA RESETAR O FORMULÁRIO !!!!!
    function resetProductForm() {
        productForm.reset();
        document.getElementById('form-title').textContent = 'Adicionar Novo Produto';
        document.getElementById('product-submit-button').textContent = 'Salvar Produto';
        document.getElementById('product-cancel-button').style.display = 'none';
        productForm.dataset.editingId = '';
    }
    
    document.getElementById('product-cancel-button').addEventListener('click', resetProductForm);


    // =================================================================
    // EVENT LISTENERS GERAIS E INICIALIZAÇÃO
    // =================================================================
    
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a') || e.target.closest('button');
        if (!target) return;
        if (target.dataset.target) { e.preventDefault(); showPageContent(target.dataset.target); }
        if (target.classList.contains('go-to-login')) { e.preventDefault(); showLoginScreen(); }
        if (target.classList.contains('go-to-register')) { e.preventDefault(); showScreen(registerScreen); }
        if (target.id === 'logout-link' || target.id === 'btn-logout-my-account') { e.preventDefault(); handleLogout(); }
        if (target.classList.contains('close-modal-btn')) { e.preventDefault(); showPageContent('home'); }
        if (target.classList.contains('go-to-login-from-register')) { e.preventDefault(); showLoginScreen(); }
    });

    menuToggle.addEventListener('click', () => { sideMenu.classList.add('open'); menuOverlay.classList.add('active'); });
    document.querySelector('.close-side-menu-btn').addEventListener('click', closeSideMenu);
    menuOverlay.addEventListener('click', closeSideMenu);
    
    async function initializeApp() {
        if (usuarioLogado) {
            await fetchAndUpdateUsuarioLogado();
        }
        updateUIBasedOnLoginState();
        showPageContent('home');
    }

    initializeApp();
});