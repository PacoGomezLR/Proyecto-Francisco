// ── COLORES ───────────────────────────────────────────────────────────────────
const PAL = ['#2563c0','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#6d28d9'];
const BLUE   = '#2563c0', LBLUE = 'rgba(37,99,192,.12)';
const GREEN  = '#059669', RED   = '#dc2626', AMBER = '#d97706', PURPLE = '#7c3aed';

Chart.defaults.font  = { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 11 };
Chart.defaults.color = '#6b7280';

const charts = {};
const loaded = {};   // pestañas ya cargadas

// ── PERIODO ───────────────────────────────────────────────────────────────────
let DIAS = 365;  // por defecto 1 año (para garantizar datos en demo)

document.querySelectorAll('.period-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.period-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        DIAS = parseInt(pill.dataset.dias);
        recargarTodo();
    });
});

// ── TABS ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn-inf').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn-inf').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel-inf').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('tab-' + tab).classList.add('active');
        if (!loaded[tab]) cargarTab(tab);
    });
});

function cargarTab(tab) {
    loaded[tab] = true;
    switch (tab) {
        case 'trabajadores': cargarTrabajadores(); break;
        case 'almacen':      cargarAlmacen();      break;
        case 'movimientos':  cargarMovimientos();  break;
        case 'proveedores':  cargarProveedores();  break;
        case 'articulos':    cargarArticulos();    break;
    }
}

// ── CARGA INICIAL (pestaña Resumen) ───────────────────────────────────────────
async function cargarResumen() {
    const btn = document.getElementById('btn-refresh');
    btn.textContent = '↻ Cargando...';
    btn.disabled = true;
    try {
        const resumen = { articulos: 22, ubicaciones_activas: 11, movimientos_periodo: 287, alertas_stock: 2 };
        const porDia = [
            {fecha:'2026-04-18',total:3},{fecha:'2026-04-19',total:5},{fecha:'2026-04-20',total:8},
            {fecha:'2026-04-21',total:12},{fecha:'2026-04-22',total:9},{fecha:'2026-04-23',total:7},
            {fecha:'2026-04-24',total:4},{fecha:'2026-04-25',total:6},{fecha:'2026-04-26',total:11},
            {fecha:'2026-04-27',total:15},{fecha:'2026-04-28',total:13},{fecha:'2026-04-29',total:10},
            {fecha:'2026-04-30',total:8},{fecha:'2026-05-01',total:5},{fecha:'2026-05-02',total:7},
            {fecha:'2026-05-03',total:14},{fecha:'2026-05-04',total:18},{fecha:'2026-05-05',total:16},
            {fecha:'2026-05-06',total:12},{fecha:'2026-05-07',total:9},{fecha:'2026-05-08',total:6},
            {fecha:'2026-05-09',total:8},{fecha:'2026-05-10',total:13},{fecha:'2026-05-11',total:17},
            {fecha:'2026-05-12',total:14},{fecha:'2026-05-13',total:11},{fecha:'2026-05-14',total:8},
            {fecha:'2026-05-15',total:5},{fecha:'2026-05-16',total:9},{fecha:'2026-05-17',total:15},
        ];
        const top = [
            {articulo:'ART001',nombre:'TORNILLO M6x20 INOX A2',movimientos:52},
            {articulo:'ART004',nombre:'TORNILLO M8x30 GALVANIZADO',movimientos:41},
            {articulo:'ART009',nombre:'SILICONA NEUTRA 310ml',movimientos:38},
            {articulo:'ART003',nombre:'ARANDELA M6 PLANA ACERO',movimientos:33},
            {articulo:'ART005',nombre:'CLAVIJA EXPANSION 8x50',movimientos:29},
        ];
        const evs = [
            {semana:'2026-04-14',entradas:18,salidas:14},
            {semana:'2026-04-21',entradas:22,salidas:19},
            {semana:'2026-04-28',entradas:31,salidas:26},
            {semana:'2026-05-05',entradas:27,salidas:23},
            {semana:'2026-05-12',entradas:35,salidas:29},
        ];
        const alertas = [
            {articulo:'ART021',nombre:'VARILLA ROSCADA M12 1M',minimo:20,stock_actual:5,deficit:15},
            {articulo:'ART022',nombre:'CODO PVC PRESION 25mm 90°',minimo:15,stock_actual:3,deficit:12},
        ];
        pintarKPIs(resumen);
        pintarMovimientosDia(porDia);
        pintarTopArticulos(top);
        pintarEntradasVsSalidas(evs);
        pintarTablaAlertas(alertas);
    } catch (e) {
        console.error(e);
    } finally {
        btn.textContent = '↻ Actualizar';
        btn.disabled = false;
    }
}

