"use strict";

(function () {
    /* ── GRUPOS DE NAVEGACIÓN ────────────────────────────────────────────── */
    var NAV_GROUPS = [
        {
            label: 'Dashboard',
            links: [
                { icon: '🏠', text: 'Inicio', href: 'index.html' }
            ]
        },
        {
            label: 'Stock',
            links: [
                { icon: '📦', text: 'Consulta de stock',        href: 'pages/opciones/almacen-y-stock/consulta-de-stock/index.html' },
                { icon: '📊', text: 'Movimientos por artículo', href: 'pages/opciones/almacen-y-stock/movimientos-por-articulo/index.html' },
                { icon: '📍', text: 'Artículos por ubicación',  href: 'pages/opciones/almacen-y-stock/articulos-por-ubicacion/index.html' }
            ]
        },
        {
            label: 'Operaciones',
            links: [
                { icon: '⬇️', text: 'Entrada de mercancía', href: 'pages/opciones/almacen-y-stock/entrada-de-mercancia/index.html' },
                { icon: '⬆️', text: 'Salida de mercancía',  href: 'pages/opciones/almacen-y-stock/salida-de-mercancia/index.html' }
            ]
        },
        {
            label: 'Expediciones',
            links: [
                { icon: '🚛', text: 'Expediciones desde pedido', href: 'pages/opciones/logistica-y-pedidos/expediciones/index.html' },
                { icon: '📋', text: 'Preparación / Picking',    href: 'pages/opciones/logistica-y-pedidos/picking/index.html' }
            ]
        },
        {
            label: 'Almacén',
            links: [
                { icon: '🏗️', text: 'Almacenes',          href: 'pages/opciones/almacen-y-stock/almacenes/index.html' },
                { icon: '📌', text: 'Ubicaciones',         href: 'pages/opciones/almacen-y-stock/ubicaciones/index.html' },
                { icon: '🔧', text: 'Generar ubicaciones', href: 'pages/opciones/almacen-y-stock/generar-ubicaciones/index.html' }
            ]
        },
        {
            label: 'Catálogo',
            links: [
                { icon: '🔩', text: 'Artículos',   href: 'pages/ferreteria/articulos.html' },
                { icon: '🏭', text: 'Proveedores', href: 'pages/ferreteria/proveedores.html' },
                { icon: '👥', text: 'Clientes',    href: 'pages/visor/clientes.html' },
                { icon: '👷', text: 'Operarios',   href: 'pages/ferreteria/operarios.html' }
            ]
        },
        {
            label: 'Sistema',
            links: [
                { icon: '👤', text: 'Usuarios', href: 'pages/opciones/sistema/usuarios/index.html' }
            ]
        },
        {
            label: 'Análisis',
            links: [
                { icon: '📈', text: 'Informes', href: 'pages/informes/index.html' }
            ]
        }
    ];

    /* ── CALCULAR ROOT RELATIVO ──────────────────────────────────────────── */
    function getRoot() {
        var parts = window.location.pathname.split('/');
        var pagesIdx = parts.indexOf('pages');
        if (pagesIdx === -1) return '';
        var levels = parts.length - pagesIdx - 2;
        return '../'.repeat(levels + 1);
    }

    /* ── DETECTAR SI UN LINK ES LA PÁGINA ACTUAL ─────────────────────────── */
    function isActive(href) {
        try {
            var url = new URL(href, window.location.href);
            return url.pathname === window.location.pathname;
        } catch (_) {
            return false;
        }
    }

    /* ── CONSTRUIR HTML DE SIDEBAR ───────────────────────────────────────── */
    function buildSidebar(root) {
        var nav = '';

        NAV_GROUPS.forEach(function (group, gi) {
            // ¿algún link del grupo está activo?
            var groupActive = group.links.some(function (l) { return isActive(root + l.href); });
            var groupId = 'sga-group-' + gi;
            var open = groupActive; // abierto si contiene la página actual

            var links = '';
            group.links.forEach(function (link) {
                var href = root + link.href;
                var active = isActive(href) ? ' active' : '';
                links += '<a class="sga-nav-link' + active + '" href="' + href + '">'
                    + '<span class="sga-nav-icon">' + link.icon + '</span>'
                    + '<span>' + link.text + '</span>'
                    + '</a>';
            });

            nav += '<div class="sga-nav-section' + (open ? ' open' : '') + '" id="' + groupId + '">'
                + '<button class="sga-nav-group-btn" aria-expanded="' + open + '" data-target="' + groupId + '">'
                +   '<span class="sga-nav-group-label">' + group.label + '</span>'
                +   '<span class="sga-nav-chevron">›</span>'
                + '</button>'
                + '<div class="sga-nav-group-links">' + links + '</div>'
                + '</div>';
        });

        return '<aside class="sga-sidebar" id="sgaSidebar">'
            + '<div class="sga-sidebar-header">'
            +   '<a href="' + root + 'index.html" class="sga-sidebar-logo">📦 SGA LIN</a>'
            +   '<div class="sga-sidebar-subtitle">Sistema de Gestión de Almacén</div>'
            + '</div>'
            + '<nav class="sga-sidebar-nav">' + nav + '</nav>'
            + '<div class="sga-sidebar-footer">v1.0 · SQL Server LIN</div>'
            + '</aside>'
            + '<div class="sga-overlay" id="sgaOverlay"></div>';
    }

    /* ── INIT ────────────────────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        var root = getRoot();
        document.body.insertAdjacentHTML('afterbegin', buildSidebar(root));

        var sidebar   = document.getElementById('sgaSidebar');
        var overlay   = document.getElementById('sgaOverlay');
        var hamburger = document.querySelector('.sga-hamburger');

        // Restaurar grupos abiertos/cerrados
        var savedGroups = JSON.parse(sessionStorage.getItem('sga-groups-open') || 'null');

        document.querySelectorAll('.sga-nav-group-btn').forEach(function (btn) {
            var targetId = btn.dataset.target;
            var section  = document.getElementById(targetId);

            // Aplicar estado guardado (solo si no es la sección activa)
            if (savedGroups && targetId in savedGroups) {
                var shouldOpen = savedGroups[targetId];
                // No cerrar la sección que contiene la página activa
                if (!section.classList.contains('open') || shouldOpen) {
                    section.classList.toggle('open', shouldOpen);
                    btn.setAttribute('aria-expanded', shouldOpen);
                }
            }

            btn.addEventListener('click', function () {
                var isOpen = section.classList.toggle('open');
                btn.setAttribute('aria-expanded', isOpen);

                // Guardar estado
                var state = JSON.parse(sessionStorage.getItem('sga-groups-open') || '{}');
                state[targetId] = isOpen;
                sessionStorage.setItem('sga-groups-open', JSON.stringify(state));
            });
        });

        // Restaurar posición de scroll
        var savedScroll = sessionStorage.getItem('sga-sidebar-scroll');
        if (savedScroll && sidebar) sidebar.scrollTop = parseInt(savedScroll, 10);

        document.querySelectorAll('.sga-nav-link').forEach(function (a) {
            a.addEventListener('click', function () {
                if (sidebar) sessionStorage.setItem('sga-sidebar-scroll', sidebar.scrollTop);
            });
        });

        if (hamburger && sidebar) {
            hamburger.addEventListener('click', function () {
                var open = sidebar.classList.toggle('open');
                overlay.classList.toggle('active', open);
            });
        }

        if (overlay && sidebar) {
            overlay.addEventListener('click', function () {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
    });
})();
