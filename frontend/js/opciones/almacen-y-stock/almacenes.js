"use strict";

(function () {
    var _colIdx = {};

    // Parsea "P001 I X005 Y03" → { pasillo, lado, col, nivel }
    function parseEtq(etq) {
        var p = etq.match(/P(\d+)/i), x = etq.match(/X(\d+)/i),
            y = etq.match(/Y(\d+)/i), l = etq.match(/\b([ID])\b/i);
        if (!p || !x || !y) return null;
        return { pasillo: +p[1], lado: l ? l[1].toUpperCase() : 'I', col: +x[1], nivel: +y[1] };
    }

    function colKey(pasillo, lado, col) {
        return 'P' + pasillo + '-' + lado + '-' + col;
    }

    function buildIndex(ubis, stks) {
        // stock index: ubicacion → { total, arts }
        var stkIdx = {};
        stks.forEach(function (s) {
            var k = s.ubicacion; if (!k) return;
            if (!stkIdx[k]) stkIdx[k] = { total: 0, arts: [] };
            stkIdx[k].total += Number(s.stock || 0);
            stkIdx[k].arts.push(s);
        });

        // column index: agrega los 5 niveles Y de cada columna
        var colIdx = {};
        ubis.forEach(function (u) {
            var p = parseEtq(u.etiqueta); if (!p) return;
            var key = colKey(p.pasillo, p.lado, p.col);
            if (!colIdx[key]) colIdx[key] = { pasillo: p.pasillo, lado: p.lado, col: p.col, total: 0, arts: [] };
            var stk = stkIdx[u.ubicacion || u.etiqueta];
            if (stk) {
                colIdx[key].total += stk.total;
                stk.arts.forEach(function (a) {
                    colIdx[key].arts.push({ articulo: a.articulo, nombre: a.nombre, stock: a.stock, nivel: p.nivel, ubi: u.ubicacion || u.etiqueta });
                });
            }
        });

        // agrupar por pasillo
        var pasillos = {};
        Object.values(colIdx).forEach(function (c) {
            if (!pasillos[c.pasillo]) pasillos[c.pasillo] = { I: [], D: [] };
            pasillos[c.pasillo][c.lado].push(c);
        });
        Object.values(pasillos).forEach(function (p) {
            ['I', 'D'].forEach(function (l) { p[l].sort(function (a, b) { return a.col - b.col; }); });
        });

        return { colIdx: colIdx, pasillos: pasillos };
    }

    function renderCanvas(pasillos) {
        var html = '';
        Object.keys(pasillos).sort(function (a, b) { return a - b; }).forEach(function (pNum) {
            var p = pasillos[pNum];
            html += '<div class="alm-zone"><div class="alm-zone-title">Pasillo ' + pNum + '</div>';
            ['I', 'D'].forEach(function (lado) {
                var cols = p[lado]; if (!cols || !cols.length) return;
                html += '<div class="alm-pasillo-label">Lado ' + (lado === 'I' ? 'Izquierda (I)' : 'Derecha (D)') + '</div>';
                html += '<div class="alm-rack">';
                cols.forEach(function (c) {
                    var cls = c.total > 0 ? 'ok' : 'empty';
                    var key = colKey(c.pasillo, c.lado, c.col);
                    var label = 'X' + String(c.col).padStart(2, '0');
                    html += '<div class="alm-cell ' + cls + '" data-key="' + key + '">' + label + '</div>';
                });
                html += '</div>';
            });
            html += '</div>';
        });
        document.getElementById('alm-canvas').innerHTML = html;

        document.querySelectorAll('.alm-cell').forEach(function (cell) {
            cell.addEventListener('click', function () {
                document.querySelectorAll('.alm-cell').forEach(function (c) { c.classList.remove('selected'); });
                cell.classList.add('selected');
                abrirPanel(cell.dataset.key);
            });
        });
    }

    function abrirPanel(key) {
        var col = _colIdx[key]; if (!col) return;
        var label = 'P' + String(col.pasillo).padStart(3, '0') + ' ' + col.lado + ' X' + String(col.col).padStart(3, '0');

        // agrupar artículos sumando niveles
        var byArt = {};
        col.arts.forEach(function (a) {
            if (!byArt[a.articulo]) byArt[a.articulo] = { articulo: a.articulo, nombre: a.nombre, total: 0 };
            byArt[a.articulo].total += Number(a.stock || 0);
        });
        var arts = Object.values(byArt).sort(function (a, b) { return b.total - a.total; });

        var filas = arts.map(function (a) {
            return '<div class="alm-panel-row">'
                + '<div class="alm-panel-art">' + a.articulo + ' — ' + a.nombre + '</div>'
                + '<div class="alm-panel-detail"><span>' + a.total + ' ud</span></div>'
                + '</div>';
        }).join('');

        if (!filas) filas = '<div style="color:#9ca3af;font-size:.85rem;padding:12px 0">Columna vacía</div>';

        document.getElementById('alm-panel-inner').innerHTML =
            '<h3>' + label + '</h3>'
            + '<div class="alm-panel-ubi">' + key + ' &nbsp;·&nbsp; ' + col.total + ' uds</div>'
            + filas;

        document.getElementById('alm-panel').classList.add('open');
    }

    document.addEventListener('DOMContentLoaded', function () {
        fetch('../../../../3d/datos/datos-demo.json')
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var result = buildIndex(d.ubicaciones || [], d.stock || []);
                _colIdx = result.colIdx;
                renderCanvas(result.pasillos);
            })
            .catch(function () {
                document.getElementById('alm-canvas').innerHTML =
                    '<div style="color:#9ca3af;text-align:center;padding:60px">Error cargando datos del almacén</div>';
            });

        document.getElementById('alm-close').addEventListener('click', function () {
            document.getElementById('alm-panel').classList.remove('open');
            document.querySelectorAll('.alm-cell').forEach(function (c) { c.classList.remove('selected'); });
        });
    });
})();
