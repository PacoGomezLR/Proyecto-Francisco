let todosLosArticulos = [];

document.getElementById('btn-actualizar').addEventListener('click', aplicarFiltros);
document.addEventListener('keydown', e => { if (e.key === 'F5') { e.preventDefault(); aplicarFiltros(); } });

async function cargarDatos() {
    const btn = document.getElementById('btn-actualizar');
    btn.textContent = 'Cargando...';
    btn.disabled = true;

    try {
        todosLosArticulos = await SGA.articulosPorUbicacion.list({});
        renderTabla(todosLosArticulos);
    } catch {
        document.getElementById('tbody-apu').innerHTML =
            '<tr class="placeholder-row"><td colspan="9">Error al conectar con el servidor.</td></tr>';
    } finally {
        btn.textContent = 'Actualizar (F5)';
        btn.disabled = false;
    }
}

function aplicarFiltros() {
    if (!todosLosArticulos.length) {
        cargarDatos();
        return;
    }

    const ubi = document.getElementById('f-ubicacion').value.trim().toUpperCase();

    const filtrados = todosLosArticulos.filter(r => {
        if (ubi && !(r.ubicacion ?? '').toUpperCase().includes(ubi)) return false;
        return true;
    });

    renderTabla(filtrados);
}

cargarDatos();

function renderTabla(rows) {
    const tbody = document.getElementById('tbody-apu');
    if (!rows.length) {
        tbody.innerHTML = '<tr class="placeholder-row"><td colspan="9">No se encontraron artículos con los filtros indicados.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td class="col-check"><input type="checkbox"></td>
            <td></td>
            <td>${r.ubicacion ?? ''}</td>
            <td>${r.etiqueta ?? ''}</td>
            <td>${r.articulo ?? ''}</td>
            <td>${r.nombre ?? ''}</td>
            <td class="col-num">${r.stock_minimo ?? ''}</td>
            <td class="col-num">${r.stock_maximo ?? ''}</td>
            <td>${r.exclusiva ? 'Sí' : 'No'}</td>
        </tr>`).join('');
}
