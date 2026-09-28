class FiltrosDaltonismo {
    constructor() {
        this.idFiltro = "adapta-pe-filtros-svg";
    }

    aplicar(tipo) {
        let oldSvg = document.getElementById(this.idFiltro);
        if (oldSvg) oldSvg.remove();

        let styleTag = document.getElementById("adapta-pe-daltonismo-style");
        if (styleTag) styleTag.remove();

        if (tipo === "ninguno") {
            document.documentElement.style.removeProperty('filter');
            return;
        }

        // Se inyecta CSS que fuerza el filtro en el <html> y en cualquier elemento en Pantalla Completa (Emuladores/Videos)
        styleTag = document.createElement("style");
        styleTag.id = "adapta-pe-daltonismo-style";
        styleTag.textContent = `
            html, :fullscreen, ::backdrop {
                filter: url(#${tipo}) !important;
            }
        `;
        document.head.appendChild(styleTag);

        // Matrices exactas para cada tipo
        const svg = `<svg id="${this.idFiltro}" style="position:fixed; top:0; left:0; width:0; height:0; z-index:-1; pointer-events:none;">
        <defs>
          <!-- 1. Daltonismo Rojo-Verde -->
          <filter id="deuteranomalia"><feColorMatrix type="matrix" values="0.8, 0.2, 0, 0, 0  0.258, 0.742, 0, 0, 0  0, 0.142, 0.858, 0, 0  0, 0, 0, 1, 0"/></filter>
          <filter id="protanomalia"><feColorMatrix type="matrix" values="0.817, 0.183, 0, 0, 0  0.333, 0.667, 0, 0, 0  0, 0.125, 0.875, 0, 0  0, 0, 0, 1, 0"/></filter>
          <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0"/></filter>
          <filter id="protanopia"><feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0"/></filter>
          
          <!-- 2. Daltonismo Azul-Amarillo -->
          <filter id="tritanomalia"><feColorMatrix type="matrix" values="0.967, 0.033, 0, 0, 0  0, 0.733, 0.267, 0, 0  0, 0.183, 0.817, 0, 0  0, 0, 0, 1, 0"/></filter>
          <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0"/></filter>
          
          <!-- 3. Acromatopsia -->
          <filter id="acromatopsia"><feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0  0.299, 0.587, 0.114, 0, 0  0.299, 0.587, 0.114, 0, 0  0, 0, 0, 1, 0"/></filter>
        </defs></svg>`;

        document.documentElement.insertAdjacentHTML('afterbegin', svg);
    }
}