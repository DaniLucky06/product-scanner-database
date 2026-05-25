const urlParams = new URLSearchParams(window.location.search);
const barcode = urlParams.get('barcode');

const delay = ms => new Promise(res => setTimeout(res, ms));

if (!barcode) {
    window.location.href = "/";
}

document.getElementById('barcode-display').innerText = `Barcode: ${barcode}`;

const likenessInput = document.getElementById('likeness-input');
const likenessDisplay = document.getElementById('likeness-val-display');

// COMBINED INPUT LISTENER
likenessInput.addEventListener('input', (e) => {
    const value = e.target.value;

    likenessDisplay.innerText = `${Math.round(value * 100)}%`;

    const hue = value * 120;
    const saturation = Math.abs(value - 0.5) * 2 * 100;
    const colorString = `hsl(${hue}, ${saturation}%, 50%)`;

    likenessInput.style.setProperty('--thumb-color', colorString);
});

async function loadProduct() {
    try {
        const response = await fetch(`/api/products/get/${barcode}`);
        const data = await response.json();

        if (data.exists) {
            document.getElementById('form-title').innerText = "Modifica Prodotto";
            document.getElementById('brand-input').value = data.brand;
            document.getElementById('name-input').value = data.name;
            document.getElementById('comment-input').value = data.comment || "";
            const remove_button = document.getElementById('remove-button');
            remove_button.disabled = false;
            remove_button.style.opacity = '1';
            remove_button.style.display = 'block';
            likenessInput.value = data.likeness;

            likenessInput.dispatchEvent(new Event('input'));
        } else {
            document.getElementById('form-title').innerText = "Inserisci Prodotto";
            document.getElementById('comment-input').value = "";
            likenessInput.dispatchEvent(new Event('input'));
        }
    } catch (error) {
        console.error("Errore nel recupero dei dati:", error);
    }
}

document.getElementById('save-button').addEventListener('click', async () => {
    const now = new Date();
    const formattedDateTime = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

    const payload = {
        barcode: barcode,
        brand: document.getElementById('brand-input').value.trim(),
        name: document.getElementById('name-input').value.trim(),
        likeness: parseFloat(likenessInput.value),
        date_added: formattedDateTime,
        comment: document.getElementById('comment-input').value.trim()
    };

    if (!payload.brand || !payload.name) {
        alert("Compila tutti i campi!");
        return;
    }

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            document.getElementById('save-button').innerText = "Salvato!";

            await delay(1000);
            window.location.href = "/";
        }
    } catch (error) {
        console.error("Errore durante il salvataggio:", error);
    }
});

document.getElementById('cancel-button').addEventListener('click', () => {
    window.location.href = "/";
});

document.getElementById('remove-button').addEventListener('click', async () => {
    if (!confirm("Cancellare?")) return;

    const payload = {barcode: barcode};

    try {
        const response = await fetch('/api/products/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            document.getElementById('remove-button').innerText = "Rimosso!";

            await delay(1000);
            window.location.href = "/";
        }
    } catch (error) {
        console.error("Errore durante la rimozione:", error);
    }

    window.location.href = "/";
});

loadProduct();