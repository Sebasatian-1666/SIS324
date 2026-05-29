# 1. Imagen base nativa
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# 2. Herramientas básicas
RUN apk add --no-cache findutils wget

# 3. Descarga de librerías
RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

# 4. Copiar archivos
COPY . .
RUN mkdir -p bin

# 5. EL CAMBIO: Forzar origen, destino y release a Java 17 de forma ultra estricta
RUN javac -cp "lib/*" -d bin --source 17 --target 17 --release 17 $(find backend -name "*.java" ! -name "*Spec.java")

# 6. Ejecución
EXPOSE 8080
CMD ["java", "-cp", "bin:lib/*:backend", "Servidor"]