@echo off
if not exist out mkdir out
javac -cp "lib\*" -d out backend\Servidor.java backend\Conexion.java backend\Usuario.java backend\UsuarioDAO.java backend\Producto.java backend\ProductoDAO.java backend\Solicitud.java backend\SolicitudDAO.java backend\Calificacion.java backend\CalificacionDAO.java
java -cp "out;lib\*" backend.Servidor