// ── KPIs CABECERA ─────────────────────────────────────────────────────────────
function pintarKPIs(d) {
    setText('kpi-articulos',   fmt(d.articulos));
    setText('kpi-ubicaciones', fmt(d.ubicaciones_activas));
    setText('kpi-movimientos', fmt(d.movimientos_periodo ?? d.movimientos_mes ?? 0));
    setText('kpi-alertas',     fmt(d.alertas_stock));
    setText('kpi-movimientos-label',
        DIAS >= 9999 ? 'Movimientos totales' :
        DIAS >= 365  ? 'Movimientos este año' :
        DIAS >= 90   ? 'Movimientos 90 días' :
                       'Movimientos este mes');
}

// ── RESUMEN: CHARTS ───────────────────────────────────────────────────────────
function pintarMovimientosDia(data) {
    destroy('movimientos');
    charts.movimientos = new Chart(get('chart-movimientos'), {
        type: 'line',
        data: {
            labels: data.map(r => r.fecha.slice(5)),
            datasets: [{ label: 'Movimientos', data: data.map(r => r.total),
                borderColor: BLUE, backgroundColor: LBLUE,
                borderWidth: 2, pointRadius: 2, pointHoverRadius: 5,
                fill: true, tension: .35 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
    });
}

function pintarTopArticulos(data) {
    destroy('top');
    charts.top = new Chart(get('chart-top'), {
        type: 'bar',
        data: {
            labels: data.map(r => trunc(r.nombre || r.articulo, 20)),
            datasets: [{ data: data.map(r => r.movimientos),
                backgroundColor: 'rgba(37,99,192,.7)', borderColor: BLUE,
                borderWidth: 1, borderRadius: 4 }],
        },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                      y: { grid: { display: false }, ticks: { font: { size: 10 } } } } },
    });
}

function pintarEntradasVsSalidas(data) {
    destroy('evs');
    charts.evs = new Chart(get('chart-evs'), {
        type: 'bar',
        data: {
            labels: data.map(r => 'Sem.' + r.semana.slice(5)),
            datasets: [
                { label: 'Entradas', data: data.map(r => r.entradas),
                    backgroundColor: 'rgba(5,150,105,.75)', borderColor: GREEN, borderWidth: 1, borderRadius: 4 },
                { label: 'Salidas',  data: data.map(r => r.salidas),
                    backgroundColor: 'rgba(220,38,38,.7)', borderColor: RED, borderWidth: 1, borderRadius: 4 },
            ],
        },
        options: { responsive: true,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
    });
}

function pintarTablaAlertas(data) {
    const el = document.getElementById('tabla-alertas');
    if (!data.length) { el.innerHTML = '<div class="placeholder-msg">✅ No hay artículos bajo mínimo.</div>'; return; }
    const maxD = Math.max(...data.map(r => r.deficit), 1);
    el.innerHTML = `<div class="data-table-wrap"><table>
        <thead><tr><th>Código</th><th>Artículo</th><th class="num">Mínimo</th><th class="num">Stock</th><th>Cobertura</th><th class="num">Déficit</th></tr></thead>
        <tbody>${data.map(r => `<tr>
            <td><strong>${r.articulo}</strong></td><td>${r.nombre ?? ''}</td>
            <td class="num">${r.minimo}</td><td class="num">${r.stock_actual}</td>
            <td><div class="mini-bar"><div class="mini-bar-fill" style="width:${Math.min(100,Math.round(r.stock_actual/r.minimo*100))}%;background:${r.stock_actual===0?RED:AMBER}"></div></div></td>
            <td class="num"><span class="badge badge-red">−${r.deficit}</span></td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

// ── TRABAJADORES ──────────────────────────────────────────────────────────────
async function cargarTrabajadores() {
    try {
        const data = [
            {nombre:'Carlos Pérez',   movimientos:87, unidades:1240, entradas:42, salidas:38, traspasos:7, ultima_actividad:'2026-05-17'},
            {nombre:'Ana Martínez',   movimientos:74, unidades:980,  entradas:35, salidas:33, traspasos:6, ultima_actividad:'2026-05-17'},
            {nombre:'Luis García',    movimientos:61, unidades:820,  entradas:28, salidas:27, traspasos:6, ultima_actividad:'2026-05-16'},
            {nombre:'Marta López',    movimientos:48, unidades:640,  entradas:22, salidas:21, traspasos:5, ultima_actividad:'2026-05-15'},
            {nombre:'Jorge Ruiz',     movimientos:17, unidades:230,  entradas:8,  salidas:7,  traspasos:2, ultima_actividad:'2026-05-10'},
        ];
        if (!data.length) {
            document.getElementById('mkpi-trabajadores').innerHTML = '<div class="placeholder-msg" style="grid-column:span 3">Sin datos de actividad por terminal en los últimos 30 días.</div>';
            return;
        }
        const top = data[0];
        const total = data.reduce((a, r) => a + r.movimientos, 0);
        document.getElementById('mkpi-trabajadores').innerHTML = `
            <div class="mini-kpi"><div class="mk-val">${data.length}</div><div class="mk-label">Trabajadores activos</div></div>
            <div class="mini-kpi green"><div class="mk-val">${fmt(total)}</div><div class="mk-label">Movimientos totales (30d)</div></div>
            <div class="mini-kpi amber"><div class="mk-val">${trunc(top.nombre||top.terminal,18)}</div><div class="mk-label">Más activo: ${fmt(top.movimientos)} movs.</div></div>`;

        const labels = data.map(r => trunc(r.nombre || r.terminal, 14));
        destroy('trab-mov');
        charts['trab-mov'] = new Chart(get('chart-trabajadores-mov'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{ label: 'Movimientos', data: data.map(r => r.movimientos),
                    backgroundColor: data.map((_, i) => PAL[i % PAL.length] + 'cc'),
                    borderColor: data.map((_, i) => PAL[i % PAL.length]),
                    borderWidth: 1, borderRadius: 4 }],
            },
            options: { responsive: true, plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                          y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
        });
        destroy('trab-uni');
        charts['trab-uni'] = new Chart(get('chart-trabajadores-uni'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{ label: 'Unidades', data: data.map(r => r.unidades),
                    backgroundColor: 'rgba(124,58,237,.7)', borderColor: PURPLE,
                    borderWidth: 1, borderRadius: 4 }],
            },
            options: { responsive: true, plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                          y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
        });

        const maxMov = Math.max(...data.map(r => r.movimientos), 1);
        document.getElementById('tabla-trabajadores').innerHTML = `<div class="data-table-wrap"><table>
            <thead><tr><th>#</th><th>Trabajador / Terminal</th><th class="num">Movimientos</th><th class="num">Unidades</th><th class="num">Entradas</th><th class="num">Salidas</th><th class="num">Traspasos</th><th>Actividad</th><th>Última actividad</th></tr></thead>
            <tbody>${data.map((r, i) => `<tr>
                <td><strong>#${i+1}</strong></td>
                <td><strong>${r.nombre || r.terminal}</strong></td>
                <td class="num"><span class="badge badge-blue">${fmt(r.movimientos)}</span></td>
                <td class="num">${fmt(r.unidades)}</td>
                <td class="num"><span class="badge badge-green">${r.entradas}</span></td>
                <td class="num"><span class="badge badge-red">${r.salidas}</span></td>
                <td class="num"><span class="badge badge-purple">${r.traspasos}</span></td>
                <td><div class="mini-bar" style="min-width:80px"><div class="mini-bar-fill" style="width:${Math.round(r.movimientos/maxMov*100)}%"></div></div></td>
                <td>${r.ultima_actividad ?? '—'}</td>
            </tr>`).join('')}</tbody>
        </table></div>`;
    } catch (e) { console.error(e); }
}

// ── ALMACÉN ───────────────────────────────────────────────────────────────────
async function cargarAlmacen() {
    try {
        const d = {
            ocupacion: { total_ubicaciones: 13, ocupadas: 11, vacias: 2 },
            por_almacen: [
                {almacen:'ALM1', stock_total:1216},
                {almacen:'ALM2', stock_total:92},
                {almacen:'PICK', stock_total:95},
            ],
            mas_activas: [
                {ubicacion:'A1-01-01', movimientos:34},
                {ubicacion:'A1-02-01', movimientos:28},
                {ubicacion:'A2-01-01', movimientos:22},
                {ubicacion:'B3-01-02', movimientos:18},
                {ubicacion:'P001-01',  movimientos:14},
            ],
        };
        const oc = d.ocupacion;
        const pctOcu = oc.total_ubicaciones ? Math.round(oc.ocupadas / oc.total_ubicaciones * 100) : 0;
        document.getElementById('mkpi-almacen').innerHTML = `
            <div class="mini-kpi"><div class="mk-val">${fmt(oc.total_ubicaciones)}</div><div class="mk-label">Ubicaciones totales</div></div>
            <div class="mini-kpi green"><div class="mk-val">${fmt(oc.ocupadas)}</div><div class="mk-label">Ocupadas (${pctOcu}%)</div></div>
            <div class="mini-kpi amber"><div class="mk-val">${fmt(oc.vacias)}</div><div class="mk-label">Vacías</div></div>`;

        destroy('alm-stock');
        charts['alm-stock'] = new Chart(get('chart-almacen-stock'), {
            type: 'bar',
            data: {
                labels: d.por_almacen.map(r => r.almacen || 'Sin almacén'),
                datasets: [{ label: 'Stock total', data: d.por_almacen.map(r => r.stock_total),
                    backgroundColor: PAL.slice(0, d.por_almacen.length).map(c => c + 'cc'),
                    borderColor: PAL.slice(0, d.por_almacen.length),
                    borderWidth: 1, borderRadius: 4 }],
            },
            options: { responsive: true, plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
        });

        destroy('alm-ocu');
        charts['alm-ocu'] = new Chart(get('chart-almacen-ocu'), {
            type: 'doughnut',
            data: {
                labels: ['Ocupadas', 'Vacías'],
                datasets: [{ data: [oc.ocupadas, oc.vacias],
                    backgroundColor: [GREEN + 'cc', '#e5e7eb'],
                    borderColor: [GREEN, '#d1d5db'], borderWidth: 2 }],
            },
            options: { responsive: true, cutout: '62%',
                plugins: { legend: { position: 'bottom' } } },
        });

        document.getElementById('tabla-ubicaciones').innerHTML = d.mas_activas.length
            ? `<div class="data-table-wrap"><table>
                <thead><tr><th>#</th><th>Ubicación</th><th class="num">Movimientos (30d)</th><th>Actividad</th></tr></thead>
                <tbody>${d.mas_activas.map((r, i) => `<tr>
                    <td>#${i+1}</td><td><strong>${r.ubicacion}</strong></td>
                    <td class="num"><span class="badge badge-blue">${r.movimientos}</span></td>
                    <td><div class="mini-bar"><div class="mini-bar-fill" style="width:${Math.round(r.movimientos/d.mas_activas[0].movimientos*100)}%"></div></div></td>
                </tr>`).join('')}</tbody>
               </table></div>`
            : '<div class="placeholder-msg">Sin datos de ubicaciones activas.</div>';
    } catch (e) { console.error(e); }
}

// ── MOVIMIENTOS ───────────────────────────────────────────────────────────────
const TIPO_LABEL = { E:'Entrada', S:'Salida', T:'Traspaso', R:'Regularización', I:'Inventario', P:'Pedido' };
const TIPO_COLOR = { E: GREEN, S: RED, T: BLUE, R: AMBER, I: PURPLE, P: '#0891b2' };

async function cargarMovimientos() {
    try {
        const d = {
            por_tipo: [
                {tipo:'E', total:135},
                {tipo:'S', total:118},
                {tipo:'T', total:24},
                {tipo:'R', total:10},
            ],
            por_dia_semana: [
                {dia_nombre:'Lunes',     total:58},
                {dia_nombre:'Martes',    total:52},
                {dia_nombre:'Miércoles', total:47},
                {dia_nombre:'Jueves',    total:61},
                {dia_nombre:'Viernes',   total:55},
                {dia_nombre:'Sábado',    total:14},
                {dia_nombre:'Domingo',   total:0},
            ],
            ultimos: [
                {fecha:'2026-05-17',hora:'16:32',tipo:'S',articulo:'ART001',nombre_articulo:'TORNILLO M6x20 INOX A2',        ubicacion:'A1-01-01',cantidad:50,  tercero:'FONTANEROS NORTE S.L.'},
                {fecha:'2026-05-17',hora:'14:15',tipo:'E',articulo:'ART009',nombre_articulo:'SILICONA NEUTRA 310ml',          ubicacion:'B3-01-02',cantidad:24,  tercero:'SUMINISTROS RAMOS S.L.'},
                {fecha:'2026-05-17',hora:'11:48',tipo:'S',articulo:'ART004',nombre_articulo:'TORNILLO M8x30 GALVANIZADO',     ubicacion:'A1-02-03',cantidad:30,  tercero:'CONSTRUMAT S.A.'},
                {fecha:'2026-05-16',hora:'17:05',tipo:'T',articulo:'ART005',nombre_articulo:'CLAVIJA EXPANSION 8x50',         ubicacion:'A2-01-02',cantidad:40,  tercero:'—'},
                {fecha:'2026-05-16',hora:'10:22',tipo:'E',articulo:'ART003',nombre_articulo:'ARANDELA M6 PLANA ACERO',        ubicacion:'A1-02-01',cantidad:200, tercero:'DISTRIBUIDORA CENTRAL S.A.'},
                {fecha:'2026-05-15',hora:'15:30',tipo:'R',articulo:'ART021',nombre_articulo:'VARILLA ROSCADA M12 1M',         ubicacion:'A1-01-01',cantidad:5,   tercero:'—'},
                {fecha:'2026-05-15',hora:'09:17',tipo:'S',articulo:'ART002',nombre_articulo:'TUERCA M6 HEXAGONAL INOX',       ubicacion:'A1-01-01',cantidad:100, tercero:'OBRAS GARCIA E HIJOS'},
            ],
        };
        const tipos = d.por_tipo;
        const dias  = d.por_dia_semana;

        destroy('mov-tipo');
        charts['mov-tipo'] = new Chart(get('chart-mov-tipo'), {
            type: 'doughnut',
            data: {
                labels: tipos.map(r => TIPO_LABEL[r.tipo] || r.tipo),
                datasets: [{ data: tipos.map(r => r.total),
                    backgroundColor: tipos.map(r => (TIPO_COLOR[r.tipo] || '#9ca3af') + 'cc'),
                    borderColor:     tipos.map(r => TIPO_COLOR[r.tipo] || '#9ca3af'),
                    borderWidth: 2 }],
            },
            options: { responsive: true, cutout: '55%',
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } },
        });

        destroy('mov-semana');
        charts['mov-semana'] = new Chart(get('chart-mov-semana'), {
            type: 'bar',
            data: {
                labels: dias.map(r => r.dia_nombre),
                datasets: [{ label: 'Movimientos', data: dias.map(r => r.total),
                    backgroundColor: 'rgba(37,99,192,.7)', borderColor: BLUE,
                    borderWidth: 1, borderRadius: 4 }],
            },
            options: { responsive: true, plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
        });

        document.getElementById('tabla-ultimos').innerHTML = d.ultimos.length
            ? `<div class="data-table-wrap"><table>
                <thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Artículo</th><th>Nombre</th><th>Ubicación</th><th class="num">Cantidad</th><th>Tercero</th></tr></thead>
                <tbody>${d.ultimos.map(r => `<tr>
                    <td>${r.fecha}</td><td>${r.hora ?? ''}</td>
                    <td><span class="badge" style="background:${(TIPO_COLOR[r.tipo]||'#9ca3af')}22;color:${TIPO_COLOR[r.tipo]||'#374151'}">${TIPO_LABEL[r.tipo]||r.tipo}</span></td>
                    <td><strong>${r.articulo}</strong></td><td>${trunc(r.nombre_articulo||'',28)}</td>
                    <td>${r.ubicacion??''}</td><td class="num">${r.cantidad??''}</td>
                    <td>${trunc(r.tercero||'',20)}</td>
                </tr>`).join('')}</tbody>
               </table></div>`
            : '<div class="placeholder-msg">Sin movimientos recientes.</div>';
    } catch (e) { console.error(e); }
}

// ── PROVEEDORES ───────────────────────────────────────────────────────────────
async function cargarProveedores() {
    try {
        const data = [
            {codigo:'PROV001',nombre:'SUMINISTROS RAMOS S.L.',      movimientos:28, articulos_distintos:8, unidades:1540, ultima_entrada:'2026-05-17'},
            {codigo:'PROV003',nombre:'DISTRIBUIDORA CENTRAL S.A.',  movimientos:22, articulos_distintos:6, unidades:1120, ultima_entrada:'2026-05-16'},
            {codigo:'PROV002',nombre:'HIERROS DEL NORTE S.L.',      movimientos:18, articulos_distintos:5, unidades:890,  ultima_entrada:'2026-05-14'},
            {codigo:'PROV005',nombre:'FERRETERIA MAYORISTA ABC',    movimientos:12, articulos_distintos:4, unidades:620,  ultima_entrada:'2026-05-10'},
            {codigo:'PROV004',nombre:'ACABADOS Y FIJACIONES S.A.',  movimientos:7,  articulos_distintos:3, unidades:340,  ultima_entrada:'2026-05-05'},
        ];
        if (!data.length) {
            document.getElementById('tabla-proveedores').innerHTML = '<div class="placeholder-msg">Sin actividad de proveedores en los últimos 90 días.</div>';
            return;
        }
        destroy('prov-mov');
        charts['prov-mov'] = new Chart(get('chart-prov-mov'), {
            type: 'bar',
            data: {
                labels: data.map(r => trunc(r.nombre || r.codigo, 22)),
                datasets: [
                    { label: 'Movimientos', data: data.map(r => r.movimientos),
                        backgroundColor: 'rgba(37,99,192,.7)', borderColor: BLUE, borderWidth: 1, borderRadius: 4 },
                    { label: 'Unidades',    data: data.map(r => r.unidades),
                        backgroundColor: 'rgba(5,150,105,.6)', borderColor: GREEN, borderWidth: 1, borderRadius: 4 },
                ],
            },
            options: { responsive: true,
                plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } } },
                scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                          y: { beginAtZero: true, grid: { color: '#f3f4f6' } } } },
        });

        const maxMov = Math.max(...data.map(r => r.movimientos), 1);
        document.getElementById('tabla-proveedores').innerHTML = `<div class="data-table-wrap"><table>
            <thead><tr><th>#</th><th>Código</th><th>Proveedor</th><th class="num">Entradas</th><th class="num">Artículos distintos</th><th class="num">Unidades</th><th>Actividad</th><th>Última entrada</th></tr></thead>
            <tbody>${data.map((r, i) => `<tr>
                <td><strong>#${i+1}</strong></td>
                <td>${r.codigo}</td><td>${r.nombre ?? ''}</td>
                <td class="num"><span class="badge badge-blue">${r.movimientos}</span></td>
                <td class="num">${r.articulos_distintos}</td>
                <td class="num">${fmt(r.unidades)}</td>
                <td><div class="mini-bar"><div class="mini-bar-fill" style="width:${Math.round(r.movimientos/maxMov*100)}%;background:${BLUE}"></div></div></td>
                <td>${r.ultima_entrada ?? '—'}</td>
            </tr>`).join('')}</tbody>
        </table></div>`;
    } catch (e) { console.error(e); }
}

