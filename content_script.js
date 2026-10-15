(() => {
    if (globalThis.adaptaPEControlador?.vigente()) return;
    globalThis.adaptaPEControlador?.destruir();
    const runtimeOriginal = chrome.runtime;
    const idRecuperacion = 'adapta-pe-reconectar-' + runtimeOriginal.id;
    const urlEscucha = runtimeOriginal.getURL('voz/escucha.html');
    // El mundo aislado anterior puede sobrevivir a una actualización; retirar sus recursos.
    document.dispatchEvent(new Event(idRecuperacion));
    // Liberar motores anteriores a este arranque sin recargar la página.
    try { if (typeof voiceAssistant !== 'undefined') voiceAssistant.setEstado(false); } catch (_) {}
    let prioridad = false, destruido = false, revisionPreferencias = 0;
    const voiceAssistantNuevo = new globalThis.VoiceAssistant();
    const filtros = new globalThis.FiltrosDaltonismo();
    const mascota = new globalThis.Mascota();

    const idIndicador = 'adapta-pe-voz-indicador-' + runtimeOriginal.id;
    const textos = { es: { 'pagina.vozActiva': 'Voz activa · di Computadora' }, en: { 'pagina.vozActiva': 'Voice on · say Computer' },
        pt: { 'pagina.vozActiva': 'Voz ativa · diga Computador' }, de: { 'pagina.vozActiva': 'Sprache aktiv · sage Computer' },
        fr: { 'pagina.vozActiva': 'Voix active · dites Ordinateur' }, it: { 'pagina.vozActiva': 'Voce attiva · di’ Computer' } };
    globalThis.TextosAdapta?.definir(textos);
    const t = clave => globalThis.TextosAdapta?.t(clave) ?? textos.es[clave];
    let textoVoz = null; // null: texto predeterminado en el idioma actual.
    let indicador;
    function mostrarIndicador() {
        if (destruido || !voiceAssistantNuevo.permitidoPorUsuario || document.hidden) { indicador?.remove(); return; }
        if (!indicador) {
            indicador = document.createElement('div'); indicador.id = idIndicador;
            indicador.setAttribute('role', 'status');
            indicador.style.cssText = 'position:fixed;bottom:20px;left:20px;max-width:80vw;padding:10px 20px;background:#8b1420;color:white;border-radius:20px;font:14px sans-serif;z-index:999999;pointer-events:none';
        }
        if (!indicador.isConnected) document.body?.append(indicador);
        const texto = textoVoz ?? t('pagina.vozActiva');
        if (indicador.textContent !== texto) indicador.textContent = texto;
    }
    function vigente() { try { return !destruido && Boolean(runtimeOriginal.id && runtimeOriginal.getManifest()); } catch (_) { return false; } }
    // Extensión desactivada o desinstalada: Chrome no retira el script; limpiar sin recargar.
    function revisarVigencia() { if (!destruido && !vigente()) destruir(); return !destruido; }
    function recuperarInterfaz() {
        if (!revisarVigencia() || !document.body) return;
        observarInterfaz.disconnect();
        for (const nodo of [document.documentElement, document.head, document.body]) if (nodo) observarInterfaz.observe(nodo, { childList: true });
        if (mascota.visible && mascota.host && !mascota.host.isConnected) { document.body.append(mascota.host); mascota.colocar(); }
        filtros.aplicar(filtros.filtroActual);
        mostrarIndicador();
    }
    const observarInterfaz = new MutationObserver(recuperarInterfaz);
    voiceAssistantNuevo.alEstado = (texto, tipo) => { mascota.estadoVoz(texto, tipo); chrome.runtime.sendMessage({ accion: 'voz_resultado', texto, tipo }).catch(() => {}); };
    const clavesPreferencias = ['voz', 'daltonismo', 'mascota', 'posicionMascota', 'idiomaVoz'];
    // Un solo ajuste (`idiomaVoz`, «auto» por defecto) fija voz e interfaz; los módulos se retraducen sin recargar.
    function aplicarIdioma(valor) {
        const codigo = globalThis.CodigosVoz?.includes(valor) ? valor : globalThis.detectarIdiomaVoz?.([...navigator.languages, navigator.language]) ?? 'es-PE';
        if (!globalThis.TextosAdapta) return;
        const anterior = globalThis.TextosAdapta.idioma;
        if (globalThis.TextosAdapta.fijarIdioma(codigo) !== anterior) { textoVoz = null; mascota.actualizarTextos(); }
    }
    async function revisarPreferencias() {
        const revision = ++revisionPreferencias;
        const res = await chrome.storage.local.get(clavesPreferencias);
        if (destruido || revision !== revisionPreferencias) return;
        aplicarIdioma(res.idiomaVoz);
        voiceAssistantNuevo.permitidoPorUsuario = Boolean(res.voz);
        filtros.aplicar(res.daltonismo || 'ninguno');
        mascota.configurar(res.mascota, res.posicionMascota);
        mascota.actualizarVisibilidad(!document.hidden);
        mascota.actualizarPrioridad(prioridad);

        mostrarIndicador();
    }
    function actualizarVisibilidad() {
        if (!destruido && !revisarVigencia()) return;
        mascota.actualizarVisibilidad(!document.hidden);
        mascota.actualizarPrioridad(prioridad);
        mostrarIndicador();
    }
    function alMensaje(peticion, emisor, responder) {
        if (destruido || emisor.id !== runtimeOriginal.id) return;
        // En la Nueva pestaña propia (página de extensión) también llegan los runtime.sendMessage de
        // pestañas y del documento offscreen; sólo valen los envíos dirigidos del worker o del popup.
        if (emisor.tab || emisor.url === urlEscucha) return;
        if (peticion.accion === 'pagina_comprobar') { responder({ ok: true }); return; }
        if (peticion.accion === 'mascota_estado') { mascota.reaccionar(peticion.estado, peticion.hablando); return; }
        if (peticion.accion === 'control_prioridad') {
            prioridad = Boolean(peticion.activa);
            actualizarVisibilidad();
            if (!prioridad) { responder({ ok: true }); return; }
            revisarPreferencias().then(() => responder({ ok: true })).catch(() => responder({ ok: false }));
            return true;
        }

        if (peticion.accion === 'voz_ejecutar') {
            if (typeof peticion.texto !== 'string' || peticion.texto.length > 4000) return;
            voiceAssistantNuevo.ejecutarComando(peticion.texto); responder({ ok: true }); return;
        }
        if (peticion.accion === 'voz_indicador') {
            if (peticion.activa) mascota.estadoVoz(String(peticion.texto || ''), peticion.tipo);
            voiceAssistantNuevo.permitidoPorUsuario = Boolean(peticion.activa);
            textoVoz = peticion.texto ? String(peticion.texto) : null;
            mostrarIndicador(); return;
        }
        if (peticion.accion === 'actualizar_estado') revisarPreferencias().catch(() => {});
    }
    function alCambiar(cambios, area) {
        // Otras claves no cambian la página: evitar relecturas en cada pestaña.
        if (area === 'local' && clavesPreferencias.some(clave => clave in cambios)) revisarPreferencias().catch(() => {});
    }
    function registrar() {
        chrome.runtime.sendMessage({ accion: 'pagina_lista' }).catch(() => {});
    }
    function consultarVoz() {
        chrome.runtime.sendMessage({ accion: 'voz_estado' }).then(estado => {
            if (!destruido && estado?.ok) { textoVoz = estado.texto; mostrarIndicador(); }
        }).catch(() => {});
    }
    // bfcache, pestañas congeladas y prerender pueden perder avisos de storage: releer sin recargar.
    function reanudar(evento) {
        if (!revisarVigencia()) return;
        if (evento.type !== 'pageshow' || evento.persisted) { revisarPreferencias().catch(() => {}); consultarVoz(); }
        registrar();
    }
    function alOcultar() { prioridad = false; actualizarVisibilidad(); }
    function destruir() {
        if (destruido) return;
        destruido = true; prioridad = false; actualizarVisibilidad();
        observarInterfaz.disconnect();
        voiceAssistantNuevo.limpiarSeleccion(); filtros.limpiar();
        mascota.destruir();

        document.getElementById(idIndicador)?.remove();
        document.removeEventListener('visibilitychange', actualizarVisibilidad);
        document.removeEventListener(idRecuperacion, destruir);
        window.removeEventListener('pagehide', alOcultar); window.removeEventListener('pageshow', reanudar);
        document.removeEventListener('resume', reanudar); document.removeEventListener('prerenderingchange', reanudar);
        try { runtimeOriginal.onMessage.removeListener(alMensaje); chrome.storage.onChanged.removeListener(alCambiar); } catch (_) {}
    }
    globalThis.adaptaPEControlador = { voz: voiceAssistantNuevo, filtros, mascota,
        vigente, destruir };
    document.documentElement.setAttribute('data-adapta-extension', 'true');
    runtimeOriginal.onMessage.addListener(alMensaje); chrome.storage.onChanged.addListener(alCambiar);
    document.addEventListener('visibilitychange', actualizarVisibilidad);
    document.addEventListener(idRecuperacion, destruir);
    window.addEventListener('pagehide', alOcultar); window.addEventListener('pageshow', reanudar);
    document.addEventListener('resume', reanudar); document.addEventListener('prerenderingchange', reanudar);
    recuperarInterfaz(); revisarPreferencias().catch(() => {}); registrar(); consultarVoz();
})();
