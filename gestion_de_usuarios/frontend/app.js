const API_URL = 'http://localhost:8080/api/usuarios';

const loginSection = document.getElementById('loginSection');
const crudSection = document.getElementById('crudSection');
const loginForm = document.getElementById('loginForm');
const createForm = document.getElementById('createForm');
const usersTableBody = document.getElementById('usersTableBody');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Inicialización
function checkAuth() {
    if (localStorage.getItem('userAuth')) {
        showCrud();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginSection.classList.add('active');
    crudSection.classList.remove('active');
}

function showCrud() {
    loginSection.classList.remove('active');
    crudSection.classList.add('active');
    loadUsers();
}

// Login
//loginForm.addEventListener('submit', async (e) => {
//e.preventDefault();
//const email = document.getElementById('loginEmail').value;
//const password = document.getElementById('loginPassword').value;

//try {
//const response = await fetch(`${API_URL}/login`, {
//  method: 'POST',
//headers: { 'Content-Type': 'application/json' },
//body: JSON.stringify({ email, password })
//});

//const data = await response.json();

//if (response.ok && data.success) {
//localStorage.setItem('userAuth', 'true');
//loginError.style.display = 'none';
//loginForm.reset();
//  showCrud();
//} else {
//      loginError.style.display = 'block';
//    }
//} catch (error) {
//    console.error('Error en login:', error);
//    alert('Error al conectar con el servidor');
//  }
//});
// Login SIMULADO para el Sprint 1 (Sustituye al bloque del fetch)
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    console.log("Modo Prototipo: Validando credenciales localmente...");

    // Usamos los mismos datos que pusiste en tu MainTest para ser coherentes
    if (email === "juan@test.com" && password === "123456") {
        localStorage.setItem('userAuth', 'true');
        loginError.style.display = 'none';
        loginForm.reset();
        showCrud();
    } else {
        // Si no es ese usuario, mostramos el error que ya tienes en el HTML
        loginError.style.display = 'block';
    }
});
// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userAuth');
    showLogin();
});

// Load Users
async function loadUsers() {
    try {
        const response = await fetch(API_URL);
        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

// Render Users
function renderUsers(users) {
    usersTableBody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.nombre}</td>
            <td>${user.email}</td>
            <td>
                <button class="danger" onclick="deleteUser(${user.id})">Eliminar</button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

// Create User
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('createNombre').value;
    const email = document.getElementById('createEmail').value;
    const password = document.getElementById('createPassword').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        if (response.ok) {
            createForm.reset();
            loadUsers();
        }
    } catch (error) {
        console.error('Error al crear usuario:', error);
    }
});

// Delete User
window.deleteUser = async function (id) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadUsers();
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
        }
    }
}

checkAuth();
