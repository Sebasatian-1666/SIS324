package backend;
/**
 * Entidad Solicitud - Sprint 3
 * * Representa el flujo de interacción entre demandante y ofertante.
 * Estados posibles:
 * PENDIENTE  → Al ser creada por el demandante.
 * ACEPTADA   → Cuando el ofertante aprueba el trato.
 * RECHAZADA  → Cuando el ofertante declina la solicitud.
 */
public class Solicitud {
    
    private int id;
    private int productoId;       // FK → productos.id
    private int demandanteId;     // FK → usuarios.id (quien lo solicita)
    private String fecha;         // Fecha y hora del registro
    private String estado;        // "PENDIENTE", "ACEPTADA", "RECHAZADA"
    private String notas;         // Datos o detalles requeridos para evaluar la solicitud
    
    // Atributos adicionales (Campos de conveniencia para los JOINs en el Frontend)
    private String productoTitulo;
    private String demandanteNombre;

    // ── Constructor vacío ────────────────────────────────────────────────
    public Solicitud() {}

    // ── Constructor para leer de la BD (Con JOINs incluidos) ─────────────
    public Solicitud(int id, int productoId, int demandanteId, String fecha, 
                     String estado, String notas, String productoTitulo, String demandanteNombre) {
        this.id = id;
        this.productoId = productoId;
        this.demandanteId = demandanteId;
        this.fecha = fecha;
        this.estado = estado;
        this.notas = notas;
        this.productoTitulo = productoTitulo;
        this.demandanteNombre = demandanteNombre;
    }

    // ── Constructor para crear solicitudes (Por defecto PENDIENTE) ───────
    public Solicitud(int productoId, int demandanteId, String notas) {
        this.productoId = productoId;
        this.demandanteId = demandanteId;
        this.notas = notas;
        this.estado = "PENDIENTE"; // Toda solicitud nace en evaluación
    }

    // ── Getters y Setters ────────────────────────────────────────────────
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getProductoId() { return productoId; }
    public void setProductoId(int productoId) { this.productoId = productoId; }

    public int getDemandanteId() { return demandanteId; }
    public void setDemandanteId(int demandanteId) { this.demandanteId = demandanteId; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public String getProductoTitulo() { return productoTitulo; }
    public void setProductoTitulo(String productoTitulo) { this.productoTitulo = productoTitulo; }

    public String getDemandanteNombre() { return demandanteNombre; }
    public void setDemandanteNombre(String demandanteNombre) { this.demandanteNombre = demandanteNombre; }

    @Override
    public String toString() {
        return "Solicitud{id=" + id + ", productoId=" + productoId + ", estado='" + estado + "'}";
    }
}