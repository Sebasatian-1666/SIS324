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

function filtrarCatalogo() {
    const txt = document.getElementById('buscar').value.toLowerCase();
    const cat = document.getElementById('filtroCat').value;
    
    const filtrados = catalogoCache.filter(p =>
        (p.titulo.toLowerCase().includes(txt) || p.descripcion.toLowerCase().includes(txt)) &&
        (!cat || p.categoria === cat)
    );
    
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
                ${p.tipo ? `<span class="badge" style="background:#e9d8fd;color:#553c9a">${p.tipo}</span>` : ''}
            </div>
            <div class="prod-desc">${p.descripcion}</div>
            <div class="prod-meta">
                <span class="prod-precio">$${parseFloat(p.precio).toFixed(2)}</span>
                <span style="font-size:.78rem;color:var(--muted)">👤 ${p.ofertanteNombre || 'Anónimo'}</span>
            </div>
        </div>`).join('');
}

// ── Helper: badge de estado ───────────────────────────────────────────────
function badgeEstado(estado) {
    const m = { PENDIENTE: 'b-pending', APROBADO: 'b-approved', RECHAZADO: 'b-rejected' };
    const i = { PENDIENTE: '⏳', APROBADO: '✅', RECHAZADO: '❌' };
    return `<span class="badge ${m[estado]}">${i[estado]} ${estado}</span>`;
}