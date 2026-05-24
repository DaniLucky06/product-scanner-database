let cameraId;
let lastScannedBarcode = "";

const html5QrCode = new Html5Qrcode('reader');

const reset_button = document.getElementById('reset-button');
reset_button.addEventListener('click', resetScanner);

const changes_button = document.getElementById('changes-button');
changes_button.addEventListener('click', productSwitch);

// This method will trigger user permissions
Html5Qrcode.getCameras().then(devices => {
    /**
     * devices would be an array of objects of type:
     * { id: "id", label: "label" }
     */

    if (devices && devices.length) {
        const selector = document.getElementById('camera-selector');
        const savedCameraId = localStorage.getItem('preferredCameraId');

        if (savedCameraId && devices.some(device => device.id === savedCameraId)) {
            cameraId = savedCameraId;
        } else {
            cameraId = devices[0].id;
        }
        startScanning(cameraId);

        let selectHTML = "";
        devices.forEach(device => {
            const isSelected = device.id === cameraId ? "selected" : "";
            selectHTML += `<option value="${device.id}" ${isSelected}>${device.label}</option>`;
        })
        selector.innerHTML = selectHTML;

        selector.addEventListener('change', async (e) => {
            cameraId = e.target.value;

            // Save the selected camera ID to local storage
            localStorage.setItem('preferredCameraId', cameraId);

            if (html5QrCode.getState() === Html5QrcodeScannerState.SCANNING || html5QrCode.getState() === Html5QrcodeScannerState.PAUSED) {
                const previewContainer = document.querySelector('.preview');
                previewContainer.style.filter = "";
                previewContainer.style.opacity = "";
                document.body.style.backgroundColor = "black";
                document.getElementsByClassName('values-div')[0].style.opacity = "0";

                const currentActualHeight = previewContainer.offsetHeight;

                previewContainer.style.height = `${currentActualHeight}px`;

                await html5QrCode.stop();
            }

            startScanning(cameraId);
        });
    }
}).catch(err => {
});

function startScanning(id) {
    html5QrCode.start(
        id,
        { fps: 10 /*, qrbox: { width: 500, height: 500 }*/ },

        onScanSuccess,
        (errorMessage) => {
            // Quietly handle frame-by-frame parse failures (keeps console clean)
        }
    ).catch((err) => {
    });
}

function resetScanner() {
    const previewContainer = document.querySelector('.preview');

    previewContainer.style.filter = "";
    previewContainer.style.opacity = "";
    document.body.style.backgroundColor = "black";
    document.querySelectorAll('.disappear').forEach((element) => {element.style.opacity = "0"});
    document.querySelector(".preview-button-div").style.backgroundColor = "#212121";

    if (html5QrCode.getState() === Html5QrcodeScannerState.PAUSED) {
        html5QrCode.resume();
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    const previewContainer = document.querySelector('.preview');
    lastScannedBarcode = decodedText;

    // When a barcode is successfully found
    document.getElementById('cam-likeness-display').innerText = ``;
    await html5QrCode.pause(true);
    previewContainer.style.filter = "grayscale(100%)";
    previewContainer.style.opacity = "0";

    try {
        const response = await fetch(`/api/products/get/${decodedText}`);
        const data = await response.json();

        const changes_button = document.getElementById("changes-button");
        if (data.exists) {
            const likeness = data.likeness;
            const likenessPercent = Math.round(likeness * 100)
            const hue = likeness * 120;

            const saturation = Math.abs(likeness - 0.5) * 2 * 100;


            document.querySelectorAll('.disappear').forEach((element) => {element.style.opacity = "1"});
            document.getElementById('likeness-value').innerText = likenessPercent + "%";
            document.getElementById('product-data').innerText = data.name + " | " + data.brand;
            document.getElementById('insertion-date').innerText = data.date_added;
            document.getElementById('cam-comment').innerText = '';
            if (data.comment) {
                document.getElementById('cam-comment').innerText = data.comment;
            }

            document.getElementById('cam-likeness-display').innerText = `${likenessPercent}`;

            const bar = document.getElementById('likeness-bar');
            bar.style.width = likenessPercent + "%";
            bar.style.backgroundColor = `hsl(${hue}, ${saturation}%, 50%)`;
            document.getElementsByClassName('preview-button-div')[0].style.backgroundColor = `hsl(${hue}, ${saturation}%, 50%)`;

            changes_button.innerText = "Modifica prodotto"

        } else {
            document.getElementById('cam-likeness-display').innerText = `Non salvato`;
            document.querySelector(".changes-button-div").style.opacity = "1";
            changes_button.innerText = "Inserisci prodotto"
        }
    } catch (error) {
        console.error('Error fetching barcode:', error);
        resetScanner();
    }
}

function productSwitch() {
    if (!lastScannedBarcode) return;

    window.location.href = `/product/product.html?barcode=${lastScannedBarcode}`
}