document.documentElement.setAttribute('data-adapta-extension', 'true');

// Instanciar nuestras clases modulares
const gestorFiltros = new FiltrosDaltonismo();
const gestorVoz = new AsistenteVoz();

function revisarPreferencias() {
    chrome.storage.local.get(["voz", "daltonismo"], (res) => {
        // Filtros Daltonismo
        gestorFiltros.aplicar(res.daltonismo || "ninguno");

        // Asistente de Voz
        let vozActiva = res.voz || false;
        if (vozActiva) {
            if (!gestorVoz.microfonoIniciado) gestorVoz.iniciar();
        } else {
            if (gestorVoz.microfonoIniciado) gestorVoz.detener();
        }
    });
}

// Iniciar al cargar
window.addEventListener("load", revisarPreferencias);

// Escuchar cambios desde el popup
chrome.runtime.onMessage.addListener((request) => {
    if (request.accion === "actualizar_estado") revisarPreferencias();
});