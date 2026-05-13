package backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    public static Connection conectar() {
        Connection con = null;
        try {
            // Asegúrate de tener el archivo sqlite-jdbc.jar en tu classpath
            String url = "jdbc:sqlite:usuarios.db";
            con = DriverManager.getConnection(url);
        } catch (SQLException e) {
            System.out.println("Error de conexión: " + e.getMessage());
        }
        return con;
    }
}
