FROM maven:3.9-eclipse-temurin-23 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:23-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render's free instance has 512 MB and kills the container above it. Unbounded, the JVM sized itself
# for the whole machine and startup went over the limit ("Out of memory (used over 512Mi)"):
#  - SerialGC: the default G1 collector's own bookkeeping took ~50 MB; Serial needs ~1 MB.
#  - Every JVM memory area is capped (heap, metaspace, class space, code cache, direct buffers,
#    thread stacks), so the most it can ever use is ~400 MB - leaving headroom under 512 MB.
#  - TieredStopAtLevel=1: quick C1 compilation only - less memory, faster startup.
#  - MALLOC_ARENA_MAX=2: glibc otherwise gives each thread its own malloc pool on Linux, which
#    inflates a Java container's memory well beyond what the JVM itself uses.
# Measured locally under a 512 MB limit: ~307 MB committed after startup and traffic; worst case 401 MB.
# Set JAVA_TOOL_OPTIONS on Render to override without rebuilding.
ENV MALLOC_ARENA_MAX=2
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -Xms48m -Xmx128m -Xss256k -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=32m -XX:MaxDirectMemorySize=32m -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
