# 1. Usamos una imagen oficial activa y moderna de Java 17
FROM amazoncorretto:17-alpine
WORKDIR /app

# 2. Instalamos "findutils" porque la versión Alpine de Linux la necesita para el comando find
RUN apk add --no-cache findutils

# 3. Copiamos todo el repositorio de Git al contenedor
COPY . .

# 4. Creamos la carpeta para guardar los binarios compilados
RUN mkdir -p bin

# 5. Buscamos y compilamos todos los archivos .java dentro de la carpeta backend
RUN javac -d bin $(find backend -name "*.java")

# 6. Exponemos el puerto estándar que usa Render
EXPOSE 8080

# 7. Comando para arrancar tu Servidor principal
CMD ["java", "-cp", "bin:backend", "Servidor"]