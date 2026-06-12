// ── productos.js – conectado al backend real ──────────────────────────────
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
        ofertanteId: usuarioActual ? usuarioActual.id : 0,
        ofertanteNombre: usuarioActual ? usuarioActual.nombre : ''
    };

    if (!body.titulo || body.titulo.length < 3)
        return mostrarMsg('msgProducto', '❌ El título debe tener al menos 3 caracteres', 'err');
    if (!body.descripcion || body.descripcion.length < 10)
        return mostrarMsg('msgProducto', '❌ La descripción debe tener al menos 10 caracteres', 'err');
    if (!body.precio || body.precio <= 0)
        return mostrarMsg('msgProducto', '❌ El precio debe ser mayor a 0', 'err');
    if (!body.categoria)
        return mostrarMsg('msgProducto', '❌ Selecciona una categoría', 'err');

    try {
        let res;
        if (editId) {
            body.id = parseInt(editId);
            body.estado = 'PENDIENTE';
            res = await fetch(API + '/api/productos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            mostrarMsg('msgProducto', '✅ Producto actualizado (pendiente de aprobación)', 'ok');
        } else {
            res = await fetch(API + '/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            mostrarMsg('msgProducto', '✅ Producto registrado. Pendiente de aprobación.', 'ok');
        }
        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            return mostrarMsg('msgProducto', '❌ Error: ' + (d.error || res.status), 'err');
        }
        cancelarEdicion();
        cargarMisProductos();
    } catch (e) {
        mostrarMsg('msgProducto', '❌ No se pudo conectar con el servidor', 'err');
    }
}

// ══════════════════════════════════════════════════════════════════════════
// HU-02: Mis productos (ofertante)
// ══════════════════════════════════════════════════════════════════════════
async function cargarMisProductos() {
    const cont = document.getElementById('listaOfertante');
    if (!cont) return;
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';
    try {
        const res = await fetch(API + '/api/productos?ofertanteId=' + usuarioActual.id);
        const ct  = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No tienes productos registrados aún.</p>';
            return;
        }
        const list = await res.json();
        cont.innerHTML = list.length === 0
            ? '<p style="color:var(--muted);font-size:.88rem">No tienes productos registrados aún.</p>'
            : list.map(prodCardOfertante).join('');
    } catch (e) {
        cont.innerHTML = '<p style="color:var(--danger);font-size:.88rem">Error al cargar productos.</p>';
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
    document.getElementById('prodEditId').value    = p.id;
    document.getElementById('prodTitulo').value    = p.titulo;
    document.getElementById('prodDesc').value      = p.descripcion;
    document.getElementById('prodPrecio').value    = p.precio;
    document.getElementById('prodCategoria').value = p.categoria;
    document.getElementById('prodTipo').value      = p.tipo || 'PRODUCTO';
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
        const res = await fetch(API + '/api/productos?id=' + id, { method: 'DELETE' });
        mostrarMsg('msgProducto', res.ok ? '✅ Eliminado correctamente' : '❌ Error al eliminar', res.ok ? 'ok' : 'err');
        cargarMisProductos();
    } catch (e) {
        mostrarMsg('msgProducto', '❌ Error de conexión', 'err');
    }
}