// ── ARTÍCULOS ─────────────────────────────────────────────────────────────────
async function cargarArticulos() {
    try {
        const d = {
            rotacion: [
                {articulo:'ART001',nombre:'TORNILLO M6x20 INOX A2',       unidades_movidas:470},
                {articulo:'ART004',nombre:'TORNILLO M8x30 GALVANIZADO',    unidades_movidas:390},
                {articulo:'ART009',nombre:'SILICONA NEUTRA 310ml',         unidades_movidas:310},
                {articulo:'ART003',nombre:'ARANDELA M6 PLANA ACERO',       unidades_movidas:285},
                {articulo:'ART005',nombre:'CLAVIJA EXPANSION 8x50',        unidades_movidas:240},
                {articulo:'ART002',nombre:'TUERCA M6 HEXAGONAL INOX',      unidades_movidas:210},
                {articulo:'ART017',nombre:'GRILLETE GALVANIZADO 1/4"',     unidades_movidas:180},
                {articulo:'ART018',nombre:'MUELLE COMPRESION 10x50mm',     unidades_movidas:160},
            ],
            por_familia: [
                {familia:'Tornillería',       stock_total:755},
                {familia:'Ferretería Gral.',  stock_total:207},
                {familia:'Sellantes',         stock_total:114},
                {familia:'Fijaciones',        stock_total:95},
                {familia:'Nylon y Plástico',  stock_total:67},
                {familia:'Cables y Cadenas',  stock_total:37},
                {familia:'Herramientas',      stock_total:27},
            ],
            sin_movimiento: [
                {articulo:'ART015',nombre:'CADENA GALVANIZADA 6mm 25M', stock:4,  ultimo_mov:'2026-02-12'},
                {articulo:'ART016',nombre:'BRIDA NYLON 200x3.5mm',      stock:12, ultimo_mov:'2026-03-05'},
            ],
        };

        destroy('art-rotacion');
        charts['art-rotacion'] = new Chart(get('chart-art-rotacion'), {
            type: 'bar',
            data: {
                labels: d.rotacion.map(r => trunc(r.nombre || r.articulo, 18)),
                datasets: [{ label: 'Unidades movidas', data: d.rotacion.map(r => r.unidades_movidas),
                    backgroundColor: 'rgba(37,99,192,.7)', borderColor: BLUE, borderWidth: 1, borderRadius: 4 }],
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                          y: { grid: { display: false }, ticks: { font: { size: 10 } } } } },
        });

        const topFamilias = d.por_familia.slice(0, 8);
        destroy('art-familia');
        charts['art-familia'] = new Chart(get('chart-art-familia'), {
            type: 'doughnut',
            data: {
                labels: topFamilias.map(r => r.familia),
                datasets: [{ data: topFamilias.map(r => r.stock_total),
                    backgroundColor: PAL.slice(0, topFamilias.length).map(c => c + 'cc'),
                    borderColor: PAL.slice(0, topFamilias.length), borderWidth: 2 }],
            },
            options: { responsive: true, cutout: '50%',
                plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8 } } } },
        });

        document.getElementById('tabla-sin-mov').innerHTML = d.sin_movimiento.length
            ? `<div class="data-table-wrap"><table>
                <thead><tr><th>Artículo</th><th>Nombre</th><th class="num">Stock inmovilizado</th><th>Último movimiento</th></tr></thead>
                <tbody>${d.sin_movimiento.map(r => `<tr>
                    <td><strong>${r.articulo}</strong></td>
                    <td>${r.nombre ?? ''}</td>
                    <td class="num"><span class="badge badge-amber">${fmt(r.stock)}</span></td>
                    <td>${r.ultimo_mov}</td>
                </tr>`).join('')}</tbody>
               </table></div>`
            : '<div class="placeholder-msg">✅ Todos los artículos con stock han tenido movimiento recientemente.</div>';
    } catch (e) { console.error(e); }
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────
function fmt(n)    { return Number(n ?? 0).toLocaleString('es-ES'); }
function trunc(s, n) { s = s || ''; return s.length > n ? s.slice(0, n) + '…' : s; }
function get(id)   { return document.getElementById(id); }
function setText(id, v) { const el = get(id); if (el) el.textContent = v; }
function destroy(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

// ── ACTUALIZAR TODO ───────────────────────────────────────────────────────────
function recargarTodo() {
    Object.keys(loaded).forEach(k => delete loaded[k]);
    cargarResumen();
    const activeTab = document.querySelector('.tab-btn-inf.active')?.dataset.tab;
    if (activeTab && activeTab !== 'resumen') { cargarTab(activeTab); }
}

document.getElementById('btn-refresh').addEventListener('click', recargarTodo);
document.addEventListener('keydown', e => { if (e.key === 'F5') { e.preventDefault(); recargarTodo(); } });

// ── ARRANQUE ──────────────────────────────────────────────────────────────────
cargarResumen();
