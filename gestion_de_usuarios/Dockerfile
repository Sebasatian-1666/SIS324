FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

RUN apk add --no-cache findutils wget

RUN mkdir -p lib && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar && \
    wget -P lib/ https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar

COPY . .

RUN rm -rf bin && mkdir -p bin
# 💡 CORRECCIÓN EXTRA: -iname ignora mayúsculas/minúsculas en el Spec de pruebas
RUN javac -cp "lib/*" -d bin --release 17 $(find . -name "*.java" ! -iname "*spec.java")

EXPOSE 8080

CMD ["java", "-cp", "bin:lib/*", "backend.Servidor"]