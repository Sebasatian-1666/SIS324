package backend;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CalificacionDAO {

    public void crearTabla() {
        String sql = "CREATE TABLE IF NOT EXISTS calificaciones ("
                   + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                   + "producto_id INTEGER NOT NULL, "
                   + "usuario_id INTEGER NOT NULL, "
                   + "usuario_nombre TEXT NOT NULL, "
                   + "puntuacion INTEGER NOT NULL, "
                   + "comentario TEXT NOT NULL, "
                   + "fecha TEXT NOT NULL, "
                   + "UNIQUE(producto_id, usuario_id)"   // un usuario, una calificación por producto
                   + ");";
        try (Connection con = Conexion.conectar();
             Statement stmt = con.createStatement()) {
            stmt.execute(sql);
            System.out.println("Tabla 'calificaciones' verificada/creada en SQLite.");
        } catch (SQLException e) {
            System.out.println("Error al crear tabla calificaciones: " + e.getMessage());
        }
    }

    public boolean registrar(Calificacion c) {
        // INSERT OR REPLACE permite actualizar si el usuario ya calificó ese producto
        String sql = "INSERT OR REPLACE INTO calificaciones "
                   + "(producto_id, usuario_id, usuario_nombre, puntuacion, comentario, fecha) "
                   + "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, c.getProductoId());
            ps.setInt(2, c.getUsuarioId());
            ps.setString(3, c.getUsuarioNombre());
            ps.setInt(4, c.getPuntuacion());
            ps.setString(5, c.getComentario());
            ps.setString(6, c.getFecha());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Error al registrar calificacion: " + e.getMessage());
            return false;
        }
    }

    public List<Calificacion> listarPorProducto(int productoId) {
        List<Calificacion> lista = new ArrayList<>();
        String sql = "SELECT * FROM calificaciones WHERE producto_id=? ORDER BY id DESC";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, productoId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Calificacion c = new Calificacion(
                        rs.getInt("producto_id"),
                        rs.getInt("usuario_id"),
                        rs.getString("usuario_nombre"),
                        rs.getInt("puntuacion"),
                        rs.getString("comentario"),
                        rs.getString("fecha")
                    );
                    c.setId(rs.getInt("id"));
                    lista.add(c);
                }
            }
        } catch (SQLException e) {
            System.out.println("Error al listar calificaciones: " + e.getMessage());
        }
        return lista;
    }

    /** Promedio de puntuación para un producto (0.0 si no hay calificaciones) */
    public double promedioPorProducto(int productoId) {
        String sql = "SELECT AVG(puntuacion) FROM calificaciones WHERE producto_id=?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, productoId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getDouble(1);
            }
        } catch (SQLException e) {
            System.out.println("Error al calcular promedio: " + e.getMessage());
        }
        return 0.0;
    }
}
