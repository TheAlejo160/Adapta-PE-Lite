document.documentElement.setAttribute('data-adapta-extension', 'true');

// Instanciar solo los módulos de la versión Lite
const voiceAssistant = new VoiceAssistant();
const filtrosDaltonismo = new FiltrosDaltonismo();

// Controlador de Estado Global
function revisarPreferencias() {
    chrome.storage.local.get(["voz", "daltonismo"], (res) => {
        voiceAssistant.setEstado(res.voz || false);
        filtrosDaltonismo.aplicar(res.daltonismo || "ninguno");
    });
}

// Inicialización al cargar la página
window.addEventListener("load", revisarPreferencias);

// 1. Escucha Activa: Captura el pulso directo de popup.js
chrome.runtime.onMessage.addListener((request) => {
    if (request.accion === "actualizar_estado") {
        revisarPreferencias();
    }
});

// 2. Escucha Pasiva: Captura cambios por detrás (Fallback para pestañas dormidas)
chrome.storage.onChanged.addListener((cambios, areaName) => {
    if (areaName === "local") {
        if (cambios.voz) voiceAssistant.setEstado(cambios.voz.newValue);
        if (cambios.daltonismo) filtrosDaltonismo.aplicar(cambios.daltonismo.newValue);
    }
});

// --- CONTROL DE PESTAÑAS (EVITAR MICRÓFONOS DUPLICADOS) ---
document.addEventListener("visibilitychange", () => {
    if (typeof voiceAssistant.actualizarVisibilidad === "function") {
        voiceAssistant.actualizarVisibilidad(!document.hidden);
    }
});

window.addEventListener("focus", () => {
    if (typeof voiceAssistant.actualizarVisibilidad === "function") {
        voiceAssistant.actualizarVisibilidad(true);
    }
});

window.addEventListener("blur", () => {
    if (typeof voiceAssistant.actualizarVisibilidad === "function") {
        voiceAssistant.actualizarVisibilidad(false);
    }
});