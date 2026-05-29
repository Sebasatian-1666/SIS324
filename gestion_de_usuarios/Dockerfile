FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

RUN apk add --no-cache findutils wget

RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

COPY . .

# 🚨 Forzamos la ruta correcta de compilación entrando a gestion_de_usuarios
RUN rm -rf bin && mkdir -p bin
RUN javac -cp "lib/*" -d bin --release 17 $(find g* -name "*.java" ! -name "*Spec.java" 2>/dev/null || find . -name "*.java" ! -name "*Spec.java")

EXPOSE 8080

# Buscamos Servidor de forma dinámica en el classpath de bin
CMD ["java", "-cp", "bin:bin/gestion_de_usuarios/backend:bin/backend:lib/*", "Servidor"]