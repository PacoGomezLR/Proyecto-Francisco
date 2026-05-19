/* ── MOVIMIENTOS POR ARTÍCULO — mv.js ──────────────────────────────────── */

const TIPOS = {
    PC: { label: 'Picking cliente',      cls: 'pc' },
    RG: { label: 'Regularización',       cls: 'rg' },
    PP: { label: 'Preparación interna',  cls: 'pp' },
};

function tipoInfo(tipo) {
    return TIPOS[(tipo || '').toUpperCase()] ?? { label: tipo || '—', cls: 'x' };
}

/* ── Referencias DOM ──────────────────────────────────────────────────── */
const elTimeline  = document.getElementById('mv-timeline');
const elPlaceholder = document.getElementById('mv-placeholder');
const elSummary   = document.getElementById('mv-summary');
const elSummTxt   = document.getElementById('mv-summary-text');
const elPanel     = document.getElementById('mv-panel');
const elPanelBody = document.getElementById('mv-panel-body');
const elPanelEmpty = document.getElementById('mv-panel-empty');
const elPanelClose = document.getElementById('btn-mv-panel-close');
const elBackdrop  = document.getElementById('mv-panel-backdrop');
const elBtnBuscar = document.getElementById('btn-mv-buscar');
const elBtnLimpiar = document.getElementById('btn-mv-limpiar');
const elBtnExport = document.getElementById('btn-mv-exportar');

/* ── Filtros con fechas por defecto ──────────────────────────────────── */
const today = new Date();
const hace30 = new Date(); hace30.setDate(today.getDate() - 30);
const toISO  = d => d.toISOString().split('T')[0];
document.getElementById('mv-f-desde').value = toISO(hace30);
document.getElementById('mv-f-hasta').value = toISO(today);

/* ── Estado ──────────────────────────────────────────────────────────── */
let allRows = [];
let selectedId = null;

/* ── Buscar ──────────────────────────────────────────────────────────── */
elBtnBuscar.addEventListener('click', buscar);

async function buscar() {
    elBtnBuscar.disabled = true;
    elBtnBuscar.textContent = 'Buscando…';
    cerrarPanel();

    showLoading();

    try {
        const data = await SGA.movimientos.list({});
        allRows = data;
        renderTimeline(filtrar(allRows));
    } catch {
        showError();
    } finally {
        elBtnBuscar.disabled = false;
        elBtnBuscar.textContent = 'Buscar';
    }
}

/* ── Limpiar ─────────────────────────────────────────────────────────── */
buscar();

