import java.awt.GridLayout;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;

public class VentanaPrincipal extends JFrame {
    private JTextField txtUser = new JTextField(15);
    private JPasswordField txtPass = new JPasswordField(15);
    private JButton btnLogin = new JButton("Login");
    private JButton btnRegistro = new JButton("Registrar");
    private JButton btnEliminar = new JButton("Eliminar Usuario");
    
    private UsuarioDAO dao = new UsuarioDAO();

    public VentanaPrincipal() {
        // Configuración básica de la ventana
        setTitle("Sistema de Gestión de Usuarios");
        setSize(350, 250);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new GridLayout(5, 1, 10, 10)); // Organización en rejilla
        setLocationRelativeTo(null);

        // Paneles para organizar los componentes
        JPanel p1 = new JPanel(); p1.add(new JLabel("Usuario:")); p1.add(txtUser);
        JPanel p2 = new JPanel(); p2.add(new JLabel("Password:")); p2.add(txtPass);
        JPanel p3 = new JPanel(); p3.add(btnLogin); p3.add(btnRegistro);
        JPanel p4 = new JPanel(); p4.add(btnEliminar);

        add(p1); add(p2); add(p3); add(p4);

        // --- EVENTOS (Lo que hacen los botones) ---

        // Botón Login
        btnLogin.addActionListener(e -> {
            String user = txtUser.getText();
            String pass = new String(txtPass.getPassword());
            if (dao.login(user, pass)) {
                JOptionPane.showMessageDialog(this, "¡Login exitoso! Bienvenido " + user);
            } else {
                JOptionPane.showMessageDialog(this, "Error: Usuario o clave incorrectos.");
            }
        });

        // Botón Registrar
        btnRegistro.addActionListener(e -> {
            String user = txtUser.getText();
            String pass = new String(txtPass.getPassword());
            if (user.isEmpty() || pass.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Llena todos los campos.");
                return;
            }
            if (dao.registrar(user, pass)) {
                JOptionPane.showMessageDialog(this, "Usuario guardado en SQLite.");
            } else {
                JOptionPane.showMessageDialog(this, "Error: El usuario ya existe.");
            }
        });

        // Botón Eliminar
        btnEliminar.addActionListener(e -> {
            String user = txtUser.getText();
            if (dao.eliminar(user)) {
                JOptionPane.showMessageDialog(this, "Usuario " + user + " eliminado.");
            } else {
                JOptionPane.showMessageDialog(this, "No se pudo eliminar el usuario.");
            }
        });
    }

    public static void main(String[] args) {
        // Ejecutar la ventana
        SwingUtilities.invokeLater(() -> {
            new VentanaPrincipal().setVisible(true);
        });
    }
}