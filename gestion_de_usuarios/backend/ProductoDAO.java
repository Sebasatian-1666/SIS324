package backend;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO de Productos/Servicios - Sprint 2
 * Usa SQLite + JDBC puro, igual que UsuarioDAO.
 *
 * Métodos:
 *   crearTabla()          → crea tabla si no existe (llama al iniciar)
 *   registrar(Producto)   → HU-01: inserta con estado PENDIENTE
 *   listar()              → lista todos
 *   listarPendientes()    → HU-03: solo estado PENDIENTE
 *   listarAprobados()     → catálogo público
 *   listarPorOfertante()  → mis productos
 *   buscarPorId()         → un producto
 *   actualizar(Producto)  → HU-02: edita y resetea a PENDIENTE si campos críticos cambiaron
 *   validar(id, decision, motivo) → HU-03: Admin aprueba o rechaza
 *   eliminar(id)          → HU-02: elimina
 */
public class ProductoDAO {

    // ── Inicialización de tabla ──────────────────────────────────────────
    public void crearTabla() {
        String sql = "CREATE TABLE IF NOT EXISTS productos ("
                + " id INTEGER PRIMARY KEY AUTOINCREMENT,"
                + " titulo TEXT NOT NULL,"
                + " descripcion TEXT NOT NULL,"
                + " precio REAL NOT NULL,"
                + " categoria TEXT NOT NULL,"
                + " tipo TEXT DEFAULT 'PRODUCTO',"
                + " estado TEXT NOT NULL DEFAULT 'PENDIENTE',"
                + " motivo_rechazo TEXT,"
                + " ofertante_id INTEGER NOT NULL,"
                + " FOREIGN KEY (ofertante_id) REFERENCES usuarios(id)"
                + ");";
        try (Connection con = Conexion.conectar();
             Statement stmt = con.createStatement()) {
            stmt.execute(sql);
            System.out.println("Tabla 'productos' verificada/creada en SQLite.");
        } catch (Exception e) {
            System.out.println("Error creando tabla productos: " + e.getMessage());
        }
    }

    // ── HU-01: Registrar Producto (estado siempre PENDIENTE) ─────────────
    public boolean registrar(Producto p) {
        String sql = "INSERT INTO productos (titulo, descripcion, precio, categoria, tipo, estado, ofertante_id) "
                + "VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, p.getTitulo());
            ps.setString(2, p.getDescripcion());
            ps.setDouble(3, p.getPrecio());
            ps.setString(4, p.getCategoria());
            ps.setString(5, p.getTipo() != null ? p.getTipo() : "PRODUCTO");
            ps.setInt(6, p.getOfertanteId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Error al registrar producto: " + e.getMessage());
            return false;
        }
    }

    // ── HU-02: Editar Producto ────────────────────────────────────────────
    // Si título, descripción o precio cambian → vuelve a PENDIENTE
    public boolean actualizar(Producto nuevo) {
        // Primero obtenemos el estado actual para comparar
        Producto actual = buscarPorId(nuevo.getId());
        if (actual == null) return false;

        boolean cambiosCriticos =
                !actual.getTitulo().equals(nuevo.getTitulo())            ||
                !actual.getDescripcion().equals(nuevo.getDescripcion())  ||
                actual.getPrecio() != nuevo.getPrecio();

        String nuevoEstado = cambiosCriticos ? "PENDIENTE" : actual.getEstado();
        String nuevoMotivo = cambiosCriticos ? null : actual.getMotivoRechazo();

        String sql = "UPDATE productos SET titulo=?, descripcion=?, precio=?, "
                + "categoria=?, tipo=?, estado=?, motivo_rechazo=? WHERE id=?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, nuevo.getTitulo());
            ps.setString(2, nuevo.getDescripcion());
            ps.setDouble(3, nuevo.getPrecio());
            ps.setString(4, nuevo.getCategoria());
            ps.setString(5, nuevo.getTipo());
            ps.setString(6, nuevoEstado);
            ps.setString(7, nuevoMotivo);
            ps.setInt(8, nuevo.getId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Error al actualizar producto: " + e.getMessage());
            return false;
        }
    }

    // ── HU-02: Eliminar Producto ──────────────────────────────────────────
    public boolean eliminar(int id) {
        String sql = "DELETE FROM productos WHERE id=?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Error al eliminar producto: " + e.getMessage());
            return false;
        }
    }

    // ── HU-03: Validar Producto (Admin aprueba o rechaza) ─────────────────
    public boolean validar(int id, String decision, String motivoRechazo) {
        // Solo se puede validar si está PENDIENTE
        Producto actual = buscarPorId(id);
        if (actual == null) return false;
        if (!"PENDIENTE".equals(actual.getEstado())) {
            System.out.println("Solo se pueden validar productos en estado PENDIENTE.");
            return false;
        }

        String sql = "UPDATE productos SET estado=?, motivo_rechazo=? WHERE id=?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, decision);
            ps.setString(2, "RECHAZADO".equals(decision) ? motivoRechazo : null);
            ps.setInt(3, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Error al validar producto: " + e.getMessage());
            return false;
        }
    }

    // ── Consultas ─────────────────────────────────────────────────────────

    public List<Producto> listar() {
        return listarConFiltro(null);
    }

    public List<Producto> listarPendientes() {
        return listarConFiltro("PENDIENTE");
    }

    public List<Producto> listarAprobados() {
        return listarConFiltro("APROBADO");
    }

    public List<Producto> listarPorOfertante(int ofertanteId) {
        List<Producto> lista = new ArrayList<>();
        String sql = "SELECT p.*, u.nombre as ofertante_nombre "
                + "FROM productos p "
                + "JOIN usuarios u ON p.ofertante_id = u.id "
                + "WHERE p.ofertante_id = ? "
                + "ORDER BY p.id DESC";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, ofertanteId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        } catch (SQLException e) {
            System.out.println("Error al listar por ofertante: " + e.getMessage());
        }
        return lista;
    }

    public Producto buscarPorId(int id) {
        String sql = "SELECT p.*, u.nombre as ofertante_nombre "
                + "FROM productos p "
                + "JOIN usuarios u ON p.ofertante_id = u.id "
                + "WHERE p.id=?";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        } catch (SQLException e) {
            System.out.println("Error al buscar producto: " + e.getMessage());
        }
        return null;
    }

    // ── Helpers internos ──────────────────────────────────────────────────

    private List<Producto> listarConFiltro(String estado) {
        List<Producto> lista = new ArrayList<>();
        String sql = "SELECT p.*, u.nombre as ofertante_nombre "
                + "FROM productos p "
                + "JOIN usuarios u ON p.ofertante_id = u.id "
                + (estado != null ? "WHERE p.estado = ? " : "")
                + "ORDER BY p.id DESC";
        try (Connection con = Conexion.conectar();
             PreparedStatement ps = con.prepareStatement(sql)) {
            if (estado != null) ps.setString(1, estado);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        } catch (SQLException e) {
            System.out.println("Error al listar: " + e.getMessage());
        }
        return lista;
    }

    private Producto mapear(ResultSet rs) throws SQLException {
        return new Producto(
                rs.getInt("id"),
                rs.getString("titulo"),
                rs.getString("descripcion"),
                rs.getDouble("precio"),
                rs.getString("categoria"),
                rs.getString("tipo"),
                rs.getString("estado"),
                rs.getString("motivo_rechazo"),
                rs.getInt("ofertante_id"),
                rs.getString("ofertante_nombre")
        );
    }
}
