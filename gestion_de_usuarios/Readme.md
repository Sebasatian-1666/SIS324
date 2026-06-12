# Gestión de Usuarios — Sprint 3

**Integrantes:**
* Aillón Piccolomini Sebastian — Ing. CICO
* Andrade Mallco Aaron — Ing. CICO
* Villarroel Tarraga Carlos Matias — Ing. CICO

## Cómo ejecutar

**1. Compilar (solo la primera vez o tras cambios en el backend):**
```
mkdir out
javac -cp "lib\*" -d out backend\Servidor.java backend\Conexion.java backend\Usuario.java backend\UsuarioDAO.java backend\Producto.java backend\ProductoDAO.java backend\Solicitud.java backend\SolicitudDAO.java backend\Calificacion.java backend\CalificacionDAO.java
```

**2. Iniciar el servidor:**
```
java -cp "out;lib\*" backend.Servidor
```

**3. Abrir en el navegador:**
```
http://localhost:8080
```

> ⚠️ Si es la primera vez o quieres empezar desde cero, elimina el archivo `app_database.db` antes de iniciar el servidor. Se creará automáticamente con el admin ya incluido.

## Usuario administrador por defecto
| Email | Contraseña |
|---|---|
| admin@test.com | admin123 |

## Roles
| Rol | Acceso |
|---|---|
| ADMINISTRADOR | Todo: usuarios, productos, panel admin, catálogo |
| OFERTANTE | Mis Productos + Catálogo |
| DEMANDANTE | Solo Catálogo |
