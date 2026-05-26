# 1. Usamos una imagen oficial de Eclipse Temurin FIJA en Java 17
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# 2. Instalar herramientas necesarias
RUN apk add --no-cache findutils wget

# 3. Descargar las librerías de Jackson indispensables
RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

# 4. Copiar todo tu código
COPY . .

# 5. Carpeta de binarios
RUN mkdir -p bin

# 6. Compilación directa en Java 17 pura (sin banderas raras)
RUN javac -cp "lib/*" -d bin $(find backend -name "*.java" ! -name "*Spec.java")

# 7. Puerto estándar
EXPOSE 8080

# 8. Arrancar el servidor
CMD ["java", "-cp", "bin:lib/*:backend", "Servidor"]