// ── productos.js – Sprint 2 (HU-01, HU-02, HU-03) ──────────────────────
// Mantiene intacta la estructura original pero con persistencia simulada en localStorage

let catalogoCache = [];
let productoARechazar = null;

// 🧪 Semilla inicial para que la app no aparezca vacía la primera vez
const PRODUCTOS_SEMILLA = [
    { id: 1, titulo: "Laptop HP Pavillion", descripcion: "Excelente estado, 16GB de RAM y 512GB SSD.", precio: 650.00, categoria: "Tecnología", tipo: "PRODUCTO", estado: "PENDIENTE", ofertanteId: 1, ofertanteNombre: "Juan Ofertante" },
    { id: 2, titulo: "Clases de Cálculo I", descripcion: "Clases particulares orientadas a exámenes de la USFX.", precio: 20.00, categoria: "Servicios", tipo: "SERVICIO", estado: "APROBADO", ofertanteId: 1, ofertanteNombre: "Juan Ofertante" }
];

// 🔄 Helper para sincronizar la base de datos local simulada
function obtenerProductosLocal() {
    let prods = localStorage.getItem('productos_simulados');
    if (!prods) {
        localStorage.setItem('productos_simulados', JSON.stringify(PRODUCTOS_SEMILLA));
        prods = JSON.stringify(PRODUCTOS_SEMILLA);
    }
    return JSON.parse(prods);
}

function guardarProductosLocal(arr) {
    localStorage.setItem('productos_simulados', JSON.stringify(arr));
}

// ══════════════════════════════════════════════════════════════════════════
// HU-01 + HU-02: Guardar producto (crear o editar) - MODO FRONTEND
// ══════════════════════════════════════════════════════════════════════════
async function guardarProducto() {
    const editId = document.getElementById('prodEditId').value;
    const body = {
        titulo:      document.getElementById('prodTitulo').value.trim(),
        descripcion: document.getElementById('prodDesc').value.trim(),
        precio:      parseFloat(document.getElementById('prodPrecio').value),
        categoria:   document.getElementById('prodCategoria').value,
        tipo:        document.getElementById('prodTipo').value,
        ofertanteId: usuarioActual ? usuarioActual.id : 1,
        ofertanteNombre: usuarioActual ? usuarioActual.nombre : "Juan Ofertante"
    };

    // Validaciones básicas intactas
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

    let productos = obtenerProductosLocal();

    if (editId) {
        // HU-02: Editar (Simulado) -> Al editar vuelve a estado PENDIENTE de revisión
        const idInt = parseInt(editId);
        const idx = productos.findIndex(p => p.id === idInt);
        if (idx !== -1) {
            productos[idx] = { 
                ...productos[idx], 
                ...body, 
                estado: 'PENDIENTE', 
                motivoRechazo: null 
            };
            guardarProductosLocal(productos);
            mostrarMsg('msgProducto', '✅ Producto actualizado correctamente (En espera de aprobación)', 'ok');
        }
    } else {
        // HU-01: Crear (Simulado) -> Estado siempre PENDIENTE inicialmente
        body.id = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
        body.estado = 'PENDIENTE';
        productos.push(body);
        guardarProductosLocal(productos);
        mostrarMsg('msgProducto', '✅ Producto registrado. Pendiente de aprobación.', 'ok');
    }

    cancelarEdicion();
    cargarMisProductos();
}

// ══════════════════════════════════════════════════════════════════════════
// HU-02: Cargar mis productos (por ofertanteId) - MODO FRONTEND
// ══════════════════════════════════════════════════════════════════════════
async function cargarMisProductos() {
    const ofId = usuarioActual ? usuarioActual.id : 1;
    const cont = document.getElementById('listaOfertante');
    if (!cont) return;
    
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';

    let list = obtenerProductosLocal().filter(p => p.ofertanteId === ofId);

    if (list.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No tienes productos registrados aún.</p>';
        return;
    }
    cont.innerHTML = list.map(prodCardOfertante).join('');
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
    
    let productos = obtenerProductosLocal().filter(p => p.id !== id);
    guardarProductosLocal(productos);
    
    mostrarMsg('msgProducto', '✅ Producto eliminado correctamente', 'ok');
    cargarMisProductos();
}

