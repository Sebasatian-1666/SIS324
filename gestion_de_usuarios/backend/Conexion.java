package backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    public static Connection conectar() {
        Connection con = null;
        try {
            Class.forName("org.sqlite.JDBC");
            // Asegura que la BD se guarde en la raíz del contenedor/proyecto de forma consistente
            String url = "jdbc:sqlite:app_database.db"; 
            con = DriverManager.getConnection(url);
        } catch (ClassNotFoundException e) {
            System.out.println("Error: ¡No se encontró el archivo JAR de SQLite! " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("Error de conexión: " + e.getMessage());
        }
        return con;
    }
}