elBtnLimpiar.addEventListener('click', () => {
    ['mv-f-articulo', 'mv-f-lote', 'mv-f-ubicacion', 'mv-f-cliente'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('mv-f-tipo').value = '';
    document.getElementById('mv-f-desde').value = toISO(hace30);
    document.getElementById('mv-f-hasta').value = toISO(today);
    allRows = [];
    selectedId = null;
    showPlaceholder();
    ocultarSummary();
    cerrarPanel();
    elBtnExport.disabled = true;
});

/* ── Exportar CSV ────────────────────────────────────────────────────── */
elBtnExport.addEventListener('click', () => {
    if (!allRows.length) return;
    const cols = ['empresa','fecha','hora','tipo','serie','numero','picking','ubicacion','etiqueta','cantidad','stock','lote','terminal','caja','palet','tercero','centro','nombre_tercero'];
    const header = cols.join(';');
    const body = allRows.map(r => cols.map(c => r[c] ?? '').join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([header + '\n' + body], { type: 'text/csv' }));
    a.download = `movimientos_${toISO(new Date())}.csv`;
    a.click();
});

/* ── Panel cierre ────────────────────────────────────────────────────── */
elPanelClose.addEventListener('click', cerrarPanel);
elBackdrop.addEventListener('click', cerrarPanel);

/* ── Filtrado en cliente ─────────────────────────────────────────────── */
function filtrar(rows) {
    const art    = document.getElementById('mv-f-articulo').value.trim().toUpperCase();
    const lote   = document.getElementById('mv-f-lote').value.trim().toUpperCase();
    const ubi    = document.getElementById('mv-f-ubicacion').value.trim().toUpperCase();
    const tipo   = document.getElementById('mv-f-tipo').value.trim().toUpperCase();
    const desde  = document.getElementById('mv-f-desde').value;
    const hasta  = document.getElementById('mv-f-hasta').value;
    const cli    = document.getElementById('mv-f-cliente').value.trim().toUpperCase();

    return rows.filter(r => {
        if (art   && !(r.articulo  ?? '').toUpperCase().includes(art))   return false;
        if (lote  && !(r.lote      ?? '').toUpperCase().includes(lote))  return false;
        if (ubi   && !(r.ubicacion ?? '').toUpperCase().includes(ubi))   return false;
        if (tipo  && (r.tipo       ?? '').toUpperCase() !== tipo)        return false;
        if (desde && r.fecha < desde)                                    return false;
        if (hasta && r.fecha > hasta)                                    return false;
        if (cli   && !(r.tercero   ?? '').toUpperCase().includes(cli) &&
                     !(r.nombre_tercero ?? '').toUpperCase().includes(cli)) return false;
        return true;
    });
}

/* ── Render timeline ─────────────────────────────────────────────────── */
function renderTimeline(rows) {
    if (!rows.length) {
        showEmpty();
        ocultarSummary();
        elBtnExport.disabled = true;
        return;
    }

    /* Agrupa por fecha (desc) */
    const byDay = {};
    rows.forEach(r => {
        (byDay[r.fecha] = byDay[r.fecha] ?? []).push(r);
    });
    const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

    elTimeline.innerHTML = days.map(day => {
        const dayRows = byDay[day];
        const label = formatDayLabel(day);
        const cards = dayRows.map(r => renderCard(r)).join('');
        return `
        <div class="mv-day-group">
            <div class="mv-day-header">
                <span class="mv-day-header-date">${formatDate(day)}</span>
                <span class="mv-day-header-label">${label}</span>
                <span class="mv-day-header-count">${dayRows.length} mov.</span>
            </div>
            <div class="mv-cards-list">${cards}</div>
        </div>`;
    }).join('');

    /* Resumen */
    const total = rows.length;
    const entradas = rows.filter(r => (r.cantidad ?? 0) > 0).reduce((s, r) => s + r.cantidad, 0);
    const salidas  = rows.filter(r => (r.cantidad ?? 0) < 0).reduce((s, r) => s + r.cantidad, 0);
    elSummTxt.innerHTML =
        `<span class="mv-summary-count">${total} movimientos</span> · ` +
        `<span style="color:var(--sga-success)">+${entradas}</span> entradas · ` +
        `<span style="color:var(--sga-danger)">${salidas}</span> salidas`;
    elSummary.hidden = false;
    elBtnExport.disabled = false;

    /* Eventos click en tarjetas */
    elTimeline.querySelectorAll('.mv-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const row = allRows.find(r => String(r.id) === id);
            if (row) abrirPanel(row, btn);
        });
    });
}

function renderCard(r) {
    const info = tipoInfo(r.tipo);
    const qty  = r.cantidad ?? 0;
    const qtyClass = qty > 0 ? 'pos' : qty < 0 ? 'neg' : 'zero';
    const qtyStr = qty > 0 ? `+${qty}` : String(qty);
    const meta = [r.ubicacion, r.etiqueta].filter(Boolean).join(' · ');
    const doc  = [r.serie && r.numero ? `${r.serie}-${r.numero}` : '', r.nombre_tercero].filter(Boolean).join(' · ');

    return `
    <button class="mv-card mv-card--${info.cls}${selectedId === r.id ? ' mv-card--selected' : ''}" data-id="${r.id}" type="button">
        <div class="mv-card-badge mv-card-badge--${info.cls}">${r.tipo ?? '?'}</div>
        <div class="mv-card-time">${r.hora ?? ''}</div>
        <div class="mv-card-body">
            <div class="mv-card-art">${r.picking ? `PK: ${r.picking}` : info.label}</div>
            ${meta ? `<div class="mv-card-meta">${meta}</div>` : ''}
            ${doc  ? `<div class="mv-card-doc">${doc}</div>`  : ''}
        </div>
        <div class="mv-card-qty mv-card-qty--${qtyClass}">${qtyStr}</div>
    </button>`;
}

