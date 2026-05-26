# 1. Imagen base oficial de Java 17
FROM amazoncorretto:17-alpine
WORKDIR /app

# 2. Instalar herramientas necesarias (findutils, wget para descargar librerías)
RUN apk add --no-cache findutils wget

# 3. Descargar los archivos .jar de Jackson necesarios para el ObjectMapper
RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

# 4. Copiar todo tu repositorio al contenedor
COPY . .

# 5. Creamos la carpeta bin para los binarios compilados
RUN mkdir -p bin

# 6. Compilamos incluyendo las librerías Jackson en el classpath (-cp)
# NOTA: Ignoramos el archivo "Spec.java" de pruebas para que no pida JUnit en producción
RUN javac -cp "lib/*" -d bin $(find backend -name "*.java" ! -name "*Spec.java")

# 7. Exponemos el puerto estándar
EXPOSE 8080

# 8. Comando para arrancar tu Servidor principal usando las librerías descargadas
CMD ["java", "-cp", "bin:lib/*:backend", "Servidor"]