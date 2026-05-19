const tbody = document.getElementById('tbody-ubicaciones');
const btnGenerar = document.getElementById('btn-generar');

const chkNoExistentes = document.querySelectorAll('.gu-check-label input')[0];
const chkSoloExistencias = document.querySelectorAll('.gu-check-label input')[1];

async function cargarUbicaciones() {
    tbody.innerHTML = '<tr><td colspan="4" class="gu-empty">Cargando...</td></tr>';
    try {
        const data = await SGA.ubicaciones.list({});
        renderTabla(data);
    } catch {
        tbody.innerHTML = '<tr><td colspan="4" class="gu-empty">Error al cargar ubicaciones.</td></tr>';
    }
}

function renderTabla(rows) {
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="gu-empty">Sin ubicaciones.</td></tr>';
        return;
    }
    const soloExist = chkSoloExistencias?.checked;
    tbody.innerHTML = rows
        .filter(r => !soloExist || (r.UBINUMPAL ?? r.palets ?? 0) > 0)
        .map((r, i) => `
            <tr>
                <td class="col-num">${i + 1}</td>
                <td class="col-sel"><input type="checkbox" class="cell-check"></td>
                <td>${r.UBICODUBI || r.ubicacion || r.id || ''}</td>
                <td>${r.UBIETI    || r.etiqueta  || ''}</td>
            </tr>`).join('');
}

btnGenerar.addEventListener('click', async () => {
    const desdePasillo = document.getElementById('desde-pasillo').value.trim();
    const hastaPasillo = document.getElementById('hasta-pasillo').value.trim();
    const desdeLateral = document.getElementById('desde-lateral').value.trim();
    const hastaLateral = document.getElementById('hasta-lateral').value.trim();
    const desdeX = document.getElementById('desde-x').value.trim();
    const hastaX = document.getElementById('hasta-x').value.trim();
    const desdeY = document.getElementById('desde-y').value.trim();
    const hastaY = document.getElementById('hasta-y').value.trim();
    const ancho  = document.getElementById('ancho').value;
    const alto   = document.getElementById('alto').value;
    const palets = document.getElementById('palets').value;
    const multiple = document.getElementById('multiple').checked;
    const zona   = document.getElementById('tipo-zona').value;

    const params = {
        desde_pasillo: desdePasillo || 1,
        hasta_pasillo: hastaPasillo || 1,
        desde_lateral: desdeLateral || 11,
        hasta_lateral: hastaLateral || 21,
        desde_x: desdeX || 1,
        hasta_x: hastaX || 1,
        desde_y: desdeY || 1,
        hasta_y: hastaY || 1,
        ancho, alto, palets,
        multiple: multiple ? 1 : 0,
        zona,
    };

    btnGenerar.disabled = true;
    btnGenerar.textContent = '...';
    try {
        await SGA.generarUbicaciones.generar(params);
        mostrarToast('Ubicaciones generadas correctamente.');
        cargarUbicaciones();
    } catch {
        mostrarToast('Error al generar ubicaciones.', true);
    } finally {
        btnGenerar.disabled = false;
        btnGenerar.textContent = 'OK';
    }
});

document.querySelectorAll('.gu-btn-action').forEach((btn, i) => {
    btn.addEventListener('click', () => {
        if (i === 0) {
            if (!confirm('¿Seguro que quieres eliminar todas las ubicaciones y movimientos? Esta acción no se puede deshacer.')) return;
            mostrarToast('Ubicaciones y movimientos eliminados (simulado).');
            tbody.innerHTML = '<tr><td colspan="4" class="gu-empty">Sin ubicaciones.</td></tr>';
        } else {
            mostrarToast('Picking CLIN 1995 asignado (simulado).');
        }
    });
});

chkSoloExistencias?.addEventListener('change', () => {
    SGA.ubicaciones.list({}).then(renderTabla).catch(() => {});
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

cargarUbicaciones();
