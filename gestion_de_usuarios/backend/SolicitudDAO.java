import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO de Solicitudes - Sprint 3
 */
public class SolicitudDAO {

    public void crearTabla() {
        String sql = "CREATE TABLE IF NOT EXISTS solicitudes ("
                + " id INTEGER PRIMARY KEY AUTOINCREMENT,"
                + " producto_id INTEGER NOT NULL,"
                + " demandante_id INTEGER NOT NULL,"
                + " fecha TEXT NOT NULL,"
                + " estado TEXT NOT NULL DEFAULT 'PENDIENTE',"
                + " notas TEXT,"
                + " FOREIGN KEY(producto_id) REFERENCES productos(id),"
                + " FOREIGN KEY(demandante_id) REFERENCES usuarios(id)"
                + ");";
        try (Connection con = Conexion.conectar(); Statement stmt = con.createStatement()) {
            stmt.execute(sql);
            System.out.println("Tabla 'solicitudes' verificada/creada en SQLite.");
        } catch (SQLException e) {
            System.out.println("Error al crear tabla solicitudes: " + e.getMessage());
        }
    }

    // Registrar Solicitud e Incrementar contador de uso automáticamente
    public boolean registrar(Solicitud s) {
        String sqlInsert = "INSERT INTO solicitudes (producto_id, demandante_id, fecha, estado, notas) "
                + "VALUES (?, ?, datetime('now', 'localtime'), 'PENDIENTE', ?)";
        String sqlUpdateContador = "UPDATE productos SET contador_solicitudes = contador_solicitudes + 1 WHERE id = ?";
        
        try (Connection con = Conexion.conectar()) {
            con.setAutoCommit(false); // Transacción segura para ambos cambios
            
            try (PreparedStatement ps1 = con.prepareStatement(sqlInsert);
                 PreparedStatement ps2 = con.prepareStatement(sqlUpdateContador)) {
                
                ps1.setInt(1, s.getProductoId());
                ps1.setInt(2, s.getDemandanteId());
                ps1.setString(3, s.getNotas());
                int res1 = ps1.executeUpdate();
                
                ps2.setInt(1, s.getProductoId());
                ps2.executeUpdate();
                
                con.commit();
                return res1 > 0;
            } catch (SQLException e) {
                con.rollback();
                System.out.println("Error en transacción de solicitud: " + e.getMessage());
                return false;
            }
        } catch (SQLException e) {
            System.out.println("Error de conexión en SolicitudDAO: " + e.getMessage());
            return false;
        }
    }

    // Listar solicitudes recibidas por el Ofertante
    public List<Solicitud> listarPorOfertante(int ofertanteId) {
        List<Solicitud> lista = new ArrayList<>();
        String sql = "SELECT s.*, p.titulo as producto_titulo, u.nombre as demandante_nombre "
                + "FROM solicitudes s "
                + "JOIN productos p ON s.producto_id = p.id "
                + "JOIN usuarios u ON s.demandante_id = u.id "
                + "WHERE p.ofertante_id = ? "
                + "ORDER BY s.id DESC";
        try (Connection con = Conexion.conectar(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, ofertanteId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Solicitud(
                        rs.getInt("id"),
                        rs.getInt("producto_id"),
                        rs.getInt("demandante_id"),
                        rs.getString("fecha"),
                        rs.getString("estado"),
                        rs.getString("notas"),
                        rs.getString("producto_titulo"),
                        rs.getString("demandante_nombre")
                    ));
                }
            }
        } catch (SQLException e) {
            System.out.println("Error al listar solicitudes: " + e.getMessage());
        }
        return lista;
    }

    // Aceptar o Rechazar la solicitud
    public boolean responder(int id, String nuevoEstado) {
        String sql = "UPDATE solicitudes SET estado = ? WHERE id = ?";
        try (Connection con = Conexion.conectar(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, nuevoEstado);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Error al responder solicitud: " + e.getMessage());
            return false;
        }
    }
}