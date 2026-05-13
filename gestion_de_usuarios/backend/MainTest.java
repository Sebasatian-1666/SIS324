package backend;

import java.sql.Connection;
import java.sql.Statement;

public class MainTest {
    public static void main(String[] args) {
        // 1. Crear tabla si no existe (Útil para pruebas rápidas)
        crearTabla();

        UsuarioDAO dao = new UsuarioDAO();

        // 2. Probar Crear
        System.out.println("Intentando registrar un usuario...");
        Usuario nuevo = new Usuario(0, "Juan Perez", "juan@test.com", "123456");
        if(dao.registrar(nuevo)) {
            System.out.println("--> Usuario registrado exitosamente.");
        } else {
            System.out.println("--> El usuario podría ya existir (el email debe ser único).");
        }

        // 3. Probar Login
        System.out.println("\nIntentando hacer login...");
        Usuario logueado = dao.login("juan@test.com", "123456");
        if(logueado != null) {
            System.out.println("--> Login correcto. Bienvenido " + logueado.getNombre() + " (ID: " + logueado.getId() + ")");
        } else {
            System.out.println("--> Login fallido. Credenciales incorrectas.");
        }

        // 4. Listar Usuarios
        System.out.println("\nLista de usuarios en la base de datos:");
        for(Usuario u : dao.listar()) {
            System.out.println(" - ID " + u.getId() + ": " + u.getNombre() + " (" + u.getEmail() + ")");
        }
    }

    private static void crearTabla() {
        String sql = "CREATE TABLE IF NOT EXISTS usuarios ("
                   + " id INTEGER PRIMARY KEY AUTOINCREMENT,"
                   + " nombre TEXT NOT NULL,"
                   + " email TEXT NOT NULL UNIQUE,"
                   + " password TEXT NOT NULL"
                   + ");";
        try (Connection con = Conexion.conectar();
             Statement stmt = con.createStatement()) {
            stmt.execute(sql);
            System.out.println("Tabla 'usuarios' verificada/creada en SQLite.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
