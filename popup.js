const checkVoz = document.getElementById("checkVoz");
const selectDaltonismo = document.getElementById("selectDaltonismo");
const hintVoz = document.getElementById("hintVoz");
const logo = document.getElementById("logoLite");

// --- Función para quitar fondo negro (Adaptada de TS a JS nativo) ---
function removerFondoNegro(sourceUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = sourceUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                // Si es negro puro (o casi puro, margen de < 5 para evitar bordes dentados por compresión)
                if (data[i] < 5 && data[i + 1] < 5 && data[i + 2] < 5) {
                    data[i + 3] = 0; // Transparencia total
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
    });
}

// Inicializar estado e imagen
async function inicializar() {
    // 1. Limpiar logo
    try {
        const imagenTransparenteUrl = await removerFondoNegro('AdaptaPELite.png');
        logo.src = imagenTransparenteUrl;
    } catch (err) {
        console.warn("No se pudo procesar la imagen del logo.");
    }

    // 2. Cargar preferencias
    chrome.storage.local.get(["voz", "daltonismo"], (res) => {
        checkVoz.checked = res.voz || false;
        selectDaltonismo.value = res.daltonismo || "ninguno";
        hintVoz.style.display = checkVoz.checked ? "block" : "none";
    });
}

async function guardarYAvisar() {
    await chrome.storage.local.set({
        voz: checkVoz.checked,
        daltonismo: selectDaltonismo.value
    });

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith("chrome://")) {
        chrome.tabs.sendMessage(tab.id, { accion: "actualizar_estado" }).catch(()=>{});
    }
}

// Event Listeners
checkVoz.addEventListener("change", (e) => {
    hintVoz.style.display = e.target.checked ? "block" : "none";
    guardarYAvisar();
});
selectDaltonismo.addEventListener("change", guardarYAvisar);

// Arrancar popup
inicializar();