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

    private static final ProductoDAO prodDAO = new ProductoDAO();
    private static final UsuarioDAO userDAO = new UsuarioDAO();
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void main(String[] args) throws IOException {
        System.out.println("🔄 Iniciando componentes del servidor...");

        try {
            System.out.println("⏳ Inicializando tablas en la base de datos...");
            prodDAO.crearTabla();
            userDAO.crearTabla();
            System.out.println("✅ Tablas verificadas/creadas con éxito.");
        } catch (Exception e) {
            System.out.println("🚨 ERROR AL INICIALIZAR LA BASE DE DATOS:");
            e.printStackTrace();
            System.out.println("⚠️ El servidor intentará continuar levantándose de todos modos...");
        }

        String portEnv = System.getenv("PORT");
        int puerto = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;

        HttpServer server = HttpServer.create(new InetSocketAddress(puerto), 0);
        
        server.createContext("/", new RootHandler());
        server.createContext("/api/productos", new ProductosHandler());
        server.createContext("/api/usuarios", new UsuariosHandler());

        server.setExecutor(null);
        System.out.println("🚀 Servidor HTTP corriendo en el puerto: " + puerto);
        server.start();
    }

    // ─── PÁGINA PRINCIPAL (MENÚ) ───
    static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String html = "<!DOCTYPE html>" +
                          "<html lang='es'>" +
                          "<head>" +
                          "<meta charset='UTF-8'>" +
                          "<title>Menú Principal</title>" +
                          "<style>" +
                          "body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f4f4; }" +
                          "h1 { color: #333; }" +
                          "a { display: inline-block; margin: 10px; padding: 15px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }" +
                          "a:hover { background-color: #0056b3; }" +
                          "</style>" +
                          "</head>" +
                          "<body>" +
                          "<h1>Bienvenido a la Aplicación</h1>" +
                          "<p>Selecciona una opción para continuar:</p>" +
                          "<a href='/api/productos'>Ver Productos</a>" +
                          "<a href='/api/usuarios'>Ver Usuarios</a>" +
                          "</body>" +
                          "</html>";
            
            enviarRespuestaHTML(exchange, 200, html);
        }
    }

    // ─── HANDLER PRODUCTOS ───
    static class ProductosHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();
            String query = exchange.getRequestURI().getQuery();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                if ("GET".equalsIgnoreCase(metodo)) {
                    List<Producto> lista;
                    
                    if (query != null && query.contains("estado=PENDIENTE")) {
                        lista = prodDAO.listarPendientes();
                    } else if (query != null && query.contains("ofertanteId=")) {
                        int id = Integer.parseInt(query.split("ofertanteId=")[1].split("&")[0]);
                        lista = prodDAO.listarPorOfertante(id);
                    } else if (query != null && query.contains("id=")) {
                        int id = Integer.parseInt(query.split("id=")[1].split("&")[0]);
                        Producto p = prodDAO.buscarPorId(id);
                        if (p == null) {
                            enviarTextoPlano(exchange, 200, "No hay productos registrados con ese ID");
                            return;
                        }
                        enviarRespuesta(exchange, 200, mapper.writeValueAsString(p));
                        return;
                    } else {
                        lista = prodDAO.listarAprobados();
                    }

                    // CONTROL DE LISTA VACÍA PARA EVITAR LOS CORCHETES []
                    if (lista == null || lista.isEmpty()) {
                        enviarTextoPlano(exchange, 200, "No hay productos registrados");
                    } else {
                        enviarRespuesta(exchange, 200, mapper.writeValueAsString(lista));
                    }

                } else if ("POST".equalsIgnoreCase(metodo)) {
                    Producto p = mapper.readValue(exchange.getRequestBody(), Producto.class);
                    p.setEstado("PENDIENTE");
                    boolean ok = prodDAO.registrar(p);
                    enviarRespuesta(exchange, ok ? 201 : 400, "{\"success\":" + ok + "}");
                } else if ("PUT".equalsIgnoreCase(metodo)) {
                    Producto p = mapper.readValue(exchange.getRequestBody(), Producto.class);
                    if (p.getId() <= 0) {
                        enviarRespuesta(exchange, 400, "{\"error\":\"El ID del producto es obligatorio para actualizar\"}");
                        return;
                    }
                    boolean ok = prodDAO.actualizar(p);
                    enviarRespuesta(exchange, ok ? 200 : 400, "{\"success\":" + ok + "}");
                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    if (query != null && query.contains("id=")) {
                        int id = Integer.parseInt(query.split("id=")[1].split("&")[0]);
                        boolean ok = prodDAO.eliminar(id);
                        enviarRespuesta(exchange, ok ? 200 : 400, "{\"success\":" + ok + "}");
                    } else {
                        enviarRespuesta(exchange, 400, "{\"error\":\"Falta ID\"}");
                    }
                } else if ("PATCH".equalsIgnoreCase(metodo)) { 
                    @SuppressWarnings("unchecked")
                    Map<String, Object> body = mapper.readValue(exchange.getRequestBody(), Map.class);
                    int id = (Integer) body.get("id");
                    String decision = (String) body.get("decision");
                    String motivo = (String) body.get("motivoRechazo");
                    if ("RECHAZADO".equals(decision) && (motivo == null || motivo.trim().isEmpty())) {
                        enviarRespuesta(exchange, 400, "{\"error\":\"El motivo de rechazo es obligatorio\"}");
                        return;
                    }
                    boolean ok = prodDAO.validar(id, decision, motivo);
                    enviarRespuesta(exchange, ok ? 200 : 400, "{\"success\":" + ok + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                enviarRespuesta(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ─── HANDLER USUARIOS ───
    static class UsuariosHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            configurarCORS(exchange);
            String metodo = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(metodo)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                if ("GET".equalsIgnoreCase(metodo)) {
                    List<Usuario> lista = userDAO.listar();
                    
                    // CONTROL DE LISTA VACÍA PARA EVITAR LOS CORCHETES []
                    if (lista == null || lista.isEmpty()) {
                        enviarTextoPlano(exchange, 200, "No hay usuarios registrados");
                    } else {
                        enviarRespuesta(exchange, 200, mapper.writeValueAsString(lista));
                    }
                } else if ("POST".equalsIgnoreCase(metodo)) {
                    Usuario u = mapper.readValue(exchange.getRequestBody(), Usuario.class);
                    boolean ok = userDAO.registrar(u);
                    enviarRespuesta(exchange, ok ? 201 : 400, "{\"success\":" + ok + "}");
                } else if ("DELETE".equalsIgnoreCase(metodo)) {
                    String query = exchange.getRequestURI().getQuery();
                    if (query != null && query.contains("id=")) {
                        int id = Integer.parseInt(query.split("id=")[1].split("&")[0]);
                        boolean ok = userDAO.eliminar(id);
                        enviarRespuesta(exchange, ok ? 200 : 400, "{\"mensaje\":\"" + (ok ? "Usuario eliminado correctamente" : "No se pudo eliminar") + "\"}");
                    } else {
                        enviarRespuesta(exchange, 400, "{\"mensaje\":\"Falta ID\"}");
                    }
                }
            } catch (Exception e) {
                enviarRespuesta(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    // ─── HELPERS DE RESPUESTA ───
    private static void configurarCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void enviarRespuesta(HttpExchange exchange, int codigo, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(codigo, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void enviarRespuestaHTML(HttpExchange exchange, int codigo, String html) throws IOException {
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
        exchange.sendResponseHeaders(codigo, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void enviarTextoPlano(HttpExchange exchange, int codigo, String texto) throws IOException {
        byte[] bytes = texto.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
        exchange.sendResponseHeaders(codigo, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}