/* ── Panel detalle ───────────────────────────────────────────────────── */
function abrirPanel(r, btn) {
    selectedId = r.id;
    /* Quita selección anterior y marca la nueva */
    elTimeline.querySelectorAll('.mv-card--selected').forEach(el => el.classList.remove('mv-card--selected'));
    btn.classList.add('mv-card--selected');

    const info = tipoInfo(r.tipo);
    const qty  = r.cantidad ?? 0;
    const qtyClass = qty > 0 ? 'pos' : qty < 0 ? 'neg' : 'zero';
    const qtyStr   = qty > 0 ? `+${qty}` : String(qty);

    elPanelBody.innerHTML = `
    <div class="mv-panel-hero">
        <div class="mv-panel-badge-lg mv-card-badge--${info.cls}">${r.tipo ?? '?'}</div>
        <div class="mv-panel-hero-info">
            <div class="mv-panel-tipo">${info.label}</div>
            <div class="mv-panel-datetime">${formatDate(r.fecha)} · ${r.hora ?? ''}</div>
        </div>
    </div>

    <div class="mv-panel-section">
        <div class="mv-panel-section-title">Cantidad</div>
        <div class="mv-detail-qty mv-detail-qty--${qtyClass}">${qtyStr}</div>
        <div class="mv-detail-stock-note">Stock resultante: ${r.stock ?? '—'}</div>
    </div>

    <div class="mv-panel-section">
        <div class="mv-panel-section-title">Almacén</div>
        ${detailRow('Ubicación', r.ubicacion)}
        ${detailRow('Etiqueta / Lote', [r.etiqueta, r.lote].filter(Boolean).join(' / ') || '—')}
        ${detailRow('Palet', r.palet || '—')}
        ${detailRow('Caja', r.caja || '—')}
    </div>

    <div class="mv-panel-section">
        <div class="mv-panel-section-title">Documento</div>
        ${detailRow('Serie', r.serie || '—')}
        ${detailRow('Número', r.numero || '—')}
        ${detailRow('Picking', r.picking || '—')}
    </div>

    <div class="mv-panel-section">
        <div class="mv-panel-section-title">Tercero</div>
        ${detailRow('Código', r.tercero || '—')}
        ${detailRow('Nombre', r.nombre_tercero || '—')}
        ${detailRow('Centro', r.centro || '—')}
    </div>

    <div class="mv-panel-section">
        <div class="mv-panel-section-title">Sistema</div>
        ${detailRow('Terminal', r.terminal || '—')}
        ${detailRow('Empresa', r.empresa || '—')}
    </div>`;

    elPanelEmpty.hidden = true;
    elPanelBody.hidden  = false;
    elPanel.classList.add('mv-panel--open');
    elBackdrop.classList.add('mv-panel-backdrop--visible');
}

function cerrarPanel() {
    selectedId = null;
    elTimeline.querySelectorAll('.mv-card--selected').forEach(el => el.classList.remove('mv-card--selected'));
    elPanel.classList.remove('mv-panel--open');
    elBackdrop.classList.remove('mv-panel-backdrop--visible');
    elPanelBody.hidden  = true;
    elPanelEmpty.hidden = false;
}

function detailRow(label, value) {
    return `
    <div class="mv-detail-row">
        <span class="mv-detail-label">${label}</span>
        <span class="mv-detail-value">${value}</span>
    </div>`;
}

/* ── Helpers de fecha ─────────────────────────────────────────────────── */
const DAYS_ES  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function parseLocalDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatDate(iso) {
    const d = parseLocalDate(iso);
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDayLabel(iso) {
    const d = parseLocalDate(iso);
    const todayISO = toISO(new Date());
    const yestDate = new Date(); yestDate.setDate(yestDate.getDate() - 1);
    if (iso === todayISO) return 'Hoy';
    if (iso === toISO(yestDate)) return 'Ayer';
    return DAYS_ES[d.getDay()];
}

/* ── Estados vacíos ──────────────────────────────────────────────────── */
function showPlaceholder() {
    elTimeline.innerHTML = `
    <div class="mv-placeholder" id="mv-placeholder">
        <span class="mv-placeholder-icon">🔍</span>
        Introduce un artículo u otros filtros y pulsa <strong>Buscar</strong>
        para ver el timeline de movimientos.
    </div>`;
}

function showLoading() {
    elTimeline.innerHTML = `
    <div class="mv-loading">
        <span class="mv-loading-icon">⏳</span>
        Cargando movimientos…
    </div>`;
}

function showEmpty() {
    elTimeline.innerHTML = `
    <div class="mv-empty">
        <span class="mv-empty-icon">📭</span>
        No se encontraron movimientos con los filtros indicados.
    </div>`;
}

function showError() {
    elTimeline.innerHTML = `
    <div class="mv-error">
        Error al conectar con el servidor. Comprueba que el backend está activo.
    </div>`;
    ocultarSummary();
    elBtnExport.disabled = true;
}

function ocultarSummary() {
    elSummary.hidden = true;
}
