const checkVoz = document.getElementById("checkVoz");
const selectDaltonismo = document.getElementById("selectDaltonismo");
const hintVoz = document.getElementById("hintVoz");
const logo = document.getElementById("logoLite");

// --- Función para quitar fondo negro ---
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
    try {
        const imagenTransparenteUrl = await removerFondoNegro('AdaptaPELite.png');
        logo.src = imagenTransparenteUrl;
    } catch (err) {
        console.warn("No se pudo procesar la imagen del logo.");
    }

    chrome.storage.local.get(["voz", "daltonismo"], (res) => {
        checkVoz.checked = res.voz || false;
        selectDaltonismo.value = res.daltonismo || "ninguno";
        hintVoz.style.display = checkVoz.checked ? "block" : "none";
    });
}

// Guardar cambios y avisar a todas las pestañas abiertas
async function guardarYNotificar() {
    hintVoz.style.display = checkVoz.checked ? "block" : "none";

    await chrome.storage.local.set({
        voz: checkVoz.checked,
        daltonismo: selectDaltonismo.value
    });

    let tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
        if (tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://")) {
            chrome.tabs.sendMessage(tab.id, { accion: "actualizar_estado" }).catch(() => {});
        }
    }
}

// Event Listeners
checkVoz.addEventListener("change", guardarYNotificar);
selectDaltonismo.addEventListener("change", guardarYNotificar);

// Arrancar popup
inicializar();