// ══════════════════════════════════════════════════════════════════════════
// HU-03: Panel Admin – listar pendientes + aprobar/rechazar - MODO FRONTEND
// ══════════════════════════════════════════════════════════════════════════
async function cargarAdmin() {
    const cont = document.getElementById('listaAdmin');
    if (!cont) return;
    
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';

    let todos = obtenerProductosLocal();
    let pendientes = todos.filter(p => p.estado === 'PENDIENTE');

    // Actualización dinámica de los contadores en las tarjetas de estadísticas
    if(document.getElementById('cntPend')) document.getElementById('cntPend').textContent = pendientes.length;
    if(document.getElementById('cntApr'))  document.getElementById('cntApr').textContent  = todos.filter(p => p.estado === 'APROBADO').length;
    if(document.getElementById('cntRech')) document.getElementById('cntRech').textContent = todos.filter(p => p.estado === 'RECHAZADO').length;

    if (pendientes.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">✅ No hay productos pendientes de revisión.</p>';
        return;
    }
    cont.innerHTML = pendientes.map(prodCardAdmin).join('');
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
    let productos = obtenerProductosLocal();
    const idx = productos.findIndex(p => p.id === id);
    
    if (idx !== -1) {
        productos[idx].estado = 'APROBADO';
        productos[idx].motivoRechazo = null; // Limpia si tenía rechazos previos
        guardarProductosLocal(productos);
        alert('✅ Producto aprobado correctamente.');
        cargarAdmin();
    }
}

function abrirModalRechazo(id) {
    productoARechazar = id;
    document.getElementById('motivoTexto').value = '';
    document.getElementById('overlay').classList.add('open');
}

async function confirmarRechazo() {
    const motivo = document.getElementById('motivoTexto').value.trim();
    if (!motivo) { alert('Debes escribir el motivo del rechazo.'); return; }

    let productos = obtenerProductosLocal();
    const idx = productos.findIndex(p => p.id === productoARechazar);
    
    if (idx !== -1) {
        productos[idx].estado = 'RECHAZADO';
        productos[idx].motivoRechazo = motivo;
        guardarProductosLocal(productos);
        
        alert('❌ Producto rechazado con éxito.');
        cerrarModal();
        cargarAdmin();
    }
}

function cerrarModal() {
    document.getElementById('overlay').classList.remove('open');
    productoARechazar = null;
}

// ══════════════════════════════════════════════════════════════════════════
// Catálogo público (solo APROBADOS) - MODO FRONTEND
// ══════════════════════════════════════════════════════════════════════════
async function cargarCatalogo() {
    const cont = document.getElementById('listaCatalogo');
    if (!cont) return;
    
    cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">Cargando...</p>';
    
    // Filtramos directamente los aprobados de la persistencia local
    catalogoCache = obtenerProductosLocal().filter(p => p.estado === 'APROBADO');
    filtrarCatalogo();
}

// REEMPLAZA tu función filtrarCatalogo en productos.js por esta:
function filtrarCatalogo() {
    const txt = document.getElementById('buscar').value.toLowerCase();
    const cat = document.getElementById('filtroCat').value;
    const orden = document.getElementById('ordenarCat')?.value || 'recientes'; // Captura el criterio de orden
    
    // 1. Filtrar
    let filtrados = catalogoCache.filter(p =>
        (p.titulo.toLowerCase().includes(txt) || p.descripcion.toLowerCase().includes(txt)) &&
        (!cat || p.categoria === cat)
    );
    
    // 2. Ordenar (Simulado con atributos de la semilla o interacción)
    if (orden === 'recientes') {
        // Ordenar por ID de mayor a menor (los últimos creados)
        filtrados.sort((a, b) => b.id - a.id);
    } else if (orden === 'calificados') {
        // Asumimos un atributo 'calificacion' (0 a 5) en el objeto
        filtrados.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
    } else if (orden === 'utilizados') {
        // Asumimos un atributo 'vecesUtilizado' para medir popularidad
        filtrados.sort((a, b) => (b.vecesUtilizado || 0) - (a.vecesUtilizado || 0));
    }
    
    const cont = document.getElementById('listaCatalogo');
    if (!cont) return;

    if (filtrados.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No se encontraron productos.</p>';
        return;
    }

    // 3. Renderizar con el botón de "Solicitar" incluido
    cont.innerHTML = filtrados.map(p => `
        <div class="prod-card APROBADO">
            <div class="prod-titulo">${p.titulo}</div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                <span class="badge b-info">${p.categoria}</span>
                ${p.calificacion ? `<span class="badge" style="background:#fef3c7;color:#92400e">⭐ ${p.calificacion.toFixed(1)}</span>` : ''}
            </div>
            <div class="prod-desc">${p.descripcion}</div>
            <div class="prod-meta">
                <span class="prod-precio">$${parseFloat(p.precio).toFixed(2)}</span>
                <span style="font-size:.78rem;color:var(--muted)">👤 ${p.ofertanteNombre || 'Anónimo'}</span>
            </div>
            <div class="prod-actions" style="margin-top:10px">
                <button class="btn-success btn-sm" style="width:100%" onclick="abrirModalSolicitud(${p.id}, '${p.titulo.replace(/'/g, "\\'")}')">📩 Solicitar este Producto/Servicio</button>
            </div>
        </div>`).join('');
}
// ── Helper: badge de estado ───────────────────────────────────────────────
function badgeEstado(estado) {
    const m = { PENDIENTE: 'b-pending', APROBADO: 'b-approved', RECHAZADO: 'b-rejected' };
    const i = { PENDIENTE: '⏳', APROBADO: '✅', RECHAZADO: '❌' };
    return `<span class="badge ${m[estado]}">${i[estado]} ${estado}</span>`;
}

