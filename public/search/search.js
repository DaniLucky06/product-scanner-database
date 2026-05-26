let orderDescending = 1;
let lastOrder = -1;
let currentPage = 0;

const maxResults = 20;

document.getElementById('return-button').addEventListener('click', () => {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = "/";
    }
});

document.getElementById('search-button').addEventListener('click', () => {
    currentPage = 0;
    search(0, 1);
});

document.getElementById('name-search').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        currentPage = 0;
        search(0, 1);
    }
});

document.getElementById('prev-button').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        search(lastOrder === -1 ? 0 : lastOrder, orderDescending);
    }
});

document.getElementById('next-button').addEventListener('click', () => {
    currentPage++;
    search(lastOrder === -1 ? 0 : lastOrder, orderDescending);
});

window.addEventListener('pageshow', (event) => {
    const searchInput = document.getElementById('name-search');

    if (searchInput && searchInput.value.trim() !== "") {
        currentPage = 0;
        search(0, 1);
    }
});

async function search(order, isDescending) {
    const searchparam = document.getElementById('name-search').value.trim();

    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchparam)}&orderBy=${order}&orderDescending=${isDescending}&page=${currentPage}`);
        const result = await response.json();

        if (!Array.isArray(result)) {
            console.error("Unexpected data format returned from server");
            return;
        }

        const resultContainer = document.querySelector('.search-results');
        let htmlString = `
            <div class="legend">
                <button class="legend-p" onclick="orderBy(0)">Nome</button>
                <div class="vertical-line"></div>
                <button class="legend-p" onclick="orderBy(1)">Marca</button>
                <div class="vertical-line"></div>
                <button class="legend-p rating" onclick="orderBy(2)">Rating</button>
                <div class="vertical-line"></div>
                <button class="legend-p data" onclick="orderBy(3)">Data</button>
            </div>`;

        result.forEach((element) => {
            const likeness = element.likeness;
            const likenessPercent = Math.round(likeness * 100);

            const hue = likeness * 120;
            const saturation = Math.abs(likeness - 0.5) * 2 * 100;

            htmlString += `
                <button class="search-element" style="background-color: hsl(${hue}, ${saturation}%, 20%)"
                        onclick="window.location.href='/product/product.html?barcode=${element.barcode}'">
                    <p class="search-element-p">${element.name}</p>
                    <div class="vertical-line"></div>
                    <p class="search-element-p">${element.brand}</p>
                    <div class="vertical-line"></div>
                    <p class="search-element-p rating">${likenessPercent}%</p>
                    <div class="vertical-line"></div>
                    <p class="search-element-p data">${element.date_added}</p>
                </button>`;
        });

        resultContainer.innerHTML = htmlString;

        document.getElementById('prev-button').style.display = currentPage > 0 ? "block" : "none";
        document.getElementById('next-button').style.display = result.length === maxResults ? "block" : "none";

    } catch (error) {
        console.error("Errore durante il fetching dati:", error);
    }
}

function orderBy(filter) {
    if (filter !== lastOrder) {
        orderDescending = 1;
        lastOrder = filter;
        currentPage = 0;
        search(filter, orderDescending);
    } else {
        orderDescending = orderDescending === 1 ? 0 : 1;
        currentPage = 0;
        search(filter, orderDescending);
    }
}