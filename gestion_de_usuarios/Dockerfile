FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

RUN apk add --no-cache findutils wget

# Descargamos las dependencias de Jackson necesarias para parsear JSON
RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

COPY . .

# Limpiamos bin e indicamos compilar todo lo que sea código fuente de producción
RUN rm -rf bin && mkdir -p bin
RUN javac -cp "lib/*" -d bin --release 17 $(find . -name "*.java" ! -name "*Spec.java")

EXPOSE 8080

# Mantenemos el classpath apuntando a bin y a las librerías externas
CMD ["java", "-cp", "bin:lib/*", "backend.Servidor"]