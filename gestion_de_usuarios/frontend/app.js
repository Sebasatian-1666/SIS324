// ── Configuración ────────────────────────────────────────────────────────
// Cambia esta URL a tu backend en Render cuando hagas deploy
const API_URL        = 'http://localhost:8080/api/usuarios';
const API_PRODUCTOS  = 'http://localhost:8080/api/productos';

// ── Estado de sesión (simulado, como en tu Sprint 1) ─────────────────────
// En el Sprint 1 usabas localStorage con credenciales hardcodeadas.
// Aquí ampliamos para soportar roles: OFERTANTE y ADMINISTRADOR.
const USUARIOS_DEMO = [
    { id: 1, nombre: 'Juan Ofertante', email: 'juan@test.com',   password: '123456',   rol: 'OFERTANTE' },
    { id: 2, nombre: 'Admin Sistema',  email: 'admin@test.com',  password: 'admin123', rol: 'ADMINISTRADOR' },
];

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
    cargarUsuarios();
}

// ── Login ─────────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Login simulado (igual que tu Sprint 1, ampliado con roles)
    const user = USUARIOS_DEMO.find(u => u.email === email && u.password === password);
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

    if (nombre === 'ofertante') cargarMisProductos();
    if (nombre === 'admin')     cargarAdmin();
    if (nombre === 'catalogo')  cargarCatalogo();
    if (nombre === 'usuarios')  cargarUsuarios();
}

// ── Usuarios (Sprint 1) ───────────────────────────────────────────────────
// Cambia tu función cargarUsuarios por esta que lee de localStorage o del arreglo DEMO
async function cargarUsuarios() {
    try {
        // Intentamos leer de localStorage, si no hay nada, inicializamos con los DEMO
        let usuarios = localStorage.getItem('usuarios_simulados');
        if (!usuarios) {
            localStorage.setItem('usuarios_simulados', JSON.stringify(USUARIOS_DEMO));
            usuarios = JSON.stringify(USUARIOS_DEMO);
        }
        const users = JSON.parse(usuarios);
        
        const tbody = document.getElementById('usersTableBody');
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

// Cambia "async function crearUsuario() {" por:
window.crearUsuario = async function() {
    const nombre = document.getElementById('createNombre').value.trim();
    const email = document.getElementById('createEmail').value.trim();
    const password = document.getElementById('createPassword').value;
    const rol = document.getElementById('createRol').value;

    if (!nombre || !email || !password) {
        return mostrarMsg('msgUsuario', '❌ Todos los campos son obligatorios', 'err');
    }

    // Lógica simulada de guardado
    let usuarios = JSON.parse(localStorage.getItem('usuarios_simulados') || JSON.stringify(USUARIOS_DEMO));
    
    // Verificar si el correo ya existe
    if (usuarios.some(u => u.email === email)) {
        return mostrarMsg('msgUsuario', '❌ El correo ya está registrado', 'err');
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

    mostrarMsg('msgUsuario', '✅ Usuario creado correctamente (Simulado)', 'ok');
    ['createNombre', 'createEmail', 'createPassword'].forEach(id => document.getElementById(id).value = '');
    cargarUsuarios(); 
};

window.eliminarUsuario = async function(id) {
    if (!confirm('¿Realmente deseas eliminar este usuario?')) return;
    
    let usuarios = JSON.parse(localStorage.getItem('usuarios_simulados') || '[]');
    usuarios = usuarios.filter(u => u.id !== id);
    localStorage.setItem('usuarios_simulados', JSON.stringify(usuarios));
    
    mostrarMsg('msgUsuario', '✅ Usuario eliminado correctamente', 'ok');
    cargarUsuarios();
};

// ── Utilidad ──────────────────────────────────────────────────────────────
function mostrarMsg(elId, texto, tipo) {
    const el = document.getElementById(elId);
    el.textContent = texto;
    el.className = 'msg ' + tipo;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}
// ✅ PEGA ESTO AL FINAL (Antes de checkAuth();):

// Cambiar visualmente entre Login y Registro
window.conmutarAuth = function(mostrarRegistro) {
    document.getElementById('loginFormContainer').style.display = mostrarRegistro ? 'none' : 'block';
    document.getElementById('registroFormContainer').style.display = mostrarRegistro ? 'block' : 'none';
    document.getElementById('loginError').style.display = 'none';
};

// Escuchar el envío del formulario de registro público
document.getElementById('registroForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Mismo mapeo estricto de tu base de datos: id, nombre, email, password
    const body = {
        id: 0,
        nombre: document.getElementById('regNombre').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            mostrarMsg('msgRegistro', '✅ Cuenta creada con éxito. Ya puedes ingresar.', 'ok');
            document.getElementById('registroForm').reset();
            
            // Para el login simulado le asignamos un rol por defecto temporal
            USUARIOS_DEMO.push({ id: Date.now(), ...body, rol: 'DEMANDANTE' });
            
            setTimeout(() => window.conmutarAuth(false), 1500);
        } else {
            mostrarMsg('msgRegistro', '❌ ' + (data.mensaje || 'Error al registrar'), 'err');
        }
    } catch (e) {
        mostrarMsg('msgRegistro', '❌ Backend no disponible', 'err');
    }
});
checkAuth();
