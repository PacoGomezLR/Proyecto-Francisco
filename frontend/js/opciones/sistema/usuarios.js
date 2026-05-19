let todosUsuarios = [];
let usuarioActivo = null;
let modoNuevo = false;

const TIPOS  = { 1: 'Operario', 2: 'Supervisor', 3: 'Administrador' };
const NIVELES = { 1: 'Básico', 2: 'Medio', 3: 'Avanzado', 4: 'Total' };

function campo(r, ...keys) {
    for (const k of keys) if (r[k] != null && r[k] !== '') return r[k];
    return '';
}

async function cargarUsuarios() {
    try {
        todosUsuarios = await SGA.usuarios.list();
        renderTabla(todosUsuarios);
        if (todosUsuarios.length) seleccionar(todosUsuarios[0]);
    } catch {
        document.getElementById('tbody-usuarios').innerHTML =
            '<tr class="placeholder-row"><td colspan="4">Error al conectar con el servidor.</td></tr>';
    }
}

function renderTabla(rows) {
    const tbody = document.getElementById('tbody-usuarios');
    if (!rows.length) {
        tbody.innerHTML = '<tr class="placeholder-row"><td colspan="4">No se encontraron usuarios.</td></tr>';
        limpiarPanel();
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const cod  = campo(r, 'USUCOD', 'codigo', 'id');
        const nom  = campo(r, 'USUNOM', 'nombre');
        const tip  = campo(r, 'USUTIP', 'tipo');
        const niv  = campo(r, 'USUNIV', 'nivel');
        const activo = usuarioActivo && campo(usuarioActivo, 'USUCOD', 'id') === cod;
        return `<tr class="${activo ? 'selected' : ''}" data-id="${r.id ?? cod}" style="cursor:pointer">
            <td><strong>${cod}</strong></td>
            <td>${nom}</td>
            <td>${TIPOS[tip]  ?? tip}</td>
            <td>${NIVELES[niv] ?? niv}</td>
        </tr>`;
    }).join('');

    document.querySelectorAll('#tbody-usuarios tr[data-id]').forEach(tr => {
        tr.addEventListener('click', () => {
            const id = tr.dataset.id;
            const r = todosUsuarios.find(u => (u.id ?? campo(u,'USUCOD')) == id);
            if (r) seleccionar(r);
        });
    });
}

function seleccionar(r) {
    modoNuevo = false;
    usuarioActivo = r;
    document.getElementById('panel-titulo').textContent = 'Datos del usuario';
    document.getElementById('usu-codigo').value = campo(r, 'USUCOD', 'codigo', 'id');
    document.getElementById('usu-codigo').disabled = true;
    document.getElementById('usu-nombre').value = campo(r, 'USUNOM', 'nombre');
    document.getElementById('usu-tipo').value   = campo(r, 'USUTIP', 'tipo') || '1';
    document.getElementById('usu-nivel').value  = campo(r, 'USUNIV', 'nivel') || '1';
    document.getElementById('usu-password').value = '';
    document.getElementById('form-error').hidden = true;
    renderTabla(todosUsuarios);
}

function limpiarPanel() {
    ['usu-codigo','usu-nombre','usu-password'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('usu-tipo').value  = '1';
    document.getElementById('usu-nivel').value = '1';
    document.getElementById('form-error').hidden = true;
}

document.getElementById('btn-nuevo').addEventListener('click', () => {
    modoNuevo = true;
    usuarioActivo = null;
    document.getElementById('panel-titulo').textContent = 'Nuevo usuario';
    document.getElementById('usu-codigo').disabled = false;
    limpiarPanel();
    document.getElementById('usu-codigo').focus();
    renderTabla(todosUsuarios);
});

document.getElementById('btn-guardar').addEventListener('click', async () => {
    const cod = document.getElementById('usu-codigo').value.trim().toUpperCase();
    const nom = document.getElementById('usu-nombre').value.trim().toUpperCase();
    const tip = Number(document.getElementById('usu-tipo').value);
    const niv = Number(document.getElementById('usu-nivel').value);
    const pwd = document.getElementById('usu-password').value.trim();
    const errorEl = document.getElementById('form-error');

    if (!cod || !nom) {
        errorEl.textContent = 'Código y nombre son obligatorios.';
        errorEl.hidden = false;
        return;
    }
    if (modoNuevo && todosUsuarios.some(u => (u.USUCOD || u.id) === cod)) {
        errorEl.textContent = `Ya existe un usuario con código "${cod}".`;
        errorEl.hidden = false;
        return;
    }

    const data = { id: cod, USUCOD: cod, USUNOM: nom, USUTIP: tip, USUNIV: niv };
    if (pwd) data.USUPWD = pwd;

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
        await SGA.usuarios.save(data);
        if (modoNuevo) {
            todosUsuarios.push(data);
        } else {
            const idx = todosUsuarios.findIndex(u => (u.USUCOD || u.id) === cod);
            if (idx >= 0) todosUsuarios[idx] = { ...todosUsuarios[idx], ...data };
        }
        usuarioActivo = data;
        modoNuevo = false;
        document.getElementById('usu-codigo').disabled = true;
        document.getElementById('panel-titulo').textContent = 'Datos del usuario';
        renderTabla(todosUsuarios);
        mostrarToast(modoNuevo ? `Usuario ${cod} creado.` : `Usuario ${cod} guardado.`);
        errorEl.hidden = true;
    } catch {
        errorEl.textContent = 'Error al guardar. Inténtalo de nuevo.';
        errorEl.hidden = false;
    } finally {
        btn.disabled = false; btn.textContent = 'Guardar';
    }
});

document.getElementById('buscador').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    renderTabla(todosUsuarios.filter(r =>
        Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    ));
});

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

cargarUsuarios();
