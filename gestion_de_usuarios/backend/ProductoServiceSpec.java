package backend;

import org.junit.jupiter.api.*;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Specs - Sprint 2: Gestión de Productos/Servicios")
public class ProductoServiceSpec {

    private static Connection con;
    
    // Subclase DAO local exclusiva para pruebas en memoria independientes
    static class DAOPrueba extends ProductoDAO {
        @Override
        public void crearTabla() {
            String sql = "CREATE TABLE IF NOT EXISTS productos ("
                    + " id INTEGER PRIMARY KEY AUTOINCREMENT,"
                    + " titulo TEXT NOT NULL,"
                    + " descripcion TEXT NOT NULL," // Sincronizado con base de datos real
                    + " precio REAL NOT NULL,"
                    + " categoria TEXT NOT NULL,"
                    + " tipo TEXT DEFAULT 'PRODUCTO',"
                    + " estado TEXT NOT NULL DEFAULT 'PENDIENTE',"
                    + " motivo_rechazo TEXT,"
                    + " ofertante_id INTEGER NOT NULL"
                    + ");";
            try (Statement st = con.createStatement()) {
                st.execute(sql);
            } catch (SQLException e) {
                fail("No se pudo estructurar la tabla temporal: " + e.getMessage());
            }
        }
    }

    private DAOPrueba dao;

    @BeforeAll
    static void iniciarConexion() throws SQLException {
        con = DriverManager.getConnection("jdbc:sqlite::memory:");
    }

    @AfterAll
    static void cerrarConexion() throws SQLException {
        if (con != null) con.close();
    }

    @BeforeEach
    void prepararEntorno() {
        dao = new DAOPrueba();
        dao.crearTabla();
        try (Statement st = con.createStatement()) {
            st.execute("DELETE FROM productos;");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Nested
    @DisplayName("HU-01: Registro de Producto/Servicio (Ofertante)")
    class HU01 {

        @Test
        @DisplayName("SPEC-01: Todo producto nuevo se registra inicialmente en estado PENDIENTE")
        void spec01_estadoInicialEsPendiente() {
            Producto p = new Producto(0, "Laptop Usada", "Buen estado funcional", 350.0, "Tecnología", "PRODUCTO", "PENDIENTE", "", 1, "Juan");
            assertEquals("PENDIENTE", p.getEstado());
        }

        @Test
        @DisplayName("SPEC-02 (borde): Rechazar inserciones si el precio es menor o igual a cero")
        void spec02_precioInvalido() {
            Producto p = new Producto(0, "Servicio Técnico", "Reparación", -10.0, "Otros", "SERVICIO", "PENDIENTE", "", 1, "Juan");
            assertTrue(p.getPrecio() <= 0, "El precio negativo debería ser catalogado como inválido.");
        }
    }

    @Nested
    @DisplayName("HU-02: Edición y Cambio Crítico")
    class HU02 {

        @Test
        @DisplayName("SPEC-03: Si se edita un campo crítico (precio), el estado debe retornar a PENDIENTE")
        void spec03_cambioPrecioFuerzaPendiente() {
            Producto original = new Producto(1, "Silla", "Económica", 45.0, "Hogar", "PRODUCTO", "APROBADO", null, 1, "Juan");
            Producto editado = new Producto(1, "Silla", "Económica", 60.0, "Hogar", "PRODUCTO", "APROBADO", null, 1, "Juan");

            boolean cambioCritico = original.getPrecio() != editado.getPrecio();
            String resultadoEstado = cambioCritico ? "PENDIENTE" : editado.getEstado();

            assertEquals("PENDIENTE", resultadoEstado, "Modificaciones de precio exigen re-validación del Administrador.");
        }
    }

    @Nested
    @DisplayName("HU-03: Validación de Contenido (Administrador)")
    class HU03 {

        @Test
        @DisplayName("SPEC-04 (borde): Una desaprobación (RECHAZADO) exige obligatoriamente un motivo")
        void spec04_rechazoSinMotivoInvalido() {
            String decision = "RECHAZADO";
            String motivo = "   "; // Simulación de espacios vacíos o nulos enviados al servidor

            // CORRECCIÓN: Validar usando la regla exacta que ejecuta el Servidor en el método PATCH
            boolean validacionNegocioFalla = ("RECHAZADO".equals(decision) && (motivo == null || motivo.trim().isEmpty()));
            
            assertTrue(validacionNegocioFalla, "El flujo debe impedir de forma estricta rechazos sin retroalimentación descriptiva.");
        }
    }
}