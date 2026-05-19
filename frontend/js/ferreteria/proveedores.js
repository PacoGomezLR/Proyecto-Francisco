let todosProveedores = [];

async function cargarProveedores() {
    const tbody = document.getElementById('tbody-proveedores');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando proveedores...</td></tr>';
    try {
        todosProveedores = await SGA.proveedores.list();
        renderTabla(todosProveedores);
    } catch {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Error al conectar con el servidor.</td></tr>';
    }
}

function campo(r, ...keys) {
    for (const k of keys) if (r[k] != null && r[k] !== '') return r[k];
    return '';
}

function renderTabla(rows) {
    const tbody = document.getElementById('tbody-proveedores');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No se encontraron proveedores.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const cod = campo(r, 'CLICOD', 'id');
        const raz = campo(r, 'CLIRAZ', 'razon_social', 'nombre');
        const dir = campo(r, 'CLIDIR', 'direccion');
        const ciu = campo(r, 'CLIPOSCIU', 'localidad');
        const con = campo(r, 'CLIPERCON', 'contacto');
        const ema = campo(r, 'CLIEMA', 'email');
        const tel = campo(r, 'CLITEL', 'telefono');
        return `<tr class="prov-row" data-id="${r.id ?? cod}" style="cursor:pointer">
            <td><strong>${cod}</strong></td>
            <td>${raz}</td>
            <td>${dir}${ciu ? ', ' + ciu : ''}</td>
            <td>${con}</td>
            <td>${ema ? `<a href="mailto:${ema}" onclick="event.stopPropagation()">${ema}</a>` : ''}</td>
            <td>${tel}</td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.prov-row').forEach(tr => {
        tr.addEventListener('click', () => {
            const id = tr.dataset.id;
            const r = todosProveedores.find(p => (p.id ?? campo(p, 'CLICOD')) == id);
            if (r) abrirDetalle(r);
        });
    });
}

/* ── Panel detalle ── */
function abrirDetalle(r) {
    const cod = campo(r, 'CLICOD', 'id');
    document.getElementById('det-cod').textContent = cod;
    document.getElementById('det-raz').textContent = campo(r, 'CLIRAZ', 'razon_social', 'nombre');
    document.getElementById('det-nom').textContent = campo(r, 'CLINOM', 'nombre_corto') || '—';
    document.getElementById('det-nif').textContent = campo(r, 'CLINIF', 'cif', 'nif')   || '—';
    document.getElementById('det-dir').textContent = campo(r, 'CLIDIR', 'direccion')    || '—';
    document.getElementById('det-ciu').textContent = campo(r, 'CLIPOSCIU', 'localidad') || '—';
    document.getElementById('det-tel').textContent = campo(r, 'CLITEL', 'telefono')     || '—';
    document.getElementById('det-con').textContent = campo(r, 'CLIPERCON', 'contacto')  || '—';
    const ema = campo(r, 'CLIEMA', 'email');
    const emaEl = document.getElementById('det-ema');
    emaEl.innerHTML = ema ? `<a href="mailto:${ema}">${ema}</a>` : '—';

    document.getElementById('panel-detalle').classList.add('open');
    document.getElementById('panel-backdrop').classList.add('open');
    document.querySelectorAll('.prov-row').forEach(tr => tr.classList.remove('selected'));
    document.querySelector(`.prov-row[data-id="${r.id ?? cod}"]`)?.classList.add('selected');
}

function cerrarDetalle() {
    document.getElementById('panel-detalle').classList.remove('open');
    document.getElementById('panel-backdrop').classList.remove('open');
    document.querySelectorAll('.prov-row').forEach(tr => tr.classList.remove('selected'));
}

/* ── Modal nuevo proveedor ── */
function abrirModal() {
    ['nw-cod','nw-raz','nw-dir','nw-con','nw-tel','nw-ema']
        .forEach(id => document.getElementById(id).value = '');
    document.getElementById('modal-error').hidden = true;
    document.getElementById('modal-nuevo').classList.add('open');
    document.getElementById('modal-backdrop').classList.add('open');
    document.getElementById('nw-cod').focus();
}

function cerrarModal() {
    document.getElementById('modal-nuevo').classList.remove('open');
    document.getElementById('modal-backdrop').classList.remove('open');
}

async function guardarProveedor() {
    const cod = document.getElementById('nw-cod').value.trim().toUpperCase();
    const raz = document.getElementById('nw-raz').value.trim().toUpperCase();
    const errorEl = document.getElementById('modal-error');

    if (!cod || !raz) {
        errorEl.textContent = 'Código y Razón Social son obligatorios.';
        errorEl.hidden = false;
        return;
    }
    if (todosProveedores.some(p => (p.CLICOD || p.id) === cod)) {
        errorEl.textContent = `Ya existe un proveedor con código "${cod}".`;
        errorEl.hidden = false;
        return;
    }

    const nuevo = {
        id:        cod,
        CLICOD:    cod,
        CLIRAZ:    raz,
        CLIDIR:    document.getElementById('nw-dir').value.trim(),
        CLIPERCON: document.getElementById('nw-con').value.trim(),
        CLITEL:    document.getElementById('nw-tel').value.trim(),
        CLIEMA:    document.getElementById('nw-ema').value.trim().toLowerCase(),
    };

    const btnGuardar = document.getElementById('btn-modal-guardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    try {
        await SGA.proveedores.save(nuevo);
        todosProveedores.push(nuevo);
        renderTabla(todosProveedores);
        cerrarModal();
        mostrarToast(`Proveedor ${cod} creado correctamente.`);
    } catch {
        errorEl.textContent = 'Error al guardar. Inténtalo de nuevo.';
        errorEl.hidden = false;
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar proveedor';
    }
}

function mostrarToast(msg, esError = false) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '24px', right: '24px',
        background: esError ? '#dc2626' : '#16a34a',
        color: '#fff', padding: '10px 18px', borderRadius: '8px',
        fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.2)',
        transition: 'opacity .3s',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

/* ── Eventos ── */
document.getElementById('buscador').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    renderTabla(todosProveedores.filter(r =>
        Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    ));
});

document.getElementById('btn-nuevo').addEventListener('click', abrirModal);
document.getElementById('btn-modal-cerrar').addEventListener('click', cerrarModal);
document.getElementById('btn-modal-cancelar').addEventListener('click', cerrarModal);
document.getElementById('btn-modal-guardar').addEventListener('click', guardarProveedor);
document.getElementById('modal-backdrop').addEventListener('click', cerrarModal);

document.getElementById('btn-cerrar-panel').addEventListener('click', cerrarDetalle);
document.getElementById('panel-backdrop').addEventListener('click', cerrarDetalle);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { cerrarDetalle(); cerrarModal(); }
    if (e.key === 'Enter' && document.getElementById('modal-nuevo').classList.contains('open')) guardarProveedor();
});

cargarProveedores();
