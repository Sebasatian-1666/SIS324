# 1. Imagen base ligera con Java 17
FROM openjdk:17-jdk-slim
WORKDIR /app

# 2. Copiamos absolutamente todo el repositorio al contenedor
COPY . .

# 3. Creamos la carpeta para los binarios compilados
RUN mkdir -p bin

# 4. Buscamos TODOS los archivos .java (estén en la carpeta que estén) y los compilamos
RUN javac -d bin $(find . -name "*.java")

# 5. Exponemos el puerto estándar que usa Render
EXPOSE 8080

# 6. Comando para arrancar el servidor
# Buscamos la clase Servidor de forma dinámica en cualquier paquete compilado
CMD ["java", "-cp", "bin", "Servidor"]