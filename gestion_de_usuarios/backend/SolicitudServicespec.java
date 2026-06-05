import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Especificación de Pruebas para Gestión de Solicitudes - Sprint 3")
public class SolicitudServiceSpec {

    private SolicitudDAO solicitudDAO;
    private ProductoDAO productoDAO;
    private int idProductoPrueba;
    private int idOfertantePrueba = 1;   // ID simulado del usuario que oferta
    private int idDemandantePrueba = 2;  // ID simulado del usuario que solicita

    @BeforeEach
    public void setUp() {
        solicitudDAO = new SolicitudDAO();
        productoDAO = new ProductoDAO();

        // 1. Inicializamos las tablas para asegurar que existan en el entorno de pruebas
        productoDAO.crearTabla();
        solicitudDAO.crearTabla();

        // 2. Registramos un producto base para las pruebas de solicitudes
        Producto p = new Producto();
        p.setTitulo("Servicio de Limpieza");
        p.setDescripcion("Limpieza profunda de oficinas e inmuebles");
        p.setPrecio(150.0);
        p.setCategoria("Hogar");
        p.setTipo("SERVICIO");
        p.setOfertanteId(idOfertantePrueba);

        productoDAO.registrar(p);

        // Recuperamos el ID del producto recién creado para asociarlo en los tests
        List<Producto> misProductos = productoDAO.listarPorOfertante(idOfertantePrueba);
        if (!misProductos.isEmpty()) {
            idProductoPrueba = misProductos.get(0).getId();
        }
    }

    @Test
    @DisplayName("F2: Debería registrar una solicitud exitosamente con estado PENDIENTE")
    public void testRegistrarSolicitudPendiente() {
        // Arrange
        Solicitud nuevaSolicitud = new Solicitud(idProductoPrueba, idDemandantePrueba, "Requiero el servicio el día sábado por la mañana.");

        // Act
        boolean registrado = solicitudDAO.registrar(nuevaSolicitud);

        // Assert
        assertTrue(registrado, "La solicitud debería registrarse de forma exitosa en la base de datos.");
        
        List<Solicitud> solicitudesRecibidas = solicitudDAO.listarPorOfertante(idOfertantePrueba);
        assertFalse(solicitudesRecibidas.isEmpty(), "El ofertante debería tener al menos una solicitud en su lista.");
        
        Solicitud guardada = solicitudesRecibidas.get(0);
        assertEquals("PENDIENTE", guardada.getEstado(), "Toda solicitud nueva debe iniciar en estado PENDIENTE.");
        assertEquals("Requiero el servicio el día sábado por la mañana.", guardada.getNotas());
    }

    @Test
    @DisplayName("F1: Debería incrementar el contador de solicitudes del producto al registrar un pedido")
    public void testIncrementarContadorSolicitudes() {
        // Arrange
        Producto antes = productoDAO.buscarPorId(idProductoPrueba);
        int contadorInicial = antes != null ? antes.getContadorSolicitudes() : 0;
        
        Solicitud nuevaSolicitud = new Solicitud(idProductoPrueba, idDemandantePrueba, "Pedido de prueba para verificar contador.");

        // Act
        boolean registrado = solicitudDAO.registrar(nuevaSolicitud);

        // Assert
        assertTrue(registrado);
        Producto despues = productoDAO.buscarPorId(idProductoPrueba);
        assertNotNull(despues);
        assertEquals(contadorInicial + 1, despues.getContadorSolicitudes(), 
                "El contador_solicitudes del producto debió incrementarse en 1 unidad de forma transaccional.");
    }

    @Test
    @DisplayName("F3: Debería permitir al ofertante ACEPTAR una solicitud pendiente")
    public void testOfertanteAceptaSolicitud() {
        // Arrange
        Solicitud nuevaSolicitud = new Solicitud(idProductoPrueba, idDemandantePrueba, "Trato urgente.");
        solicitudDAO.registrar(nuevaSolicitud);
        
        List<Solicitud> lista = solicitudDAO.listarPorOfertante(idOfertantePrueba);
        int idSolicitudGuardada = lista.get(0).getId();

        // Act
        boolean respondido = solicitudDAO.responder(idSolicitudGuardada, "ACEPTADA");

        // Assert
        assertTrue(respondido, "El DAO debería confirmar la actualización del estado.");
        
        List<Solicitud> listaActualizada = solicitudDAO.listarPorOfertante(idOfertantePrueba);
        assertEquals("ACEPTADA", listaActualizada.get(0).getEstado(), "El estado de la solicitud debió cambiar a ACEPTADA.");
    }

    @Test
    @DisplayName("F3: Debería permitir al ofertante RECHAZAR una solicitud pendiente")
    public void testOfertanteRechazaSolicitud() {
        // Arrange
        Solicitud nuevaSolicitud = new Solicitud(idProductoPrueba, idDemandantePrueba, "Prueba de rechazo.");
        solicitudDAO.registrar(nuevaSolicitud);
        
        List<Solicitud> lista = solicitudDAO.listarPorOfertante(idOfertantePrueba);
        int idSolicitudGuardada = lista.get(0).getId();

        // Act
        boolean respondido = solicitudDAO.responder(idSolicitudGuardada, "RECHAZADA");

        // Assert
        assertTrue(respondido);
        
        List<Solicitud> listaActualizada = solicitudDAO.listarPorOfertante(idOfertantePrueba);
        assertEquals("RECHAZADA", listaActualizada.get(0).getEstado(), "El estado de la solicitud debió cambiar a RECHAZADA.");
    }
}