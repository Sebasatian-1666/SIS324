import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class Conexion {
    private static final String URL = "jdbc:sqlite:db/usuarios.db";

    public static Connection conectar() {
        Connection conn = null;
        try {
            // 1. Forzar la carga del Driver (Esto quita el error de "No suitable driver")
            Class.forName("org.sqlite.JDBC");

            // 2. Crear carpeta db si no existe
            File directorio = new File("db");
            if (!directorio.exists()) {
                directorio.mkdir();
            }

            // 3. Conectar
            conn = DriverManager.getConnection(URL);
            crearTabla(conn);
        } catch (ClassNotFoundException e) {
            System.out.println("ERROR: No se encontró el archivo .jar en Referenced Libraries");
        } catch (SQLException e) {
            System.out.println("Error al conectar: " + e.getMessage());
        }
        return conn;
    }

    private static void crearTabla(Connection conn) {
        String sql = "CREATE TABLE IF NOT EXISTS usuarios ("
                   + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                   + "username TEXT NOT NULL UNIQUE,"
                   + "password TEXT NOT NULL"
                   + ");";
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            System.out.println("Error al crear tabla: " + e.getMessage());
        }
    }
}