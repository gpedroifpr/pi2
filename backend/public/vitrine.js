// vitrine.js (VERSÃO FINAL E COMPLETA)

document.addEventListener('DOMContentLoaded', async () => {
    const headerTitle = document.getElementById('vitrine-header-title');
    const sideMenuContainer = document.getElementById('sideMenuVitrine');
    const contentContainer = document.getElementById('vitrine-content');

    const urlParams = new URLSearchParams(window.location.search);
    const vitrineId = urlParams.get('id');

    if (!vitrineId) {
        contentContainer.innerHTML = '<h1>Erro: ID da vitrine não foi encontrado na URL.</h1>';
        return;
    }

    try {
        const [vitrineResponse, produtosResponse] = await Promise.all([
            fetch(`http://localhost:3000/api/vitrines/${vitrineId}`),
            fetch(`http://localhost:3000/api/vitrines/${vitrineId}/produtos`)
        ]);

        if (!vitrineResponse.ok) throw new Error('Vitrine não encontrada.');
        if (!produtosResponse.ok) throw new Error('Não foi possível carregar os produtos desta vitrine.');

        const estaVitrine = await vitrineResponse.json();
        const produtos = await produtosResponse.json();

        document.title = estaVitrine.nome;
        headerTitle.textContent = estaVitrine.nome;

        const categorias = produtos.reduce((acc, produto) => {
            const categoria = produto.categoria.trim() || 'Geral';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(produto);
            return acc;
        }, {});
        
        sideMenuContainer.innerHTML = `<h3>Categorias</h3>`;
        contentContainer.innerHTML = '';
        
        if (produtos.length === 0) {
            sideMenuContainer.innerHTML += '<p>Nenhuma categoria.</p>';
            contentContainer.innerHTML = '<h2>Esta vitrine ainda não tem produtos cadastrados.</h2>';
            return;
        }

        for (const nomeCategoria of Object.keys(categorias).sort()) {
            const idCategoria = `cat-${nomeCategoria.trim().replace(/\s+/g, '-')}`;
            sideMenuContainer.innerHTML += `<a href="#${idCategoria}">${nomeCategoria}</a>`;

            let secaoHTML = `<section id="${idCategoria}" class="vitrine-category-section">
                                <h2 class="page-title">${nomeCategoria}</h2>
                                <div class="content-grid">`;

            categorias[nomeCategoria].forEach(produto => {
                const precoFormatado = Number(produto.preco).toFixed(2).replace('.', ',');
                secaoHTML += `
                    <div class="product-card">
                        <div class="product-image-container"><img src="${produto.imagem_url || './images/placeholder.jpg'}" alt="${produto.nome}"></div>
                        <div class="product-info">
                            <h3 class="product-name">${produto.nome}</h3>
                            <p class="product-description">${produto.descricao || ''}</p>
                            <p class="product-price">R$ ${precoFormatado}</p>
                        </div>
                    </div>`;
            });

            secaoHTML += `</div></section>`;
            contentContainer.innerHTML += secaoHTML;
        }

    } catch (error) {
        console.error('Falha ao carregar a vitrine:', error);
        headerTitle.textContent = "Erro";
        contentContainer.innerHTML = `<h1>Não foi possível carregar a vitrine.</h1><p>${error.message}</p>`;
    }
});