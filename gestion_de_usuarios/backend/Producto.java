package backend;

/**
 * Entidad Producto/Servicio - Sprint 2
 * 
 * Estados de validación (HU-03):
 *   PENDIENTE  → estado inicial al crear o editar campos críticos
 *   APROBADO   → validado por el Administrador
 *   RECHAZADO  → rechazado por el Administrador
 */
public class Producto {

    private int id;
    private String titulo;
    private String descripcion;
    private double precio;
    private String categoria;
    private String tipo;            // "PRODUCTO" o "SERVICIO"
    private String estado;          // "PENDIENTE", "APROBADO", "RECHAZADO"
    private String motivoRechazo;
    private int ofertanteId;        // FK → usuarios.id
    private String ofertanteNombre; // para mostrar en frontend (JOIN)

    // ── Constructor vacío ────────────────────────────────────────────────
    public Producto() {}

    // ── Constructor completo (usado al leer de la BD) ────────────────────
    public Producto(int id, String titulo, String descripcion, double precio,
                    String categoria, String tipo, String estado,
                    String motivoRechazo, int ofertanteId, String ofertanteNombre) {
        this.id             = id;
        this.titulo         = titulo;
        this.descripcion    = descripcion;
        this.precio         = precio;
        this.categoria      = categoria;
        this.tipo           = tipo;
        this.estado         = estado;
        this.motivoRechazo  = motivoRechazo;
        this.ofertanteId    = ofertanteId;
        this.ofertanteNombre = ofertanteNombre;
    }

    // ── Constructor para crear (sin id, estado siempre PENDIENTE) ────────
    public Producto(String titulo, String descripcion, double precio,
                    String categoria, String tipo, int ofertanteId) {
        this.titulo      = titulo;
        this.descripcion = descripcion;
        this.precio      = precio;
        this.categoria   = categoria;
        this.tipo        = tipo;
        this.ofertanteId = ofertanteId;
        this.estado      = "PENDIENTE"; // HU-01: siempre PENDIENTE al crear
    }

    // ── Getters y Setters ────────────────────────────────────────────────
    public int getId()                    { return id; }
    public void setId(int id)             { this.id = id; }

    public String getTitulo()             { return titulo; }
    public void setTitulo(String t)       { this.titulo = t; }

    public String getDescripcion()        { return descripcion; }
    public void setDescripcion(String d)  { this.descripcion = d; }

    public double getPrecio()             { return precio; }
    public void setPrecio(double p)       { this.precio = p; }

    public String getCategoria()          { return categoria; }
    public void setCategoria(String c)    { this.categoria = c; }

    public String getTipo()               { return tipo; }
    public void setTipo(String t)         { this.tipo = t; }

    public String getEstado()             { return estado; }
    public void setEstado(String e)       { this.estado = e; }

    public String getMotivoRechazo()            { return motivoRechazo; }
    public void setMotivoRechazo(String m)      { this.motivoRechazo = m; }

    public int getOfertanteId()                 { return ofertanteId; }
    public void setOfertanteId(int oid)         { this.ofertanteId = oid; }

    public String getOfertanteNombre()          { return ofertanteNombre; }
    public void setOfertanteNombre(String on)   { this.ofertanteNombre = on; }

    @Override
    public String toString() {
        return "Producto{id=" + id + ", titulo='" + titulo + "', estado='" + estado + "'}";
    }
}
