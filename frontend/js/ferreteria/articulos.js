let todosArticulos = [];
let articuloActivo = null;

async function cargarArticulos() {
    const tbody = document.getElementById('tbody-articulos');
    tbody.innerHTML = '<tr><td colspan="10" class="loading">Cargando catálogo...</td></tr>';
    try {
        todosArticulos = await SGA.articulos.list();
        renderTabla(todosArticulos);
    } catch {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">Error al conectar con el servidor.</td></tr>';
    }
}

function campo(r, ...keys) {
    for (const k of keys) if (r[k] != null && r[k] !== '') return r[k];
    return '';
}

function renderTabla(rows) {
    const tbody = document.getElementById('tbody-articulos');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">No se encontraron artículos.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const cod  = campo(r, 'ARTCOD',  'articulo',    'id');
        const nom  = campo(r, 'ARTNOM',  'nombre');
        const smin = campo(r, 'ARTSTOMIN', 'stock_minimo');
        const smax = campo(r, 'ARTSTOMAX', 'stock_maximo');
        const cos  = campo(r, 'ARTCOS',  'precio_costo');
        const dto  = campo(r, 'ARTDES1', 'dto');
        const col  = campo(r, 'ARTCOL',  'color');
        const med  = campo(r, 'ARTMEDCOD','medida');
        const mat  = campo(r, 'ARTMAT',  'material');
        const cod2 = campo(r, 'ARTCOD2', 'codigo');
        return `<tr class="art-row" data-id="${r.id ?? cod}" style="cursor:pointer">
            <td><strong>${cod}</strong></td>
            <td>${nom}</td>
            <td>${smin}</td>
            <td>${smax}</td>
            <td>${cos !== '' ? Number(cos).toFixed(2) : ''}</td>
            <td>${dto}</td>
            <td>${col}</td>
            <td>${med}</td>
            <td>${mat}</td>
            <td>${cod2}</td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.art-row').forEach(tr => {
        tr.addEventListener('click', () => {
            const id = tr.dataset.id;
            const r = todosArticulos.find(a => (a.id ?? campo(a,'ARTCOD','articulo')) == id);
            if (r) abrirDetalle(r);
        });
    });
}

function abrirDetalle(r) {
    articuloActivo = r;
    const cod  = campo(r, 'ARTCOD',  'articulo',    'id');
    const nom  = campo(r, 'ARTNOM',  'nombre');
    const smin = campo(r, 'ARTSTOMIN', 'stock_minimo');
    const smax = campo(r, 'ARTSTOMAX', 'stock_maximo');
    const cos  = campo(r, 'ARTCOS',  'precio_costo');
    const dto  = campo(r, 'ARTDES1', 'dto');
    const col  = campo(r, 'ARTCOL',  'color');
    const med  = campo(r, 'ARTMEDCOD','medida');
    const mat  = campo(r, 'ARTMAT',  'material');
    const cod2 = campo(r, 'ARTCOD2', 'codigo');
    const bar  = campo(r, 'ARTBARCOD','barcode');
    const gru  = campo(r, 'ARTGRUCOD','grupo');

    document.getElementById('det-cod').textContent   = cod;
    document.getElementById('det-nom').textContent   = nom;
    document.getElementById('det-smin').textContent  = smin;
    document.getElementById('det-smax').textContent  = smax;
    document.getElementById('det-cos').textContent   = cos !== '' ? Number(cos).toFixed(2) + ' €' : '—';
    document.getElementById('det-dto').textContent   = dto !== '' ? dto + ' %' : '—';
    document.getElementById('det-col').textContent   = col  || '—';
    document.getElementById('det-med').textContent   = med  || '—';
    document.getElementById('det-mat').textContent   = mat  || '—';
    document.getElementById('det-cod2').textContent  = cod2 || '—';
    document.getElementById('det-bar').textContent   = bar  || '—';
    document.getElementById('det-gru').textContent   = gru  || '—';

    document.getElementById('panel-detalle').classList.add('open');
    document.getElementById('panel-backdrop').classList.add('open');

    document.querySelectorAll('.art-row').forEach(tr => tr.classList.remove('selected'));
    document.querySelector(`.art-row[data-id="${r.id ?? cod}"]`)?.classList.add('selected');
}

function cerrarDetalle() {
    document.getElementById('panel-detalle').classList.remove('open');
    document.getElementById('panel-backdrop').classList.remove('open');
    document.querySelectorAll('.art-row').forEach(tr => tr.classList.remove('selected'));
    articuloActivo = null;
}

document.getElementById('buscador-articulos').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    renderTabla(todosArticulos.filter(r =>
        Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    ));
});

document.getElementById('btn-cerrar-panel').addEventListener('click', cerrarDetalle);
document.getElementById('panel-backdrop').addEventListener('click', cerrarDetalle);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarDetalle(); });

cargarArticulos();
