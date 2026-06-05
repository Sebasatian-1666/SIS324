FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

RUN apk add --no-cache findutils wget

RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

COPY . .

RUN rm -rf bin && mkdir -p bin

# 🔥 SOLUCIÓN MAESTRA: Eliminamos físicamente cualquier archivo de pruebas (spec) para que no interfiera en producción
RUN find . -iname "*spec.java" -delete

# 💡 Compilamos con el classpath apuntando a la raíz "." para que los paquetes se reconozcan entre sí
RUN javac -cp ".:lib/*" -d bin --release 17 backend/*.java

EXPOSE 8080

CMD ["java", "-cp", "bin:lib/*", "backend.Servidor"]