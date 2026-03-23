// ==UserScript==
// @name         JustWatch a Stremio
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Boton para buscar en stremio desde justwatch
// @match        https://www.justwatch.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function limpiarTitulo(texto) {
        // ARREGLADO: regex correctos
        return texto.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/[^\w\s\-:]/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 40);
    }

    function esTituloValido() {
        const pathname = location.pathname;
        const titulo = document.querySelector('h1')?.textContent?.trim() || '';

        // ✅ MUESTRA en películas + series + TEMPORADAS
        // ❌ Oculta solo: home/listas/"Descubre a diario"/trending
        return !(
            pathname === '/' || pathname === '/es' ||
            /descubre|diario|trending|populares|mejor valoradas/i.test(titulo)
        );
    }

    function extraerNombreSerie(pathname, tituloCompleto) {
        // Para temporadas: quitar "Temporada X" y buscar solo nombre serie
        if (/temporada-\d+/.test(pathname)) {
            return tituloCompleto.replace(/Temporada \d+.*$/i, '').trim();
        }
        return tituloCompleto;
    }

    function stremioGlassTemporadas() {
        if (!esTituloValido()) return;
        if (document.querySelector('#stremio-glass-temporadas')) return;

        const h1 = document.querySelector('h1');
        if (!h1) return;

        const tituloFull = h1.textContent.trim();
        const tituloSerie = extraerNombreSerie(location.pathname, tituloFull);
        const preview = limpiarTitulo(tituloSerie);
        const urlStremio = `https://web.stremio.com/#/search?query=${encodeURIComponent(tituloSerie)}`;

        const boton = document.createElement('a');
        boton.id = 'stremio-glass-temporadas';
        boton.href = urlStremio;
        boton.target = '_blank';
        boton.rel = 'noopener noreferrer';
        boton.innerHTML = `
            <img class="logo-stremio" src="https://web.stremio.com/images/stremio_symbol.png" alt="Stremio" loading="lazy" width="34" height="34">
            <div class="glass-text">
                <strong>Stremio Web</strong>
                <span class="preview">${preview}</span>
            </div>
        `;
        boton.style.cssText = `
            --glass-bg: rgba(255, 255, 255, 0.12);
            --glass-border: rgba(255, 255, 255, 0.28);
            --glass-glow: rgba(0, 212, 170, 0.45);

            position: relative !important;
            margin-left: 32px !important;
            padding: 24px 42px !important;
            background: var(--glass-bg) !important;
            backdrop-filter: blur(32px) saturate(170%) !important;
            -webkit-backdrop-filter: blur(32px) saturate(170%) !important;
            border: 1px solid var(--glass-border) !important;
            border-radius: 42px !important;
            display: flex !important;
            align-items: center !important;
            gap: 20px !important;
            font-weight: 600 !important;
            color: white !important;
            text-decoration: none !important;
            font-size: 15px !important;
            box-shadow:
                0 20px 60px rgba(0,0,0,0.2),
                0 12px 35px rgba(0,0,0,0.15),
                inset 0 1px 0 rgba(255,255,255,0.4) !important;
            transition: all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            min-width: 290px !important;
            overflow: hidden !important;
        `;

        // 🎨 Logo oficial optimizado
        const logo = boton.querySelector('.logo-stremio');
        logo.style.cssText = `
            border-radius: 10px !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.35) !important;
            transition: all 0.45s cubic-bezier(0.4,0,0.2,1) !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
            filter: brightness(1.1) contrast(1.15) !important;
        `;

        // ✨ Hover efectos premium
        boton.onmouseenter = function() {
            this.style.background = 'rgba(0, 212, 170, 0.28)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.55)';
            this.style.transform = 'translateY(-18px) scale(1.03)';
            this.style.boxShadow = `
                0 45px 90px rgba(0,212,170,0.35),
                0 0 0 1px rgba(255,255,255,0.35),
                inset 0 1px 0 rgba(255,255,255,0.5)
            `;
            logo.style.transform = 'scale(1.3) rotate(8deg)';
            logo.style.filter = 'brightness(1.25) drop-shadow(0 8px 25px rgba(0,212,170,0.7))';
        };
        boton.onmouseleave = function() {
            this.style.background = 'var(--glass-bg)';
            this.style.borderColor = 'var(--glass-border)';
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = `
                0 20px 60px rgba(0,0,0,0.2),
                0 12px 35px rgba(0,0,0,0.15),
                inset 0 1px 0 rgba(255,255,255,0.4)
            `;
            logo.style.transform = 'scale(1) rotate(0)';
            logo.style.filter = 'brightness(1.1) contrast(1.15)';
        };

        // Texto glass shine
        boton.querySelector('.glass-text strong').style.cssText = `
            background: linear-gradient(135deg, rgba(255,255,255,1), rgba(255,255,255,0.8)) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            font-size: 18px !important;
            letter-spacing: 0.8px !important;
        `;
        boton.querySelector('.preview').style.cssText = `
            font-size: 13.5px !important;
            opacity: 0.88 !important;
            font-weight: 500 !important;
            letter-spacing: 0.4px !important;
            margin-top: 1px !important;
        `;

        // Layout limpio
        h1.style.cssText = 'display: inline-block !important;';
        h1.parentNode.style.cssText += `
            display: flex !important;
            align-items: center !important;
            gap: 38px !important;
        `;
        h1.parentNode.appendChild(boton);

        console.log('🎬 Glass + Temporadas + Logo Real:', urlStremio);
    }

    // Init robusto
    const initTemporadas = () => {
        if (esTituloValido() && document.querySelector('h1')) {
            stremioGlassTemporadas();
        } else {
            setTimeout(initTemporadas, 500);
        }
    };

    document.addEventListener('DOMContentLoaded', initTemporadas);
    new MutationObserver(stremioGlassTemporadas).observe(document.body, {
        childList: true, subtree: true
    });
})();