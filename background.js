chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.accion === "abrir_pestana") {
        chrome.tabs.create({ url: request.url });
    }
    else if (request.accion === "cerrar_pestana") {
        if (sender.tab) chrome.tabs.remove(sender.tab.id);
    }
    else if (request.accion === "buscar_inteligente") {
        let query = request.query;
        let url = "";

        const sitios = {
            "youtube": `https://www.youtube.com/results?search_query=`,
            "mercadolibre": `https://listado.mercadolibre.com.pe/`,
            "facebook": `https://www.facebook.com/search/top/?q=`,
            "wikipedia": `https://es.wikipedia.org/wiki/Especial:Buscar?search=`,
            "amazon": `https://www.amazon.com/s?k=`,
            "instagram": `https://www.instagram.com/`,
            "chatgpt": `https://chatgpt.com/`,
            "google": `https://www.google.com/search?q=`
        };

        let sitioClave = request.sitio.toLowerCase().replace(" ", "");

        if (sitioClave === "canvas" || sitioClave === "chatgpt" || sitioClave === "instagram") {
            url = sitios[sitioClave];
        } else if (sitioClave in sitios) {
            url = query === "" ? sitios[sitioClave].split("?")[0] : sitios[sitioClave] + encodeURIComponent(sitioClave === "mercadolibre" ? query.replace(/ /g, "-") : query);
        } else {
            url = sitios["google"] + encodeURIComponent(query);
        }

        if (request.nuevaPestana) {
            chrome.tabs.create({ url: url });
        } else {
            if(sender.tab) chrome.tabs.update(sender.tab.id, { url: url });
        }
    }
  });