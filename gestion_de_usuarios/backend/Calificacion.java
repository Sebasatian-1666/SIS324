package backend;

public class Calificacion {
    private int id;
    private int productoId;
    private int usuarioId;
    private String usuarioNombre;
    private int puntuacion;      // 1–10
    private String comentario;   // max ~100 palabras
    private String fecha;

    public Calificacion() {}

    public Calificacion(int productoId, int usuarioId, String usuarioNombre,
                        int puntuacion, String comentario, String fecha) {
        this.productoId    = productoId;
        this.usuarioId     = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.puntuacion    = puntuacion;
        this.comentario    = comentario;
        this.fecha         = fecha;
    }

    public int getId()                      { return id; }
    public void setId(int id)               { this.id = id; }
    public int getProductoId()              { return productoId; }
    public void setProductoId(int v)        { this.productoId = v; }
    public int getUsuarioId()               { return usuarioId; }
    public void setUsuarioId(int v)         { this.usuarioId = v; }
    public String getUsuarioNombre()        { return usuarioNombre; }
    public void setUsuarioNombre(String v)  { this.usuarioNombre = v; }
    public int getPuntuacion()              { return puntuacion; }
    public void setPuntuacion(int v)        { this.puntuacion = v; }
    public String getComentario()           { return comentario; }
    public void setComentario(String v)     { this.comentario = v; }
    public String getFecha()                { return fecha; }
    public void setFecha(String v)          { this.fecha = v; }
}
