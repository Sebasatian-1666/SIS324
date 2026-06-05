FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

RUN apk add --no-cache findutils wget

RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

COPY . .

RUN rm -rf bin && mkdir -p bin

# 1. Borramos los archivos de prueba para evitar ruido
RUN find . -iname "*spec.java" -delete

# 2. Compilación inteligente: Compilamos desde el Servidor y dejamos que busque sus dependencias con -sourcepath
RUN javac -cp "lib/*" -sourcepath . -d bin --release 17 backend/Servidor.java

EXPOSE 8080

CMD ["java", "-cp", "bin:lib/*", "backend.Servidor"]