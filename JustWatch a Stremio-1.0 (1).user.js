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
        // 🎯 QUITA AÑO (2009, 2023, etc.)
        let sinAno = texto.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/[^\w\s\-:]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\s*\(\d{4}\)(\s|$)/g, '$2')  // Quita "(2023)"
            .replace(/[-–]\s*\d{4}(\s|$)/g, '$1')   // Quita "- 2023"
            .replace(/\d{4}\s*$/g, '')              // Quita "2023" final
            .trim();
        return sinAno.slice(0, 45);
    }

    function esTituloValido() {
        const pathname = location.pathname;
        const titulo = document.querySelector('h1')?.textContent?.trim() || '';
        return !(
            pathname === '/' || pathname === '/es' ||
            /descubre|diario|trending|populares|mejor valoradas/i.test(titulo)
        );
    }

    function nombreSerie(pathname, tituloCompleto) {
        if (/temporada-\d+/.test(pathname)) {
            return limpiarTitulo(tituloCompleto).replace(/Temporada \d+.*$/i, '').trim();
        }
        return limpiarTitulo(tituloCompleto);
    }

    function glassSinAno() {
        if (!esTituloValido()) return;
        if (document.querySelector('#glass-sin-ano')) return;

        const h1 = document.querySelector('h1');
        if (!h1) return;

        const tituloFull = h1.textContent.trim();
        const tituloBuscar = nombreSerie(location.pathname, tituloFull);
        const preview = limpiarTitulo(tituloFull);
        const urlStremio = `https://web.stremio.com/#/search?query=${encodeURIComponent(tituloBuscar)}`;

        const boton = document.createElement('a');
        boton.id = 'glass-sin-ano';
        boton.href = urlStremio;
        boton.target = '_blank';
        boton.rel = 'noopener noreferrer';
        boton.innerHTML = `
            <img class="logo-stremio" src="https://web.stremio.com/images/stremio_symbol.png" alt="Stremio" loading="lazy" width="36" height="36">
            <div class="glass-text">
                <strong>Stremio Web</strong>
                <span class="preview">${preview}</span>
            </div>
        `;
        boton.style.cssText = `
            --glass-bg: rgba(255, 255, 255, 0.13);
            --glass-border: rgba(255, 255, 255, 0.3);
            --glass-glow: rgba(16, 185, 129, 0.45);

            position: relative !important;
            margin-left: 35px !important;
            padding: 26px 44px !important;
            background: var(--glass-bg) !important;
            backdrop-filter: blur(35px) saturate(165%) !important;
            -webkit-backdrop-filter: blur(35px) saturate(165%) !important;
            border: 1px solid var(--glass-border) !important;
            border-radius: 45px !important;
            display: flex !important;
            align-items: center !important;
            gap: 20px !important;
            font-weight: 600 !important;
            color: white !important;
            text-decoration: none !important;
            font-size: 16px !important;
            box-shadow:
                0 22px 65px rgba(0,0,0,0.22),
                0 14px 40px rgba(0,0,0,0.18),
                inset 0 1px 0 rgba(255,255,255,0.4) !important;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            min-width: 300px !important;
            overflow: hidden !important;
        `;

        // Logo oficial mejorado
        const logo = boton.querySelector('.logo-stremio');
        logo.style.cssText = `
            border-radius: 12px !important;
            box-shadow: 0 8px 25px rgba(0,0,0,0.4) !important;
            transition: all 0.5s cubic-bezier(0.4,0,0.2,1) !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
            filter: brightness(1.15) contrast(1.2) !important;
        `;

        // ✨ Hover glassmorphism PRO
        boton.onmouseenter = function() {
            this.style.background = 'rgba(16, 185, 129, 0.3)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            this.style.transform = 'translateY(-20px) scale(1.04)';
            this.style.boxShadow = `
                0 50px 100px rgba(16,185,129,0.35),
                0 0 0 1px rgba(255,255,255,0.4),
                inset 0 1px 0 rgba(255,255,255,0.55)
            `;
            logo.style.transform = 'scale(1.35) rotate(10deg)';
            logo.style.filter = 'brightness(1.35) drop-shadow(0 10px 30px rgba(16,185,129,0.8))';
        };
        boton.onmouseleave = function() {
            this.style.background = 'var(--glass-bg)';
            this.style.borderColor = 'var(--glass-border)';
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = `
                0 22px 65px rgba(0,0,0,0.22),
                0 14px 40px rgba(0,0,0,0.18),
                inset 0 1px 0 rgba(255,255,255,0.4)
            `;
            logo.style.transform = 'scale(1) rotate(0)';
            logo.style.filter = 'brightness(1.15) contrast(1.2)';
        };

        // Texto shine optimizado
        boton.querySelector('.glass-text strong').style.cssText = `
            background: linear-gradient(135deg, rgba(255,255,255,1), rgba(255,255,255,0.85)) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            font-size: 18px !important;
            letter-spacing: 1px !important;
        `;
        boton.querySelector('.preview').style.cssText = `
            font-size: 14px !important;
            opacity: 0.88 !important;
            font-weight: 500 !important;
            letter-spacing: 0.5px !important;
            margin-top: 2px !important;
        `;

        // Layout perfecto
        h1.style.cssText = 'display: inline-block !important; vertical-align: middle !important;';
        h1.parentNode.style.cssText += `
            display: flex !important;
            align-items: center !important;
            gap: 40px !important;
        `;
        h1.parentNode.appendChild(boton);

        console.log('🎬 Glass SIN AÑO:', urlStremio);
    }

    // Init robusto
    const initSinAno = () => {
        if (esTituloValido() && document.querySelector('h1')) {
            glassSinAno();
        } else {
            setTimeout(initSinAno, 500);
        }
    };

    document.addEventListener('DOMContentLoaded', initSinAno);
    new MutationObserver(glassSinAno).observe(document.body, {
        childList: true, subtree: true
    });
})();