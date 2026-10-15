// Mientras el panel está abierto, la pestaña activa conserva el cursor y la voz.
chrome.runtime.connect({ name: 'adapta-popup' });
const checkVoz = document.getElementById("checkVoz");
const selectIdiomaVoz = document.getElementById("selectIdiomaVoz");
const selectDaltonismo = document.getElementById("selectDaltonismo");
const logo = document.getElementById("logoLite");
const estadoPanel = document.getElementById("estadoPanel");
function mostrarEstadoPanel(clave, error = false) {
    ponerTexto(estadoPanel, clave);
    estadoPanel.dataset.error = String(error);
}
function mostrarIdioma(idioma) {
    selectIdiomaVoz.value = idioma || "auto";
    if (!selectIdiomaVoz.value) selectIdiomaVoz.value = "auto"; // Valor desconocido guardado.
    // Mostrar qué idioma del sistema se usará en «Automático».
    const detectado = detectarIdiomaVoz([...navigator.languages, navigator.language, chrome.i18n.getUILanguage()]);
    const opcion = [...selectIdiomaVoz.options].find(elemento => elemento.value === detectado);
    selectIdiomaVoz.options[0].textContent = TextosAdapta.t("popup.automatico", { idioma: opcion?.textContent || detectado });
}
function actualizarVoz() {
    ponerTexto(document.getElementById("estadoVoz"), checkVoz.checked ? "popup.activado" : "popup.desactivado");
}

function actualizarFiltro() {
    const opcion = selectDaltonismo.selectedOptions[0];
    const activo = Boolean(opcion && opcion.value !== "ninguno");
    selectDaltonismo.closest(".select-box").dataset.filtro = activo ? opcion.value : "ninguno";
    const estado = document.getElementById("estadoDaltonismo");
    if (activo) { delete estado.dataset.i18n; estado.textContent = TextosAdapta.t("popup.filtroActivo", { filtro: opcion.textContent }); }
    else ponerTexto(estado, "popup.sinFiltroActivo");
    document.getElementById("quitarDaltonismo").hidden = !activo;
}
document.getElementById("quitarDaltonismo").addEventListener("click", async () => {
    selectDaltonismo.value = "ninguno";
    await guardarYNotificar();
    selectDaltonismo.focus();
});
chrome.storage.onChanged.addListener((cambios, area) => {
    if (area === "local" && cambios.voz) {
        checkVoz.checked = Boolean(cambios.voz.newValue);
        actualizarVoz();
    }
    if (area === "local" && cambios.idiomaVoz) mostrarIdioma(cambios.idiomaVoz.newValue);
    if (area === "local" && cambios.daltonismo) {
        selectDaltonismo.value = cambios.daltonismo.newValue || "ninguno";
        actualizarFiltro();
    }
});
// Otro idioma: rehacer los textos con variables (traducirDocumento ya cambió los demás).
document.addEventListener("adapta-pe-idioma", () => { mostrarIdioma(selectIdiomaVoz.value); actualizarFiltro(); });
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
    chrome.storage.local.get(["voz", "daltonismo", "idiomaVoz"], (res) => {
        if (chrome.runtime.lastError) {
            mostrarEstadoPanel("popup.noCargo", true);
            checkVoz.disabled = selectIdiomaVoz.disabled = selectDaltonismo.disabled = true;
            return;
        }
        checkVoz.checked = res.voz || false;
        mostrarIdioma(res.idiomaVoz);
        selectDaltonismo.value = res.daltonismo || "ninguno";
        actualizarVoz();
        actualizarFiltro();
        mostrarEstadoPanel("popup.guardadoAuto");
    });
    try {
        const imagenTransparenteUrl = await removerFondoNegro('AdaptaPELite.png');
        logo.src = imagenTransparenteUrl;
    } catch (err) {
        console.warn("No se pudo procesar la imagen del logo.");
    }

}

// Guardar cambios y avisar a todas las pestañas abiertas
async function guardarYNotificar() {
    actualizarFiltro();
    actualizarVoz();
    mostrarEstadoPanel("popup.guardando");
    try {
        await chrome.storage.local.set({
            voz: checkVoz.checked,
            idiomaVoz: selectIdiomaVoz.value,
            daltonismo: selectDaltonismo.value
        });
        mostrarEstadoPanel("popup.guardados");
        const tabs = await chrome.tabs.query({}).catch(() => []);
        for (const tab of tabs) {
            if (tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://")) {
                chrome.tabs.sendMessage(tab.id, { accion: "actualizar_estado" }).catch(() => {});
            }
        }
    } catch (_) {
        mostrarEstadoPanel("popup.noGuardo", true);
    }
}

// Event Listeners
checkVoz.addEventListener("change", guardarYNotificar);
selectIdiomaVoz.addEventListener("change", guardarYNotificar);
selectDaltonismo.addEventListener("change", guardarYNotificar);

// Arrancar popup
inicializar();
