// ── Configuración ─────────────────────────────────────────────────────────
// Si abres index.html directo desde disco (file://), cambia esto a 'http://localhost:8080'
const API = '';

let usuarioActual = null;

// ── Inicialización ────────────────────────────────────────────────────────
function checkAuth() {
    const guardado = localStorage.getItem('userSession');
    if (guardado) {
        usuarioActual = JSON.parse(guardado);
        mostrarApp();
    } else {
        mostrarLogin();
    }
}

function mostrarLogin() {
    document.getElementById('loginSection').classList.add('active');
    document.getElementById('appSection').classList.remove('active');
    document.getElementById('navbar').style.display = 'none';
}

function mostrarApp() {
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('appSection').classList.add('active');
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('navNombre').textContent =
        usuarioActual.nombre + ' (' + usuarioActual.rol + ')';

    aplicarPermisosPorRol();
}

// ── Control de tabs por rol ───────────────────────────────────────────────
function aplicarPermisosPorRol() {
    const rol = usuarioActual.rol;

    // Ocultar todas las tabs y contenidos primero
    const tabsConfig = {
        'usuarios':  ['ADMINISTRADOR'],
        'ofertante': ['ADMINISTRADOR', 'OFERTANTE'],
        'admin':     ['ADMINISTRADOR'],
        'catalogo':  ['ADMINISTRADOR', 'OFERTANTE', 'DEMANDANTE'],
    };

    let primeraTabVisible = null;

    document.querySelectorAll('.tabs .tab[onclick]').forEach(btn => {
        // Extraer nombre del tab del onclick="switchTab('xxx', this)"
        const match = btn.getAttribute('onclick').match(/switchTab\('(\w+)'/);
        if (!match) return;
        const nombre = match[1];
        const rolesPermitidos = tabsConfig[nombre] || [];
        const visible = rolesPermitidos.includes(rol);
        btn.style.display = visible ? '' : 'none';
        if (visible && !primeraTabVisible) primeraTabVisible = { nombre, btn };
    });

    // Activar la primera tab visible para este rol
    if (primeraTabVisible) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + primeraTabVisible.nombre).classList.add('active');
        primeraTabVisible.btn.classList.add('active');

        if (primeraTabVisible.nombre === 'catalogo')  cargarCatalogo();
        if (primeraTabVisible.nombre === 'usuarios')  cargarUsuarios();
        if (primeraTabVisible.nombre === 'ofertante') { cargarMisProductos(); if (typeof cargarSolicitudesOfertante === 'function') cargarSolicitudesOfertante(); }
        if (primeraTabVisible.nombre === 'admin')     cargarAdmin();
    }
}

// ── Login (llama al backend real) ─────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(API + '/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const user = await res.json();
            usuarioActual = user;
            localStorage.setItem('userSession', JSON.stringify(user));
            document.getElementById('loginError').style.display = 'none';
            document.getElementById('loginForm').reset();
            mostrarApp();
        } else {
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (err) {
        console.error('Error en login:', err);
        document.getElementById('loginError').style.display = 'block';
    }
});

// ── Logout ────────────────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('userSession');
    usuarioActual = null;
    mostrarLogin();
}

// ── Tabs ──────────────────────────────────────────────────────────────────
function switchTab(nombre, btn) {
    // Verificar permiso antes de cambiar
    const tabsConfig = {
        'usuarios':  ['ADMINISTRADOR'],
        'ofertante': ['ADMINISTRADOR', 'OFERTANTE'],
        'admin':     ['ADMINISTRADOR'],
        'catalogo':  ['ADMINISTRADOR', 'OFERTANTE', 'DEMANDANTE'],
    };
    const rolesPermitidos = tabsConfig[nombre] || [];
    if (!rolesPermitidos.includes(usuarioActual.rol)) {
        alert('❌ No tienes permiso para acceder a esta sección.');
        return;
    }

    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + nombre).classList.add('active');
    btn.classList.add('active');

    if (nombre === 'ofertante') {
        cargarMisProductos();
        if (typeof cargarSolicitudesOfertante === 'function') cargarSolicitudesOfertante();
    }
    if (nombre === 'admin')    cargarAdmin();
    if (nombre === 'catalogo')  cargarCatalogo();
    if (nombre === 'usuarios')  cargarUsuarios();
}

