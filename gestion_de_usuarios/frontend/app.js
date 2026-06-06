// ── Configuración (Mocks del Frontend) ───────────────────────────────────
const USUARIOS_DEMO = [
    { id: 1, nombre: 'Juan Ofertante', email: 'juan@test.com',   password: '123456',   rol: 'OFERTANTE' },
    { id: 2, nombre: 'Admin Sistema',  email: 'admin@test.com',   password: 'admin123', rol: 'ADMINISTRADOR' },
];

let usuarioActual = null;

// Helper para obtener la lista global de usuarios simulación
function obtenerUsuariosLocal() {
    let usuarios = localStorage.getItem('usuarios_simulados');
    if (!usuarios) {
        localStorage.setItem('usuarios_simulados', JSON.stringify(USUARIOS_DEMO));
        return USUARIOS_DEMO;
    }
    return JSON.parse(usuarios);
}

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
    cargarUsuarios();
}

// ── Login Simulado ────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // LEER DE LOCALSTORAGE: Así reconoce cuentas creadas dinámicamente
    const listaUsuarios = obtenerUsuariosLocal();
    const user = listaUsuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
        usuarioActual = user;
        localStorage.setItem('userSession', JSON.stringify(user));
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginForm').reset();
        mostrarApp();
    } else {
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
        const users = obtenerUsuariosLocal();
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

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
        console.error('Error al cargar usuarios simulados', e);
    }
}

// Ventana de creación interna (Admin o automatizada)
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

    let usuarios = obtenerUsuariosLocal();
    if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('❌ El correo electrónico ya está registrado');
        return;
    }

    const nuevoUsuario = {
        id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
        nombre,
        email,
        password,
        rol
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_simulados', JSON.stringify(usuarios));

    alert('✅ ¡Cuenta creada con éxito! Ya puedes iniciar sesión con tus credenciales.');
    
    document.getElementById(idNombre).value = '';
    document.getElementById(idEmail).value = '';
    document.getElementById(idPassword).value = '';

    if (esRegistroPublico && typeof mostrarLogin === 'function') {
        mostrarLogin(); 
    } else {
        cargarUsuarios(); 
    }
};

window.eliminarUsuario = async function(id) {
    if (!confirm('¿Realmente deseas eliminar este usuario?')) return;
    
    let usuarios = obtenerUsuariosLocal();
    usuarios = usuarios.filter(u => u.id !== id);
    localStorage.setItem('usuarios_simulados', JSON.stringify(usuarios));
    
    mostrarMsg('msgUsuario', '✅ Usuario eliminado correctamente', 'ok');
    cargarUsuarios();
};

// ── Utilidades e Interfaz de Bienvenida ─────────────────────────────────────
function mostrarMsg(elId, texto, tipo) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = texto;
    el.className = 'msg ' + tipo;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

// Cambiar visualmente entre los formularios de Login y Registro público
window.conmutarAuth = function(mostrarRegistro) {
    const loginCont = document.getElementById('loginFormContainer');
    const regCont = document.getElementById('registroFormContainer');
    
    if(loginCont) loginCont.style.display = mostrarRegistro ? 'none' : 'block';
    if(regCont) regCont.style.display = mostrarRegistro ? 'block' : 'none';
    
    const errEl = document.getElementById('loginError');
    if (errEl) errEl.style.display = 'none';
};

// ==========================================================================
// REGISTRO PÚBLICO INTEGRADO (REEMPLAZA EL FETCH VIEJO)
// ==========================================================================
window.registrarUsuarioPublico = function() {
    const nombreInput   = document.getElementById('nombreReg');
    const emailInput    = document.getElementById('emailReg');
    const passwordInput = document.getElementById('passwordReg');
    const rolInput      = document.getElementById('rolReg'); 

    if (!nombreInput || !emailInput || !passwordInput) {
        alert("❌ Error: Verifica que los inputs tengan id='nombreReg', 'emailReg' y 'passwordReg'");
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

    if (password.length < 4) {
        alert('❌ La contraseña debe tener al menos 4 caracteres.');
        return;
    }

    let usuarios = obtenerUsuariosLocal();

    if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('❌ Este correo electrónico ya se encuentra registrado.');
        return;
    }

    const nuevoUsuario = {
        id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
        nombre: nombre,
        email: email,
        password: password,
        rol: rol
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_simulados', JSON.stringify(usuarios));

    alert(`✅ ¡Excelente Sebas! Cuenta creada como ${rol}.\nYa puedes iniciar sesión.`);

    nombreInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';

    // Te manda de regreso al Login limpio listo para entrar
    window.conmutarAuth(false);
};

// Arrancar validación de sesión
checkAuth();
// ==========================================================================
// REGISTRO PÚBLICO INTEGRADO (Sincronizado con tus IDs del HTML)
// ==========================================================================
window.registrarUsuarioPublico = function() {
    // 1. Capturamos los datos usando los IDs reales de tu index.html
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

    // 2. Validaciones básicas obligatorias
    if (!nombre || !email || !password) {
        alert('❌ Por favor, llena todos los campos obligatorios.');
        return;
    }

    if (password.length < 6) { // Ajustado a 6 como dice tu placeholder
        alert('❌ La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    // 3. Traer los usuarios que ya están en el LocalStorage
    let usuarios = obtenerUsuariosLocal();

    // 4. Controlar que no se duplique el correo
    if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('❌ Este correo electrónico ya se encuentra registrado.');
        return;
    }

    // 5. Insertar el nuevo usuario simulado
    const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const nuevoUsuario = {
        id: nuevoId,
        nombre: nombre,
        email: email,
        password: password,
        rol: rol
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_simulados', JSON.stringify(usuarios));

    alert(`✅ ¡Excelente Sebas! Cuenta creada como ${rol}.\nYa puedes iniciar sesión.`);

    // Limpiamos el formulario público
    nombreInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';

    // Te manda de regreso al Login listo para entrar
    window.conmutarAuth(false);
};