let todasLasUbicaciones = [];

document.addEventListener('keydown', e => { if (e.key === 'F5') { e.preventDefault(); cargarDatos(); } });
document.getElementById('btn-actualizar').addEventListener('click', aplicarFiltros);
document.getElementById('f-ubicacion').addEventListener('keydown', e => { if (e.key === 'Enter') aplicarFiltros(); });

document.getElementById('btn-exportar').addEventListener('click', () => {
    const rows = [...document.querySelectorAll('#tabla-ubicaciones tbody tr')];
    const headers = [...document.querySelectorAll('#tabla-ubicaciones thead th')].map(th => th.textContent).join(';');
    const csv = [headers, ...rows.map(tr => [...tr.querySelectorAll('td')].map(td => {
        const input = td.querySelector('input[type="text"], input[type="number"]');
        const check = td.querySelector('input[type="checkbox"]');
        if (input) return input.value;
        if (check) return check.checked ? 'Sí' : 'No';
        return td.textContent;
    }).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `ubicaciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
});

async function cargarDatos() {
    try {
        todasLasUbicaciones = await SGA.ubicaciones.list({});
        renderTabla(todasLasUbicaciones);
    } catch {
        console.error('Error al cargar ubicaciones');
    }
}

function aplicarFiltros() {
    const q = document.getElementById('f-ubicacion').value.trim().toUpperCase();
    const filtradas = todasLasUbicaciones.filter(r => {
        if (!q) return true;
        const cod  = (r.UBICODUBI || r.ubicacion || r.id || '').toUpperCase();
        const nom  = (r.UBINOM    || r.nombre    || '').toUpperCase();
        const eti  = (r.UBIETI    || r.etiqueta  || '').toUpperCase();
        return cod.includes(q) || nom.includes(q) || eti.includes(q);
    });
    renderTabla(filtradas);
}

function renderTabla(rows) {
    const tbody = document.getElementById('tbody-ubicaciones');
    if (!rows.length) {
        tbody.innerHTML = filaVacia(1);
        return;
    }
    tbody.innerHTML = rows.map((r, i) => `
        <tr class="edit-row" data-id="${r.id ?? ''}">
            <td class="col-contador">${i + 1}</td>
            <td class="col-check"><input type="checkbox" class="cell-check"></td>
            <td><input type="text" class="cell-input" value="${r.UBICODUBI || r.ubicacion || ''}"></td>
            <td><input type="text" class="cell-input" value="${r.UBIETI    || r.etiqueta  || ''}"></td>
            <td><input type="text" class="cell-input cell-wide" value="${r.UBINOM || r.descripcion || ''}"></td>
            <td><input type="number" class="cell-input cell-num" value="${r.UBIANC ?? r.ancho ?? 0}"></td>
            <td><input type="number" class="cell-input cell-num" value="${r.UBIALT ?? r.alto  ?? 0}"></td>
            <td><input type="number" class="cell-input cell-num" value="${r.UBINUMPAL ?? r.palets ?? 0}"></td>
            <td class="col-check"><input type="checkbox" class="cell-check" ${r.picking  ? 'checked' : ''}></td>
            <td class="col-check"><input type="checkbox" class="cell-check" ${(r.UBIMUL  || r.multiple)  ? 'checked' : ''}></td>
            <td><input type="text" class="cell-input" value="${r.UBIALMCOD || r.ubicacion_tipo || ''}"></td>
            <td class="col-check"><input type="checkbox" class="cell-check" ${r.exclusiva ? 'checked' : ''}></td>
            <td class="col-check"><input type="checkbox" class="cell-check" ${(r.UBINOAVIINV || r.no_av_inv) ? 'checked' : ''}></td>
            <td><input type="text" class="cell-input" value="${r.UBICON || r.articulo || ''}"></td>
        </tr>`).join('');
}

function filaVacia(n) {
    return `<tr class="edit-row" data-id="new-${n}">
        <td class="col-contador">${n}</td>
        <td class="col-check"><input type="checkbox" class="cell-check"></td>
        <td><input type="text" class="cell-input" placeholder="Ubicación"></td>
        <td><input type="text" class="cell-input" placeholder="Etiqueta"></td>
        <td><input type="text" class="cell-input cell-wide" placeholder="Descripción"></td>
        <td><input type="number" class="cell-input cell-num" value="0"></td>
        <td><input type="number" class="cell-input cell-num" value="0"></td>
        <td><input type="number" class="cell-input cell-num" value="0"></td>
        <td class="col-check"><input type="checkbox" class="cell-check"></td>
        <td class="col-check"><input type="checkbox" class="cell-check"></td>
        <td><input type="text" class="cell-input"></td>
        <td class="col-check"><input type="checkbox" class="cell-check"></td>
        <td class="col-check"><input type="checkbox" class="cell-check"></td>
        <td><input type="text" class="cell-input"></td>
    </tr>`;
}

cargarDatos();
