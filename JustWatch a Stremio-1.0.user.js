// ==UserScript==
// @name         JustWatch a Stremio
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Boton para buscar en stremio desde justwatch
// @match        https://www.justwatch.com/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    /* ---------- CSS ---------- */

    function injectCSS() {
        if (document.getElementById('jw-stremio-style')) return;
        const style = document.createElement('style');
        style.id = 'jw-stremio-style';
        style.textContent = `
            .jw-stremio-glass {
                --glass-bg: rgba(255, 255, 255, 0.13);
                --glass-border: rgba(255, 255, 255, 0.3);

                position: relative;
                margin-left: 35px;
                padding: 26px 44px;
                background: var(--glass-bg);
                backdrop-filter: blur(35px) saturate(165%);
                -webkit-backdrop-filter: blur(35px) saturate(165%);
                border: 1px solid var(--glass-border);
                border-radius: 45px;
                display: flex;
                align-items: center;
                gap: 20px;
                font-weight: 600;
                color: #fff;
                text-decoration: none;
                font-size: 16px;
                box-shadow:
                    0 22px 65px rgba(0,0,0,0.22),
                    0 14px 40px rgba(0,0,0,0.18),
                    inset 0 1px 0 rgba(255,255,255,0.4);
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                min-width: 300px;
                overflow: hidden;
            }
            .jw-stremio-glass:hover {
                background: rgba(16, 185, 129, 0.3);
                border-color: rgba(255, 255, 255, 0.6);
                transform: translateY(-20px) scale(1.04);
                box-shadow:
                    0 50px 100px rgba(16,185,129,0.35),
                    0 0 0 1px rgba(255,255,255,0.4),
                    inset 0 1px 0 rgba(255,255,255,0.55);
            }
            .jw-stremio-glass img.logo-stremio {
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                transition: all 0.5s cubic-bezier(0.4,0,0.2,1);
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
                filter: brightness(1.15) contrast(1.2);
                width: 36px;
                height: 36px;
            }
            .jw-stremio-glass:hover img.logo-stremio {
                transform: scale(1.35) rotate(10deg);
                filter: brightness(1.35) drop-shadow(0 10px 30px rgba(16,185,129,0.8));
            }
            .jw-stremio-glass .glass-text strong {
                background: linear-gradient(135deg, rgba(255,255,255,1), rgba(255,255,255,0.85));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 18px;
                letter-spacing: 1px;
                display: block;
            }
            .jw-stremio-glass .glass-text .preview {
                font-size: 14px;
                opacity: 0.88;
                font-weight: 500;
                letter-spacing: 0.5px;
                margin-top: 2px;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    /* ---------- Helpers de título ---------- */

    // Lee "Título original: XXX" / "Original title: XXX" si existe
    function getOriginalTitle() {
        const selectors = ['h2','h3','p','div','span'];
        for (const sel of selectors) {
            const nodes = document.querySelectorAll(sel);
            for (const el of nodes) {
                const text = el.textContent.trim();
                let m = text.match(/^Título original:\s*(.+)$/i) ||
                        text.match(/^Original title:\s*(.+)$/i);
                if (m && m[1]) return m[1].trim();
            }
        }
        return null;
    }

    // Del pathname saca el slug después de /pelicula/ o /serie/
    function getTitleFromSlug(pathname) {
        // /es/serie/soda-master/temporada-1 → ["es","serie","soda-master","temporada-1"]
        const parts = pathname.split('/').filter(Boolean);
        const idxSerie = parts.indexOf('serie');
        const idxPeli = parts.indexOf('pelicula');
        let slug = null;

        if (idxSerie !== -1 && parts[idxSerie + 1]) slug = parts[idxSerie + 1];
        if (idxPeli !== -1 && parts[idxPeli + 1]) slug = parts[idxPeli + 1];

        if (!slug) return null;
        return decodeURIComponent(slug).replace(/-/g, ' ').trim();
    }

    // Normaliza y quita año, temporada y guiones colgando
    function limpiarTituloBase(texto) {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')// tildes
            .replace(/Temporada\s+\d+.*$/i, '')// "Temporada 1 ..."
            .trim()
            .replace(/[^\w\s\-:]/g, ' ') // símbolos raros
            .replace(/\s+/g, ' ')// espacios múltiples
            .replace(/\s*[-–]\s*\d{4}(\s|$)/g, '$1')// " - 2009"
            .replace(/\s*\(\d{4}\)(\s|$)/g, '$1') // "(2009)"
            .replace(/\d{4}\s*$/g, '')// "2009"
            .replace(/\s*[-–]\s*$/g, '')// guion final " -"
            .trim();
    }

    function limpiarTituloPreview(texto) {
        return limpiarTituloBase(texto).slice(0, 45);
    }

    // Orden de prioridad para la QUERY:
    // 1) slug del URL (soda-master → "soda master")
    // 2) título original si existe
    // 3) H1 limpio
    function getTituloBuscar(pathname, tituloH1) {
        const fromSlug = getTitleFromSlug(pathname);
        if (fromSlug) return fromSlug;

        const orig = getOriginalTitle();
        const base = orig || tituloH1;
        return limpiarTituloBase(base);
    }

    function esTituloValido() {
        const pathname = location.pathname;
        const h1 = document.querySelector('h1');
        const titulo = h1?.textContent?.trim() || '';
        return !(
            pathname === '/' ||
            pathname === '/es' ||
            /descubre|diario|trending|populares|mejor valoradas/i.test(titulo)
        );
    }

    /* ---------- Lógica principal ---------- */

    function crearBoton() {
        if (!esTituloValido()) return;
        if (document.getElementById('glass-sin-ano')) return;

        const h1 = document.querySelector('h1');
        if (!h1) return;

        const tituloFull   = h1.textContent.trim();
        const tituloBuscar = getTituloBuscar(location.pathname, tituloFull);
        const preview      = limpiarTituloPreview(tituloFull);
        const urlStremio   = `https://web.stremio.com/#/search?query=${encodeURIComponent(tituloBuscar)}`;

        const boton = document.createElement('a');
        boton.id = 'glass-sin-ano';
        boton.className = 'jw-stremio-glass';
        boton.href = urlStremio;
        boton.target = '_blank';
        boton.rel = 'noopener noreferrer';
        boton.setAttribute('aria-label', `Abrir "${tituloBuscar}" en Stremio Web`);

        boton.innerHTML = `
            <img class="logo-stremio"
                 src="https://web.stremio.com/images/stremio_symbol.png"
                 alt="Stremio" loading="lazy">
            <div class="glass-text">
                <strong>Stremio Web</strong>
                <span class="preview">${preview}</span>
            </div>
        `;

        h1.style.display = 'inline-block';
        h1.style.verticalAlign = 'middle';

        const parent = h1.parentNode;
        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.gap = '40px';

        parent.appendChild(boton);

        console.log('🎬 JustWatch → Stremio Web (slug):', tituloBuscar, urlStremio);
    }

    function init() {
        injectCSS();

        const tryCreate = () => {
            if (document.querySelector('h1')) crearBoton();
        };

        // primeros intentos
        tryCreate();
        setTimeout(tryCreate, 500);
        setTimeout(tryCreate, 1500);

        // SPA observer
        const observer = new MutationObserver(() => {
            if (!document.getElementById('glass-sin-ano')) {
                crearBoton();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

