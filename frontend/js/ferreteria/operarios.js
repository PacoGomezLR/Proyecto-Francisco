let todosOperarios = [];

async function cargarOperarios() {
    const tbody = document.getElementById('tbody-operarios');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando operarios...</td></tr>';
    try {
        todosOperarios = await SGA.operarios.list();
        renderTabla(todosOperarios);
        document.getElementById('total-operarios').textContent = todosOperarios.length;
    } catch {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Error al conectar con el servidor.</td></tr>';
    }
}

function campo(r, ...keys) {
    for (const k of keys) if (r[k] != null && r[k] !== '') return r[k];
    return '';
}

function renderTabla(rows) {
    const tbody = document.getElementById('tbody-operarios');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No se encontraron operarios.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const cod  = campo(r, 'OPECOD', 'id');
        const nom  = campo(r, 'OPENOM', 'nombre');
        const dir  = campo(r, 'OPEDIR', 'direccion');
        const tel  = campo(r, 'OPETEL', 'telefono');
        const ema  = campo(r, 'OPEEMA', 'email');
        const act  = (r.OPEACT ?? r.activo) == 1;
        return `<tr class="ope-row" data-id="${r.id ?? cod}" style="cursor:pointer">
            <td><strong>${cod}</strong></td>
            <td>${nom}</td>
            <td>${dir}</td>
            <td>${tel}</td>
            <td>${ema ? `<a href="mailto:${ema}" onclick="event.stopPropagation()">${ema}</a>` : ''}</td>
            <td><span class="badge ${act ? 'active' : 'inactive'}">${act ? 'Activo' : 'Inactivo'}</span></td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.ope-row').forEach(tr => {
        tr.addEventListener('click', () => {
            const id = tr.dataset.id;
            const r = todosOperarios.find(o => (o.id ?? campo(o, 'OPECOD')) == id);
            if (r) abrirDetalle(r);
        });
    });
}

/* ── Panel detalle ── */
function abrirDetalle(r) {
    const cod = campo(r, 'OPECOD', 'id');
    const act = (r.OPEACT ?? r.activo) == 1;
    document.getElementById('det-cod').textContent = cod;
    document.getElementById('det-nom').textContent = campo(r, 'OPENOM', 'nombre');
    document.getElementById('det-dir').textContent = campo(r, 'OPEDIR', 'direccion') || '—';
    document.getElementById('det-tel').textContent = campo(r, 'OPETEL', 'telefono')  || '—';
    const ema = campo(r, 'OPEEMA', 'email');
    const emaEl = document.getElementById('det-ema');
    emaEl.innerHTML = ema ? `<a href="mailto:${ema}">${ema}</a>` : '—';
    const actEl = document.getElementById('det-act');
    actEl.innerHTML = `<span class="badge ${act ? 'active' : 'inactive'}">${act ? 'Activo' : 'Inactivo'}</span>`;

    document.getElementById('panel-detalle').classList.add('open');
    document.getElementById('panel-backdrop').classList.add('open');
    document.querySelectorAll('.ope-row').forEach(tr => tr.classList.remove('selected'));
    document.querySelector(`.ope-row[data-id="${r.id ?? cod}"]`)?.classList.add('selected');
}

function cerrarDetalle() {
    document.getElementById('panel-detalle').classList.remove('open');
    document.getElementById('panel-backdrop').classList.remove('open');
    document.querySelectorAll('.ope-row').forEach(tr => tr.classList.remove('selected'));
}

/* ── Modal nuevo operario ── */
function abrirModal() {
    ['nw-cod','nw-nom','nw-dir','nw-tel','nw-ema'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('nw-act').value = '1';
    document.getElementById('modal-error').hidden = true;
    document.getElementById('modal-nuevo').classList.add('open');
    document.getElementById('modal-backdrop').classList.add('open');
    document.getElementById('nw-cod').focus();
}

function cerrarModal() {
    document.getElementById('modal-nuevo').classList.remove('open');
    document.getElementById('modal-backdrop').classList.remove('open');
}

async function guardarOperario() {
    const cod = document.getElementById('nw-cod').value.trim().toUpperCase();
    const nom = document.getElementById('nw-nom').value.trim();
    const errorEl = document.getElementById('modal-error');

    if (!cod || !nom) {
        errorEl.textContent = 'Código y Nombre Completo son obligatorios.';
        errorEl.hidden = false;
        return;
    }
    if (todosOperarios.some(o => (o.OPECOD || o.id) === cod)) {
        errorEl.textContent = `Ya existe un operario con código "${cod}".`;
        errorEl.hidden = false;
        return;
    }

    const nuevo = {
        id:     cod,
        OPECOD: cod,
        OPENOM: nom,
        OPEDIR: document.getElementById('nw-dir').value.trim(),
        OPETEL: document.getElementById('nw-tel').value.trim(),
        OPEEMA: document.getElementById('nw-ema').value.trim().toLowerCase(),
        OPEACT: Number(document.getElementById('nw-act').value),
    };

    const btnGuardar = document.getElementById('btn-modal-guardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    try {
        await SGA.operarios.save(nuevo);
        todosOperarios.push(nuevo);
        renderTabla(todosOperarios);
        document.getElementById('total-operarios').textContent = todosOperarios.length;
        cerrarModal();
        mostrarToast(`Operario ${cod} creado correctamente.`);
    } catch {
        errorEl.textContent = 'Error al guardar. Inténtalo de nuevo.';
        errorEl.hidden = false;
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar operario';
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
    renderTabla(todosOperarios.filter(r =>
        Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    ));
});

document.getElementById('btn-nuevo').addEventListener('click', abrirModal);
document.getElementById('btn-modal-cerrar').addEventListener('click', cerrarModal);
document.getElementById('btn-modal-cancelar').addEventListener('click', cerrarModal);
document.getElementById('btn-modal-guardar').addEventListener('click', guardarOperario);
document.getElementById('modal-backdrop').addEventListener('click', cerrarModal);

document.getElementById('btn-cerrar-panel').addEventListener('click', cerrarDetalle);
document.getElementById('panel-backdrop').addEventListener('click', cerrarDetalle);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { cerrarDetalle(); cerrarModal(); }
    if (e.key === 'Enter' && document.getElementById('modal-nuevo').classList.contains('open')) guardarOperario();
});

cargarOperarios();
