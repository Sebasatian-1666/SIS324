# 1. Forzamos entorno nativo en Java 17 de Eclipse Temurin
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# 2. Instalar herramientas del sistema indispensables
RUN apk add --no-cache findutils wget

# 3. Descargar las librerías necesarias de Jackson
RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

# 4. Copiar los archivos del proyecto al contenedor
COPY . .

# 5. Crear directorio de salida
RUN mkdir -p bin

# 6. Forzamos al compilador a generar binarios estrictos de Java 17 
RUN javac -cp "lib/*" -d bin --release 17 $(find backend -name "*.java" ! -name "*Spec.java")

# 7. Exponer puerto del backend
EXPOSE 8080

# 8. Arrancar la aplicación usando la misma versión
CMD ["java", "-cp", "bin:lib/*:backend", "Servidor"]