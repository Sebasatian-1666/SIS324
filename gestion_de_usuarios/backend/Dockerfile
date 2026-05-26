# 1. Usamos una imagen oficial de Java 17
FROM openjdk:17-jdk-slim
WORKDIR /app

# 2. Copiamos todo el código del backend al contenedor
COPY . .

# 3. Compilamos todos los archivos .java dentro de la carpeta src
# (Si usas librerías externas en una carpeta lib, las incluimos en el classpath)
RUN javac -d bin -sourcepath src src/*.java 2>/dev/null || javac -d bin $(find src -name "*.java")

# 4. Exponemos el puerto del servidor
EXPOSE 8080

# 5. Comando para ejecutar tu clase Servidor principal
# (Asegúrate de cambiar "Servidor" por el nombre exacto de tu clase con el método main)
CMD ["java", "-cp", "bin:lib/*", "Servidor"]