let productoASolicitar = null;

// Abre un modal para que el demandante escriba los requerimientos de su solicitud
function abrirModalSolicitud(id, titulo) {
    productoASolicitar = id;
    // Asumiendo que reutilizas un modal o creas uno para solicitudes
    const notas = prompt(`Solicitar: "${titulo}"\n\nEscribe los detalles de tu requerimiento (ej. Fecha, cantidad, dirección, etc.):`);
    
    if (notas === null) return; // Canceló
    if (notas.trim().length < 5) {
        alert("❌ Debes ingresar una descripción detallada de tu necesidad para que el ofertante la evalúe.");
        return;
    }
    
    registrarSolicitudSimulada(notas.trim());
}

function registrarSolicitudSimulada(notas) {
    let solicitudes = JSON.parse(localStorage.getItem('solicitudes_simuladas') || '[]');
    let productos = obtenerProductosLocal();
    const prod = productos.find(p => p.id === productoASolicitar);

    if (!prod) return alert("❌ Error: Producto no encontrado.");

    const nuevaSolicitud = {
        id: solicitudes.length > 0 ? Math.max(...solicitudes.map(s => s.id)) + 1 : 1,
        productoId: prod.id,
        productoTitulo: prod.titulo,
        ofertanteId: prod.ofertanteId, // A quién va dirigida
        demandanteId: usuarioActual ? usuarioActual.id : 99, // Quién la pide
        demandanteNombre: usuarioActual ? usuarioActual.nombre : "Cliente Demo",
        detalles: "%SOLICITUD: " + notas,
        estado: "PENDIENTE", // Estado de la solicitud: PENDIENTE, ACEPTADA, RECHAZADA
        fecha: new Date().toLocaleDateString()
    };

    solicitudes.push(nuevaSolicitud);
    localStorage.setItem('solicitudes_simuladas', JSON.stringify(solicitudes));
    
    alert("✅ ¡Solicitud enviada al ofertante con éxito! Puedes ver su estado en tu panel.");
    productoASolicitar = null;
}