// ── Panel de Control de Usuarios (Admin) ──────────────────────────────────
async function cargarUsuarios() {
    try {
        const res = await fetch(API + '/api/usuarios');
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!res.ok) { tbody.innerHTML = '<tr><td colspan="5">Error al cargar usuarios</td></tr>'; return; }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            tbody.innerHTML = '<tr><td colspan="5">No hay usuarios registrados</td></tr>';
            return;
        }

        const users = await res.json();
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>${u.rol || '–'}</td>
                <td>
                    <button class="btn-danger btn-sm" onclick="eliminarUsuario(${u.id})">Eliminar</button>
                </td>
            </tr>`).join('');
    } catch (e) {
        console.error('Error al cargar usuarios', e);
    }
}

// Crear usuario (Admin desde panel interno)
window.crearUsuario = async function(esRegistroPublico = false) {
    const sufijo = esRegistroPublico ? 'Reg' : 'create';

    const idNombre   = document.getElementById(`${sufijo}Nombre`)   ? `${sufijo}Nombre`   : 'createNombre';
    const idEmail    = document.getElementById(`${sufijo}Email`)    ? `${sufijo}Email`    : 'createEmail';
    const idPassword = document.getElementById(`${sufijo}Password`) ? `${sufijo}Password` : 'createPassword';
    const idRol      = document.getElementById(`${sufijo}Rol`)      ? `${sufijo}Rol`      : 'createRol';

    const nombre   = document.getElementById(idNombre).value.trim();
    const email    = document.getElementById(idEmail).value.trim();
    const password = document.getElementById(idPassword).value;
    const rol      = document.getElementById(idRol) ? document.getElementById(idRol).value : 'DEMANDANTE';

    if (!nombre || !email || !password) {
        alert('❌ Todos los campos son obligatorios');
        return;
    }

    try {
        const res = await fetch(API + '/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, rol })
        });

        if (res.ok || res.status === 201) {
            alert('✅ ¡Cuenta creada con éxito! Ya puedes iniciar sesión con tus credenciales.');
            document.getElementById(idNombre).value = '';
            document.getElementById(idEmail).value = '';
            document.getElementById(idPassword).value = '';
            if (esRegistroPublico && typeof mostrarLogin === 'function') {
                mostrarLogin();
            } else {
                cargarUsuarios();
            }
        } else {
            const data = await res.json().catch(() => ({}));
            alert('❌ Error al crear usuario: ' + (data.error || res.status));
        }
    } catch (err) {
        console.error('Error al crear usuario:', err);
        alert('❌ No se pudo conectar con el servidor.');
    }
};

window.eliminarUsuario = async function(id) {
    if (!confirm('¿Realmente deseas eliminar este usuario?')) return;

    try {
        const res = await fetch(API + '/api/usuarios?id=' + id, { method: 'DELETE' });
        if (res.ok) {
            mostrarMsg('msgUsuario', '✅ Usuario eliminado correctamente', 'ok');
        } else {
            mostrarMsg('msgUsuario', '❌ No se pudo eliminar el usuario', 'error');
        }
        cargarUsuarios();
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
    }
};

// ── Registro Público ──────────────────────────────────────────────────────
window.registrarUsuarioPublico = async function() {
    const nombreInput   = document.getElementById('regNombre');
    const emailInput    = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');
    const rolInput      = document.getElementById('regRol');

    if (!nombreInput || !emailInput || !passwordInput) {
        alert("❌ Error de diseño: No se encontraron los IDs en el HTML.");
        return;
    }

    const nombre   = nombreInput.value.trim();
    const email    = emailInput.value.trim();
    const password = passwordInput.value;
    const rol      = rolInput ? rolInput.value : 'DEMANDANTE';

    if (!nombre || !email || !password) {
        alert('❌ Por favor, llena todos los campos obligatorios.');
        return;
    }

    if (password.length < 6) {
        alert('❌ La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    try {
        const res = await fetch(API + '/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, rol })
        });

        if (res.ok || res.status === 201) {
            alert(`✅ ¡Cuenta creada como ${rol}! Ya puedes iniciar sesión.`);
            nombreInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            window.conmutarAuth(false);
        } else {
            const data = await res.json().catch(() => ({}));
            alert('❌ Error al registrar: ' + (data.error || 'Correo ya registrado o datos inválidos.'));
        }
    } catch (err) {
        console.error('Error al registrar:', err);
        alert('❌ No se pudo conectar con el servidor.');
    }
};

// ── Utilidades de interfaz ────────────────────────────────────────────────
function mostrarMsg(elId, texto, tipo) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = texto;
    el.className = 'msg ' + tipo;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

window.conmutarAuth = function(mostrarRegistro) {
    const loginCont = document.getElementById('loginFormContainer');
    const regCont   = document.getElementById('registroFormContainer');

    if (loginCont) loginCont.style.display = mostrarRegistro ? 'none' : 'block';
    if (regCont)   regCont.style.display   = mostrarRegistro ? 'block' : 'none';

    const errEl = document.getElementById('loginError');
    if (errEl) errEl.style.display = 'none';
};

// Arrancar validación de sesión
checkAuth();
