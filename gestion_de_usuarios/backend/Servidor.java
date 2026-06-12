package backend;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class Servidor {

    private static final ProductoDAO      prodDAO  = new ProductoDAO();
    private static final UsuarioDAO       userDAO  = new UsuarioDAO();
    private static final SolicitudDAO     solDAO   = new SolicitudDAO();
    private static final CalificacionDAO  calDAO   = new CalificacionDAO();
    private static final ObjectMapper     mapper   = new ObjectMapper();

    public static void main(String[] args) throws IOException {
        System.out.println("Iniciando componentes del servidor...");

        prodDAO.crearTabla();
        userDAO.crearTabla();
        solDAO.crearTabla();
        calDAO.crearTabla();
        sembrarAdminSiNoExiste();

        String portEnv = System.getenv("PORT");
        int puerto = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;

        HttpServer server = HttpServer.create(new InetSocketAddress(puerto), 0);
        server.createContext("/",                    new StaticHandler());
        server.createContext("/api/productos",       new ProductosHandler());
        server.createContext("/api/usuarios",        new UsuariosHandler());
        server.createContext("/api/usuarios/login",  new LoginHandler());
        server.createContext("/api/solicitudes",     new SolicitudesHandler());
        server.createContext("/api/calificaciones",  new CalificacionesHandler());

        server.setExecutor(null);
        System.out.println("Servidor HTTP corriendo en el puerto: " + puerto);
        server.start();
    }

    // ── Siembra el admin por defecto si no hay ningún ADMINISTRADOR ─────
    private static void sembrarAdminSiNoExiste() {
        List<Usuario> todos = userDAO.listar();
        boolean tieneAdmin = todos.stream()
            .anyMatch(u -> "ADMINISTRADOR".equals(u.getRol()));
        if (!tieneAdmin) {
            Usuario admin = new Usuario("Administrador", "admin@test.com", "admin123", "ADMINISTRADOR");
            userDAO.registrar(admin);
            System.out.println("Admin semilla creado: admin@test.com / admin123");
        }
    }

    // ── Archivos estáticos (frontend/) ───────────────────────────────────
    static class StaticHandler implements HttpHandler {
        private static final File FRONTEND = new File("frontend");
        @Override
        public void handle(HttpExchange ex) throws IOException {
            configurarCORS(ex);
            if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) { ex.sendResponseHeaders(204,-1); return; }

            String path = ex.getRequestURI().getPath();
            if (path.equals("/") || path.isEmpty()) path = "/index.html";

            File archivo = new File(FRONTEND, path);
            if (!archivo.getCanonicalPath().startsWith(FRONTEND.getCanonicalPath())) {
                ex.sendResponseHeaders(403, -1); return;
            }
            if (!archivo.exists() || !archivo.isFile()) {
                byte[] b = "404".getBytes(StandardCharsets.UTF_8);
                ex.sendResponseHeaders(404, b.length); ex.getResponseBody().write(b); ex.getResponseBody().close(); return;
            }
            String ct = "application/octet-stream";
            if (archivo.getName().endsWith(".html")) ct = "text/html; charset=UTF-8";
            else if (archivo.getName().endsWith(".js")) ct = "application/javascript; charset=UTF-8";
            else if (archivo.getName().endsWith(".css")) ct = "text/css; charset=UTF-8";
            byte[] bytes = java.nio.file.Files.readAllBytes(archivo.toPath());
            ex.getResponseHeaders().set("Content-Type", ct);
            ex.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
        }
    }

    // ── Productos ────────────────────────────────────────────────────────
    static class ProductosHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            configurarCORS(ex);
            String metodo = ex.getRequestMethod();
            String query  = ex.getRequestURI().getQuery();
            if ("OPTIONS".equalsIgnoreCase(metodo)) { ex.sendResponseHeaders(204,-1); return; }
            try {
                if ("GET".equalsIgnoreCase(metodo)) {
                    List<Producto> lista;
                    if (query != null && query.contains("estado=PENDIENTE")) {
                        lista = prodDAO.listarPendientes();
                    } else if (query != null && query.contains("ofertanteId=")) {
                        int id = Integer.parseInt(query.split("ofertanteId=")[1].split("&")[0]);
                        lista = prodDAO.listarPorOfertante(id);
                    } else if (query != null && query.contains("orden=")) {
                        String orden = query.split("orden=")[1].split("&")[0];
                        lista = prodDAO.listarAprobadosConFiltro(orden);
                    } else if (query != null && query.contains("id=")) {
                        int id = Integer.parseInt(query.split("id=")[1].split("&")[0]);
                        Producto p = prodDAO.buscarPorId(id);
                        if (p == null) { enviarTexto(ex, 200, "No hay productos con ese ID"); return; }
                        enviarJSON(ex, 200, mapper.writeValueAsString(p)); return;
                    } else {
                        lista = prodDAO.listarAprobadosConFiltro("recientes");
                    }
                    if (lista == null || lista.isEmpty()) enviarTexto(ex, 200, "No hay productos registrados");
                    else enviarJSON(ex, 200, mapper.writeValueAsString(lista));

                } else if ("POST".equalsIgnoreCase(metodo)) {
                    Producto p = mapper.readValue(ex.getRequestBody(), Producto.class);
                    p.setEstado("PENDIENTE");
                    if (p.getOfertanteId() <= 0) {
                        enviarJSON(ex, 400, "{\"error\":\"ofertanteId inválido\"}"); return;
                    }
                    boolean ok = prodDAO.registrar(p);
                    enviarJSON(ex, ok ? 201 : 400, "{\"success\":" + ok + "}");

                } else if ("PUT".equalsIgnoreCase(metodo)) {
                    Producto p = mapper.readValue(ex.getRequestBody(), Producto.class);
                    if (p.getId() <= 0) { enviarJSON(ex, 400, "{\"error\":\"ID obligatorio\"}"); return; }
                    boolean ok = prodDAO.actualizar(p);
                    enviarJSON(ex, ok ? 200 : 400, "{\"success\":" + ok + "}");

                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    if (query != null && query.contains("id=")) {
                        int id = Integer.parseInt(query.split("id=")[1].split("&")[0]);
                        boolean ok = prodDAO.eliminar(id);
                        enviarJSON(ex, ok ? 200 : 400, "{\"success\":" + ok + "}");
                    } else enviarJSON(ex, 400, "{\"error\":\"Falta ID\"}");

                } else if ("PATCH".equalsIgnoreCase(metodo)) {
                    @SuppressWarnings("unchecked")
                    Map<String,Object> body = mapper.readValue(ex.getRequestBody(), Map.class);
                    int id = (Integer) body.get("id");
                    String decision = (String) body.get("decision");
                    String motivo   = (String) body.get("motivoRechazo");
                    if ("RECHAZADO".equals(decision) && (motivo == null || motivo.trim().isEmpty())) {
                        enviarJSON(ex, 400, "{\"error\":\"El motivo de rechazo es obligatorio\"}"); return;
                    }
                    boolean ok = prodDAO.validar(id, decision, motivo);
                    enviarJSON(ex, ok ? 200 : 400, "{\"success\":" + ok + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                enviarJSON(ex, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ── Solicitudes ──────────────────────────────────────────────────────
    static class SolicitudesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            configurarCORS(ex);
            String metodo = ex.getRequestMethod();
            String query  = ex.getRequestURI().getQuery();
            if ("OPTIONS".equalsIgnoreCase(metodo)) { ex.sendResponseHeaders(204,-1); return; }
            try {
                if ("POST".equalsIgnoreCase(metodo)) {
                    Solicitud s = mapper.readValue(ex.getRequestBody(), Solicitud.class);
                    s.setEstado("PENDIENTE");
                    boolean ok = solDAO.registrar(s);
                    enviarJSON(ex, ok ? 201 : 400, "{\"success\":" + ok + "}");

                } else if ("GET".equalsIgnoreCase(metodo)) {
                    if (query != null && query.contains("ofertanteId=")) {
                        int id = Integer.parseInt(query.split("ofertanteId=")[1].split("&")[0]);
                        List<Solicitud> lista = solDAO.listarPorOfertante(id);
                        if (lista == null || lista.isEmpty()) enviarTexto(ex, 200, "No hay solicitudes");
                        else enviarJSON(ex, 200, mapper.writeValueAsString(lista));
                    } else enviarJSON(ex, 400, "{\"error\":\"Falta ofertanteId\"}");

                } else if ("PATCH".equalsIgnoreCase(metodo)) {
                    @SuppressWarnings("unchecked")
                    Map<String,Object> body = mapper.readValue(ex.getRequestBody(), Map.class);
                    int id = (Integer) body.get("id");
                    String estado = (String) body.get("estado");
                    if (!"ACEPTADA".equals(estado) && !"RECHAZADA".equals(estado)) {
                        enviarJSON(ex, 400, "{\"error\":\"Estado no válido\"}"); return;
                    }
                    boolean ok = solDAO.responder(id, estado);
                    enviarJSON(ex, ok ? 200 : 400, "{\"success\":" + ok + "}");
                } else enviarJSON(ex, 405, "{\"error\":\"Método no soportado\"}");
            } catch (Exception e) {
                e.printStackTrace();
                enviarJSON(ex, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ── Usuarios ─────────────────────────────────────────────────────────
    static class UsuariosHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            configurarCORS(ex);
            String metodo = ex.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(metodo)) { ex.sendResponseHeaders(204,-1); return; }
            try {
                if ("GET".equalsIgnoreCase(metodo)) {
                    List<Usuario> lista = userDAO.listar();
                    if (lista == null || lista.isEmpty()) enviarTexto(ex, 200, "No hay usuarios");
                    else enviarJSON(ex, 200, mapper.writeValueAsString(lista));

                } else if ("POST".equalsIgnoreCase(metodo)) {
                    Usuario u = mapper.readValue(ex.getRequestBody(), Usuario.class);
                    if (u.getRol() == null || u.getRol().isEmpty()) u.setRol("DEMANDANTE");
                    boolean ok = userDAO.registrar(u);
                    enviarJSON(ex, ok ? 201 : 400, "{\"success\":" + ok + "}");

                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    String query = ex.getRequestURI().getQuery();
                    if (query != null && query.contains("id=")) {
                        int id = Integer.parseInt(query.split("id=")[1].split("&")[0]);
                        boolean ok = userDAO.eliminar(id);
                        enviarJSON(ex, ok ? 200 : 400, "{\"mensaje\":\"" + (ok ? "Eliminado" : "Error") + "\"}");
                    } else enviarJSON(ex, 400, "{\"error\":\"Falta ID\"}");
                }
            } catch (Exception e) {
                enviarJSON(ex, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ── Login ─────────────────────────────────────────────────────────────
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            configurarCORS(ex);
            if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) { ex.sendResponseHeaders(204,-1); return; }
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) { enviarJSON(ex, 405, "{\"error\":\"Método no soportado\"}"); return; }
            try {
                @SuppressWarnings("unchecked")
                Map<String,String> body = mapper.readValue(ex.getRequestBody(), Map.class);
                Usuario u = userDAO.login(body.get("email"), body.get("password"));
                if (u != null) enviarJSON(ex, 200, mapper.writeValueAsString(u));
                else           enviarJSON(ex, 401, "{\"error\":\"Credenciales incorrectas\"}");
            } catch (Exception e) {
                enviarJSON(ex, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ── Calificaciones ────────────────────────────────────────────────────
    static class CalificacionesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            configurarCORS(ex);
            String metodo = ex.getRequestMethod();
            String query  = ex.getRequestURI().getQuery();
            if ("OPTIONS".equalsIgnoreCase(metodo)) { ex.sendResponseHeaders(204,-1); return; }
            try {
                if ("GET".equalsIgnoreCase(metodo)) {
                    if (query != null && query.contains("productoId=")) {
                        int pid = Integer.parseInt(query.split("productoId=")[1].split("&")[0]);
                        List<Calificacion> lista = calDAO.listarPorProducto(pid);
                        enviarJSON(ex, 200, mapper.writeValueAsString(lista));
                    } else enviarJSON(ex, 400, "{\"error\":\"Falta productoId\"}");

                } else if ("POST".equalsIgnoreCase(metodo)) {
                    @SuppressWarnings("unchecked")
                    Map<String,Object> body = mapper.readValue(ex.getRequestBody(), Map.class);
                    int productoId   = (Integer) body.get("productoId");
                    int usuarioId    = (Integer) body.get("usuarioId");
                    String nombre    = (String)  body.get("usuarioNombre");
                    int puntuacion   = (Integer) body.get("puntuacion");
                    String comentario= (String)  body.get("comentario");

                    if (puntuacion < 1 || puntuacion > 10) {
                        enviarJSON(ex, 400, "{\"error\":\"La puntuación debe ser entre 1 y 10\"}"); return;
                    }
                    // Limitar comentario a ~100 palabras
                    String[] palabras = comentario.trim().split("\\s+");
                    if (palabras.length > 100) {
                        enviarJSON(ex, 400, "{\"error\":\"El comentario no puede superar las 100 palabras\"}"); return;
                    }

                    String fecha = java.time.LocalDate.now().toString();
                    Calificacion c = new Calificacion(productoId, usuarioId, nombre, puntuacion, comentario, fecha);
                    boolean ok = calDAO.registrar(c);
                    enviarJSON(ex, ok ? 201 : 400, "{\"success\":" + ok + "}");
                } else enviarJSON(ex, 405, "{\"error\":\"Método no soportado\"}");
            } catch (Exception e) {
                e.printStackTrace();
                enviarJSON(ex, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private static void configurarCORS(HttpExchange ex) {
        ex.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }
    private static void enviarJSON(HttpExchange ex, int code, String json) throws IOException {
        byte[] b = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        ex.sendResponseHeaders(code, b.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(b); }
    }
    private static void enviarTexto(HttpExchange ex, int code, String txt) throws IOException {
        byte[] b = txt.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
        ex.sendResponseHeaders(code, b.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(b); }
    }
}
