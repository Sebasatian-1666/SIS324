import java.sql.*;

public class UsuarioDAO {
    
    // CREATE: Registrar un nuevo usuario
    public boolean registrar(String user, String pass) {
        String sql = "INSERT INTO usuarios(username, password) VALUES(?, ?)";
        try (Connection conn = Conexion.conectar();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user);
            pstmt.setString(2, pass);
            pstmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            return false; // Error (ej: el usuario ya existe)
        }
    }

    // READ: Validar Login
    public boolean login(String user, String pass) {
        String sql = "SELECT * FROM usuarios WHERE username = ? AND password = ?";
        try (Connection conn = Conexion.conectar();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user);
            pstmt.setString(2, pass);
            ResultSet rs = pstmt.executeQuery();
            return rs.next(); // Retorna true si encontró coincidencia
        } catch (SQLException e) {
            return false;
        }
    }

    // DELETE: Borrar un usuario (Parte del CRUD)
    public boolean eliminar(String user) {
        String sql = "DELETE FROM usuarios WHERE username = ?";
        try (Connection conn = Conexion.conectar();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user);
            int filasAffected = pstmt.executeUpdate();
            return filasAffected > 0;
        } catch (SQLException e) {
            return false;
        }
    }
}