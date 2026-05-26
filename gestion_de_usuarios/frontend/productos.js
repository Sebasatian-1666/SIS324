// ── productos.js – Sprint 2 (HU-01, HU-02, HU-03) ──────────────────────
// Este archivo se carga DESPUÉS de app.js para tener acceso a
// usuarioActual, API_PRODUCTOS y mostrarMsg()

let catalogoCache = [];
let productoARechazar = null;

// ══════════════════════════════════════════════════════════════════════════
// HU-01 + HU-02: Guardar producto (crear o editar)
// ══════════════════════════════════════════════════════════════════════════
async function guardarProducto() {
    const editId = document.getElementById('prodEditId').value;
    const body = {
        titulo:      document.getElementById('prodTitulo').value.trim(),
        descripcion: document.getElementById('prodDesc').value.trim(),
        precio:      parseFloat(document.getElementById('prodPrecio').value),
        categoria:   document.getElementById('prodCategoria').value,
        tipo:        document.getElementById('prodTipo').value,
        ofertanteId: usuarioActual ? usuarioActual.id : 1
    };

    // Validaciones básicas
    if (!body.titulo || body.titulo.length < 3) {
        return mostrarMsg('msgProducto', '❌ El título debe tener al menos 3 caracteres', 'err');
    }
    if (!body.descripcion || body.descripcion.length < 10) {
        return mostrarMsg('msgProducto', '❌ La descripción debe tener al menos 10 caracteres', 'err');
    }
    if (!body.precio || body.precio <= 0) {
        return mostrarMsg('msgProducto', '❌ El precio debe ser mayor a 0', 'err');
    }
    if (!body.categoria) {
        return mostrarMsg('msgProducto', '❌ Selecciona una categoría', 'err');
    }

    try {
        let res;
        if (editId) {
            // HU-02: Editar (PUT)
            body.id = parseInt(editId);
            res = await fetch(API_PRODUCTOS, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            // HU-01: Crear (POST) → estado siempre PENDIENTE
            res = await fetch(API_PRODUCTOS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }

        const data = await res.json();
        if (res.ok) {
            mostrarMsg('msgProducto', '✅ ' + data.mensaje, 'ok');
            cancelarEdicion();
            cargarMisProductos();
        } else {
            mostrarMsg('msgProducto', '❌ ' + data.mensaje, 'err');
        }
    } catch (e) {
        mostrarMsg('msgProducto', '❌ Backend no disponible: ' + e.message, 'err');
    }
}

// ══════════════════════════════════════════════════════════════════════════
// HU-02: Cargar mis productos (por ofertanteId)
// ══════════════════════════════════════════════════════════════════════════
async function cargarMisProductos() {
    const ofId = usuarioActual ? usuarioActual.id : 1;
    const cont = document.getElementById('listaOfertante');
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';

    try {
        const res  = await fetch(`${API_PRODUCTOS}?ofertanteId=${ofId}`);
        const list = await res.json();

        if (list.length === 0) {
            cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No tienes productos registrados aún.</p>';
            return;
        }
        cont.innerHTML = list.map(prodCardOfertante).join('');
    } catch (e) {
        cont.innerHTML = `<p style="color:var(--danger);font-size:.88rem">Error: ${e.message}</p>`;
    }
}

function prodCardOfertante(p) {
    const data = JSON.stringify(p).replace(/"/g, '&quot;');
    return `
    <div class="prod-card ${p.estado}">
        <div class="prod-titulo">${p.titulo}</div>
        <div>${badgeEstado(p.estado)}</div>
        <div class="prod-desc">${p.descripcion}</div>
        <div class="prod-meta">
            <span class="prod-precio">$${parseFloat(p.precio).toFixed(2)}</span>
            <span class="badge b-info">${p.categoria}</span>
        </div>
        ${p.motivoRechazo ? `<div class="motivo">🚫 ${p.motivoRechazo}</div>` : ''}
        <div class="prod-actions">
            <button class="btn-warning btn-sm" onclick='cargarEdicion(${data})'>✏️ Editar</button>
            <button class="btn-danger  btn-sm" onclick="eliminarProducto(${p.id})">🗑️ Eliminar</button>
        </div>
    </div>`;
}

function cargarEdicion(p) {
    document.getElementById('prodEditId').value   = p.id;
    document.getElementById('prodTitulo').value   = p.titulo;
    document.getElementById('prodDesc').value     = p.descripcion;
    document.getElementById('prodPrecio').value   = p.precio;
    document.getElementById('prodCategoria').value= p.categoria;
    document.getElementById('prodTipo').value     = p.tipo || 'PRODUCTO';
    document.getElementById('prodFormTitulo').innerHTML =
        `✏️ Editando: "${p.titulo}" <span class="badge b-info">HU-02</span>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
    document.getElementById('prodEditId').value = '';
    ['prodTitulo','prodDesc','prodPrecio'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('prodCategoria').value = '';
    document.getElementById('prodTipo').value = 'PRODUCTO';
    document.getElementById('prodFormTitulo').innerHTML =
        '➕ Registrar Producto/Servicio <span class="badge b-pending">HU-01</span>';
}

async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        const res = await fetch(`${API_PRODUCTOS}?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        mostrarMsg('msgProducto', res.ok ? '✅ ' + data.mensaje : '❌ ' + data.mensaje,
                   res.ok ? 'ok' : 'err');
        cargarMisProductos();
    } catch (e) {
        mostrarMsg('msgProducto', '❌ Error al eliminar', 'err');
    }
}

// ══════════════════════════════════════════════════════════════════════════
// HU-03: Panel Admin – listar pendientes + aprobar/rechazar
// ══════════════════════════════════════════════════════════════════════════
async function cargarAdmin() {
    const cont = document.getElementById('listaAdmin');
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';

    try {
        // Cargamos todos para las estadísticas
        const [todos, pendientes] = await Promise.all([
            fetch(API_PRODUCTOS).then(r => r.json()),
            fetch(`${API_PRODUCTOS}?estado=PENDIENTE`).then(r => r.json())
        ]);

        // Stats
        document.getElementById('cntPend').textContent = todos.filter(p => p.estado === 'PENDIENTE').length;
        document.getElementById('cntApr').textContent  = todos.filter(p => p.estado === 'APROBADO').length;
        document.getElementById('cntRech').textContent = todos.filter(p => p.estado === 'RECHAZADO').length;

        if (pendientes.length === 0) {
            cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">✅ No hay productos pendientes de revisión.</p>';
            return;
        }
        cont.innerHTML = pendientes.map(prodCardAdmin).join('');
    } catch (e) {
        cont.innerHTML = `<p style="color:var(--danger);font-size:.88rem">Error: ${e.message}</p>`;
    }
}

function prodCardAdmin(p) {
    return `
    <div class="prod-card ${p.estado}">
        <div class="prod-titulo">${p.titulo}</div>
        <div class="prod-desc">${p.descripcion}</div>
        <div class="prod-meta">
            <span class="prod-precio">$${parseFloat(p.precio).toFixed(2)}</span>
            <span class="badge b-info">${p.categoria}</span>
        </div>
        <div style="font-size:.78rem;color:var(--muted)">👤 ${p.ofertanteNombre}</div>
        <div class="prod-actions">
            <button class="btn-success btn-sm" onclick="aprobar(${p.id})">✅ Aprobar</button>
            <button class="btn-danger  btn-sm" onclick="abrirModalRechazo(${p.id})">❌ Rechazar</button>
        </div>
    </div>`;
}

async function aprobar(id) {
    try {
        const res = await fetch(API_PRODUCTOS, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, decision: 'APROBADO' })
        });
        const data = await res.json();
        alert('✅ ' + data.mensaje);
        cargarAdmin();
    } catch (e) { alert('Error: ' + e.message); }
}