// Carga las solicitudes que le han hecho a este Ofertante específico
async function cargarSolicitudesOfertante() {
    const cont = document.getElementById('listaSolicitudesRecibidas'); // Asegúrate de tener este contenedor en el HTML de la pestaña Ofertante
    if (!cont) return;

    const ofId = usuarioActual ? usuarioActual.id : 1;
    let todasLasSolicitudes = JSON.parse(localStorage.getItem('solicitudes_simuladas') || '[]');
    
    // Filtrar solo las solicitudes de productos que le pertenecen a este ofertante
    let misSolicitudes = todasLasSolicitudes.filter(s => s.ofertanteId === ofId);

    if (misSolicitudes.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No tienes solicitudes pendientes de clientes.</p>';
        return;
    }

    cont.innerHTML = misSolicitudes.map(s => `
        <div class="prod-card ${s.estado}" style="border-left: 4px solid ${s.estado === 'PENDIENTE' ? '#e9b10a' : s.estado === 'ACEPTADA' ? '#10b981' : '#ef4444'}">
            <div style="display:flex; justify-content:space-between;">
                <span class="prod-titulo" style="font-size: 1rem;">📦 ${s.productoTitulo}</span>
                <span class="badge">${s.fecha}</span>
            </div>
            <div style="margin: 5px 0; font-size: 0.85rem;">
                <strong>Cliente:</strong> ${s.demandanteNombre}
            </div>
            <div class="prod-desc" style="background: rgba(0,0,0,0.03); padding: 8px; border-radius:4px; font-style: italic;">
                "${s.detalles.replace("%SOLICITUD: ", "")}"
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem;">
                <strong>Estado de Solicitud:</strong> 
                <span style="color: ${s.estado === 'PENDIENTE' ? '#d97706' : s.estado === 'ACEPTADA' ? '#059669' : '#dc2626'} font-weight:bold;">
                    ${s.estado}
                </span>
            </div>
            
            ${s.estado === 'PENDIENTE' ? `
                <div class="prod-actions" style="margin-top: 10px; display:flex; gap:10px;">
                    <button class="btn-success btn-sm" style="flex:1;" onclick="responderSolicitud(${s.id}, 'ACEPTADA')">✅ Aceptar Pedido</button>
                    <button class="btn-danger btn-sm" style="flex:1;" onclick="responderSolicitud(${s.id}, 'RECHAZADA')">❌ Rechazar Pedido</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Carga las solicitudes que le han hecho a este Ofertante específico
async function cargarSolicitudesOfertante() {
    const cont = document.getElementById('listaSolicitudesRecibidas'); // Asegúrate de tener este contenedor en el HTML de la pestaña Ofertante
    if (!cont) return;

    const ofId = usuarioActual ? usuarioActual.id : 1;
    let todasLasSolicitudes = JSON.parse(localStorage.getItem('solicitudes_simuladas') || '[]');
    
    // Filtrar solo las solicitudes de productos que le pertenecen a este ofertante
    let misSolicitudes = todasLasSolicitudes.filter(s => s.ofertanteId === ofId);

    if (misSolicitudes.length === 0) {
        cont.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No tienes solicitudes pendientes de clientes.</p>';
        return;
    }

    cont.innerHTML = misSolicitudes.map(s => `
        <div class="prod-card ${s.estado}" style="border-left: 4px solid ${s.estado === 'PENDIENTE' ? '#e9b10a' : s.estado === 'ACEPTADA' ? '#10b981' : '#ef4444'}">
            <div style="display:flex; justify-content:space-between;">
                <span class="prod-titulo" style="font-size: 1rem;">📦 ${s.productoTitulo}</span>
                <span class="badge">${s.fecha}</span>
            </div>
            <div style="margin: 5px 0; font-size: 0.85rem;">
                <strong>Cliente:</strong> ${s.demandanteNombre}
            </div>
            <div class="prod-desc" style="background: rgba(0,0,0,0.03); padding: 8px; border-radius:4px; font-style: italic;">
                "${s.detalles.replace("%SOLICITUD: ", "")}"
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem;">
                <strong>Estado de Solicitud:</strong> 
                <span style="color: ${s.estado === 'PENDIENTE' ? '#d97706' : s.estado === 'ACEPTADA' ? '#059669' : '#dc2626'} font-weight:bold;">
                    ${s.estado}
                </span>
            </div>
            
            ${s.estado === 'PENDIENTE' ? `
                <div class="prod-actions" style="margin-top: 10px; display:flex; gap:10px;">
                    <button class="btn-success btn-sm" style="flex:1;" onclick="responderSolicitud(${s.id}, 'ACEPTADA')">✅ Aceptar Pedido</button>
                    <button class="btn-danger btn-sm" style="flex:1;" onclick="responderSolicitud(${s.id}, 'RECHAZADA')">❌ Rechazar Pedido</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Cambia el estado de la solicitud del cliente
function responderSolicitud(solicitudId, nuevoEstado) {
    let solicitudes = JSON.parse(localStorage.getItem('solicitudes_simuladas') || '[]');
    const idx = solicitudes.findIndex(s => s.id === solicitudId);

    if (idx !== -1) {
        solicitudes[idx].estado = nuevoEstado;
        localStorage.setItem('solicitudes_simuladas', JSON.stringify(solicitudes));
        alert(`Solicitud cambiada a: ${nuevoEstado}`);
        cargarSolicitudesOfertante(); // Recargar la lista
    }
}