// ══════════════════════════════════════════════════════════════════════════
// HU-03: Panel Admin
// ══════════════════════════════════════════════════════════════════════════
async function cargarAdmin() {
    const cont = document.getElementById('listaAdmin');
    if (!cont) return;
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';
    try {
        const [resPend, resAll] = await Promise.all([
            fetch(API + '/api/productos?estado=PENDIENTE'),
            fetch(API + '/api/productos?orden=recientes')
        ]);
        const pendientes = resPend.headers.get('content-type')?.includes('json') ? await resPend.json() : [];
        const todos      = resAll.headers.get('content-type')?.includes('json')  ? await resAll.json()  : [];

        if (document.getElementById('cntPend'))  document.getElementById('cntPend').textContent  = pendientes.length;
        if (document.getElementById('cntApr'))   document.getElementById('cntApr').textContent   = todos.filter(p => p.estado === 'APROBADO').length;
        if (document.getElementById('cntRech'))  document.getElementById('cntRech').textContent  = todos.filter(p => p.estado === 'RECHAZADO').length;

        // Cargar TODOS los pendientes (incluyendo los que el filtro de aprobados no devuelve)
        const resTodos = await fetch(API + '/api/productos?estado=PENDIENTE');
        const listaPend = resTodos.headers.get('content-type')?.includes('json') ? await resTodos.json() : [];

        cont.innerHTML = listaPend.length === 0
            ? '<p style="color:var(--muted);font-size:.88rem">✅ No hay productos pendientes de revisión.</p>'
            : listaPend.map(prodCardAdmin).join('');
    } catch (e) {
        cont.innerHTML = '<p style="color:var(--danger)">Error al cargar panel admin.</p>';
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
        <div style="font-size:.78rem;color:var(--muted)">👤 ${p.ofertanteNombre || 'Ofertante'}</div>
        <div class="prod-actions">
            <button class="btn-success btn-sm" onclick="aprobar(${p.id})">✅ Aprobar</button>
            <button class="btn-danger  btn-sm" onclick="abrirModalRechazo(${p.id})">❌ Rechazar</button>
        </div>
    </div>`;
}

async function aprobar(id) {
    try {
        const res = await fetch(API + '/api/productos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, decision: 'APROBADO' })
        });
        if (res.ok) { alert('✅ Producto aprobado.'); cargarAdmin(); }
        else alert('❌ Error al aprobar.');
    } catch (e) { alert('❌ Error de conexión.'); }
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
        const res = await fetch(API + '/api/productos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productoARechazar, decision: 'RECHAZADO', motivoRechazo: motivo })
        });
        if (res.ok) { alert('❌ Producto rechazado.'); cerrarModal(); cargarAdmin(); }
        else alert('❌ Error al rechazar.');
    } catch (e) { alert('❌ Error de conexión.'); }
}

function cerrarModal() {
    document.getElementById('overlay').classList.remove('open');
    productoARechazar = null;
}

// ══════════════════════════════════════════════════════════════════════════
// Catálogo (solo APROBADOS)
// ══════════════════════════════════════════════════════════════════════════
async function cargarCatalogo() {
    const cont = document.getElementById('listaCatalogo');
    if (!cont) return;
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';
    try {
        const orden = document.getElementById('ordenarCat')?.value || 'recientes';
        const res = await fetch(API + '/api/productos?orden=' + orden);
        const ct  = res.headers.get('content-type') || '';
        catalogoCache = ct.includes('json') ? await res.json() : [];
        filtrarCatalogo();
    } catch (e) {
        cont.innerHTML = '<p style="color:var(--danger)">Error al cargar catálogo.</p>';
    }
}

function filtrarCatalogo() {
    const txt   = document.getElementById('buscar')?.value.toLowerCase() || '';
    const cat   = document.getElementById('filtroCat')?.value || '';
    const orden = document.getElementById('ordenarCat')?.value || 'recientes';

    let filtrados = catalogoCache.filter(p =>
        (p.titulo.toLowerCase().includes(txt) || p.descripcion.toLowerCase().includes(txt)) &&
        (!cat || p.categoria === cat)
    );

    if (orden === 'recientes') filtrados.sort((a,b) => b.id - a.id);
    else if (orden === 'calificados') filtrados.sort((a,b) => (b.calificacion||0) - (a.calificacion||0));
    else if (orden === 'utilizados') filtrados.sort((a,b) => (b.contadorSolicitudes||0) - (a.contadorSolicitudes||0));

    const cont = document.getElementById('listaCatalogo');
    if (!cont) return;
    if (filtrados.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No se encontraron productos.</p>';
        return;
    }
    cont.innerHTML = filtrados.map(p => `
        <div class="prod-card APROBADO">
            <div class="prod-titulo">${p.titulo}</div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                <span class="badge b-info">${p.categoria}</span>
                ${p.calificacion > 0 ? `<span class="badge" style="background:#fef3c7;color:#92400e">⭐ ${parseFloat(p.calificacion).toFixed(1)}/10</span>` : ''}
            </div>
            <div class="prod-desc">${p.descripcion}</div>
            <div class="prod-meta">
                <span class="prod-precio">$${parseFloat(p.precio).toFixed(2)}</span>
                <span style="font-size:.78rem;color:var(--muted)">👤 ${p.ofertanteNombre || 'Anónimo'}</span>
            </div>
            <div class="prod-actions" style="margin-top:10px;flex-direction:column;gap:6px">
                <button class="btn-success btn-sm" style="width:100%"
                    onclick="abrirModalSolicitud(${p.id}, '${p.titulo.replace(/'/g,"\\'")}')">
                    📩 Solicitar
                </button>
                <button class="btn-warning btn-sm" style="width:100%"
                    onclick="abrirModalCalificacion(${p.id}, '${p.titulo.replace(/'/g,"\\'")}')">
                    ⭐ Calificar
                </button>
                <button class="btn-muted btn-sm" style="width:100%"
                    onclick="verCalificaciones(${p.id}, '${p.titulo.replace(/'/g,"\\'")}')">
                    💬 Ver reseñas
                </button>
            </div>
        </div>`).join('');
}

function badgeEstado(estado) {
    const m = { PENDIENTE:'b-pending', APROBADO:'b-approved', RECHAZADO:'b-rejected' };
    const i = { PENDIENTE:'⏳', APROBADO:'✅', RECHAZADO:'❌' };
    return `<span class="badge ${m[estado]}">${i[estado]} ${estado}</span>`;
}

// ══════════════════════════════════════════════════════════════════════════
// Solicitudes
// ══════════════════════════════════════════════════════════════════════════
let productoASolicitar = null;

function abrirModalSolicitud(id, titulo) {
    productoASolicitar = id;
    const notas = prompt(`Solicitar: "${titulo}"\n\nEscribe los detalles de tu requerimiento:`);
    if (notas === null) return;
    if (notas.trim().length < 5) { alert('❌ Describe tu necesidad con más detalle.'); return; }
    enviarSolicitud(notas.trim());
}

async function enviarSolicitud(notas) {
    try {
        const res = await fetch(API + '/api/solicitudes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productoId:      productoASolicitar,
                demandanteId:    usuarioActual.id,
                demandanteNombre: usuarioActual.nombre,
                notas
            })
        });
        alert(res.ok ? '✅ Solicitud enviada al ofertante.' : '❌ Error al enviar solicitud.');
        productoASolicitar = null;
    } catch (e) { alert('❌ Error de conexión.'); }
}

async function cargarSolicitudesOfertante() {
    const cont = document.getElementById('listaSolicitudesRecibidas');
    if (!cont) return;
    try {
        const res = await fetch(API + '/api/solicitudes?ofertanteId=' + usuarioActual.id);
        const ct  = res.headers.get('content-type') || '';
        if (!ct.includes('json')) {
            cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No tienes solicitudes de clientes.</p>';
            return;
        }
        const lista = await res.json();
        cont.innerHTML = lista.map(s => `
            <div class="prod-card ${s.estado}" style="border-left:4px solid ${s.estado==='PENDIENTE'?'#e9b10a':s.estado==='ACEPTADA'?'#10b981':'#ef4444'}">
                <div style="display:flex;justify-content:space-between">
                    <span class="prod-titulo" style="font-size:1rem">📦 Solicitud #${s.id}</span>
                    <span class="badge">${s.estado}</span>
                </div>
                <div style="margin:5px 0;font-size:.85rem"><strong>Cliente:</strong> ${s.demandanteNombre || 'Cliente'}</div>
                <div class="prod-desc" style="background:rgba(0,0,0,.03);padding:8px;border-radius:4px;font-style:italic">"${s.notas || ''}"</div>
                ${s.estado === 'PENDIENTE' ? `
                <div class="prod-actions" style="margin-top:10px;display:flex;gap:10px">
                    <button class="btn-success btn-sm" style="flex:1" onclick="responderSolicitud(${s.id},'ACEPTADA')">✅ Aceptar</button>
                    <button class="btn-danger  btn-sm" style="flex:1" onclick="responderSolicitud(${s.id},'RECHAZADA')">❌ Rechazar</button>
                </div>` : ''}
            </div>`).join('');
    } catch (e) {
        cont.innerHTML = '<p style="color:var(--danger)">Error al cargar solicitudes.</p>';
    }
}

async function responderSolicitud(id, estado) {
    try {
        await fetch(API + '/api/solicitudes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, estado })
        });
        cargarSolicitudesOfertante();
    } catch (e) { alert('❌ Error de conexión.'); }
}

// ══════════════════════════════════════════════════════════════════════════
// Calificaciones
// ══════════════════════════════════════════════════════════════════════════
let productoACalificar = null;

function abrirModalCalificacion(id, titulo) {
    productoACalificar = id;
    document.getElementById('calProductoTitulo').textContent = titulo;
    document.getElementById('calComentario').value = '';
    document.getElementById('calPuntuacion').value = '10';
    document.getElementById('calWordCount').textContent = '0 / 100 palabras';
    document.getElementById('overlayCalificacion').classList.add('open');
}

function cerrarModalCalificacion() {
    document.getElementById('overlayCalificacion').classList.remove('open');
    productoACalificar = null;
}

function contarPalabrasCalificacion() {
    const txt = document.getElementById('calComentario').value.trim();
    const n = txt === '' ? 0 : txt.split(/\s+/).length;
    const el = document.getElementById('calWordCount');
    el.textContent = n + ' / 100 palabras';
    el.style.color = n > 100 ? 'var(--danger)' : 'var(--muted)';
}

async function enviarCalificacion() {
    const comentario  = document.getElementById('calComentario').value.trim();
    const puntuacion  = parseInt(document.getElementById('calPuntuacion').value);
    const palabras    = comentario === '' ? 0 : comentario.split(/\s+/).length;

    if (!comentario) { alert('❌ Escribe un comentario.'); return; }
    if (palabras > 100) { alert('❌ El comentario no puede superar las 100 palabras.'); return; }
    if (puntuacion < 1 || puntuacion > 10) { alert('❌ La puntuación debe ser entre 1 y 10.'); return; }

    try {
        const res = await fetch(API + '/api/calificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productoId:   productoACalificar,
                usuarioId:    usuarioActual.id,
                usuarioNombre: usuarioActual.nombre,
                puntuacion,
                comentario
            })
        });
        if (res.ok) {
            alert('✅ ¡Calificación enviada!');
            cerrarModalCalificacion();
            cargarCatalogo(); // refrescar para mostrar nuevo promedio
        } else {
            const d = await res.json().catch(() => ({}));
            alert('❌ ' + (d.error || 'Error al enviar calificación'));
        }
    } catch (e) { alert('❌ Error de conexión.'); }
}

async function verCalificaciones(id, titulo) {
    try {
        const res = await fetch(API + '/api/calificaciones?productoId=' + id);
        const lista = await res.json();
        if (lista.length === 0) { alert(`"${titulo}"\n\nAún no tiene reseñas.`); return; }
        const texto = lista.map(c =>
            `⭐ ${c.puntuacion}/10 — ${c.usuarioNombre} (${c.fecha})\n"${c.comentario}"`
        ).join('\n\n');
        const prom = (lista.reduce((a,c) => a + c.puntuacion, 0) / lista.length).toFixed(1);
        alert(`${titulo}\nPromedio: ${prom}/10 (${lista.length} reseña${lista.length > 1 ? 's' : ''})\n\n${texto}`);
    } catch (e) { alert('❌ Error al cargar reseñas.'); }
}