function abrirModalRechazo(id) {
    productoARechazar = id;
    document.getElementById('motivoTexto').value = '';
    document.getElementById('overlay').classList.add('open');
}

async function confirmarRechazo() {
    const motivo = document.getElementById('motivoTexto').value.trim();
    if (!motivo) { alert('Debes escribir el motivo del rechazo.'); return; }

    try {
        const res = await fetch(API_PRODUCTOS, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productoARechazar, decision: 'RECHAZADO', motivoRechazo: motivo })
        });
        const data = await res.json();
        alert(res.ok ? '✅ ' + data.mensaje : '❌ ' + data.mensaje);
        cerrarModal();
        cargarAdmin();
    } catch (e) { alert('Error: ' + e.message); }
}

function cerrarModal() {
    document.getElementById('overlay').classList.remove('open');
    productoARechazar = null;
}

// ══════════════════════════════════════════════════════════════════════════
// Catálogo público (solo APROBADOS)
// ══════════════════════════════════════════════════════════════════════════
async function cargarCatalogo() {
    const cont = document.getElementById('listaCatalogo');
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';
    try {
        catalogoCache = await fetch(`${API_PRODUCTOS}?estado=APROBADO`).then(r => r.json());
        filtrarCatalogo();
    } catch (e) {
        cont.innerHTML = `<p style="color:var(--danger);font-size:.88rem">Error: ${e.message}</p>`;
    }
}

function filtrarCatalogo() {
    const txt = document.getElementById('buscar').value.toLowerCase();
    const cat = document.getElementById('filtroCat').value;
    const filtrados = catalogoCache.filter(p =>
        (p.titulo.toLowerCase().includes(txt) || p.descripcion.toLowerCase().includes(txt)) &&
        (!cat || p.categoria === cat)
    );
    const cont = document.getElementById('listaCatalogo');
    if (filtrados.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No se encontraron productos.</p>';
        return;
    }
    cont.innerHTML = filtrados.map(p => `
        <div class="prod-card APROBADO">
            <div class="prod-titulo">${p.titulo}</div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                <span class="badge b-info">${p.categoria}</span>
                ${p.tipo ? `<span class="badge" style="background:#e9d8fd;color:#553c9a">${p.tipo}</span>` : ''}
            </div>
            <div class="prod-desc">${p.descripcion}</div>
            <div class="prod-meta">
                <span class="prod-precio">$${parseFloat(p.precio).toFixed(2)}</span>
                <span style="font-size:.78rem;color:var(--muted)">👤 ${p.ofertanteNombre}</span>
            </div>
        </div>`).join('');
}

// ── Helper: badge de estado ───────────────────────────────────────────────
function badgeEstado(estado) {
    const m = { PENDIENTE: 'b-pending', APROBADO: 'b-approved', RECHAZADO: 'b-rejected' };
    const i = { PENDIENTE: '⏳', APROBADO: '✅', RECHAZADO: '❌' };
    return `<span class="badge ${m[estado]}">${i[estado]} ${estado}</span>`;
}
