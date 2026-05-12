# 45、Spring Boot 4 整合 Docker 完整教程
- 来源：https://ddkk.com/springboot/4-action/45.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
部署Spring Boot应用的时候最烦的就是环境不一致,开发环境跑得好好的,一到生产环境就各种问题,依赖版本不对、JDK版本不对、系统配置不对,一堆问题搞得人头大;其实Docker这玩意儿就是为了解决这问题,把应用和运行环境打包在一起,到哪都能跑,一次构建到处运行;但是直接用Dockerfile写,那叫一个麻烦,多阶段构建、层优化、缓存策略,一堆配置写得人头疼;后来发现Spring Boot 4直接支持容器镜像构建,Cloud Native Buildpacks自动给你整得明明白白,零配置就能用;现在Spring Boot 4出来了,整合Docker更是方便得不行,Spring Boot Maven插件直接支持构建镜像,还能用Docker Compose管理多容器应用,开发测试部署一条龙;但是很多兄弟不知道里面的门道,也不知道咋写Dockerfile、用Buildpacks、配置Docker Compose、优化镜像大小这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实Docker在Spring Boot里早就支持了,你只要写个Dockerfile,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋写高效的Dockerfile、用Cloud Native Buildpacks、配置Docker Compose、优化镜像大小、多阶段构建这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Docker基础概念

### Docker是啥玩意儿

Docker是一个开源的容器化平台,让开发者能够打包应用和运行环境到一个可移植的容器中;Docker的核心特性包括:

1. **容器化**: 将应用和依赖打包成容器镜像,保证环境一致性
2. **轻量级**: 容器共享宿主机内核,比虚拟机更轻量
3. **可移植性**: 一次构建,到处运行,不受环境限制
4. **隔离性**: 每个容器都有独立的文件系统和网络空间
5. **快速启动**: 容器启动速度快,秒级启动
6. **版本管理**: 镜像支持版本标签,方便回滚和升级
7. **编排支持**: 支持Docker Compose、Kubernetes等编排工具

### Docker和虚拟机的区别

1. **资源占用**: Docker容器共享宿主机内核,资源占用更少;虚拟机需要完整的操作系统,资源占用大
2. **启动速度**: Docker容器秒级启动;虚拟机需要分钟级启动
3. **隔离程度**: Docker容器进程级隔离;虚拟机硬件级隔离
4. **适用场景**: Docker适合应用容器化;虚拟机适合系统级隔离
5. **镜像大小**: Docker镜像通常几十MB到几百MB;虚拟机镜像通常几GB

### Docker的核心概念

1. **镜像(Image)**: 只读的模板,用于创建容器,包含应用代码、运行时、库、环境变量等
2. **容器(Container)**: 镜像的运行实例,是一个轻量级的可执行环境
3. **Dockerfile**: 用于构建镜像的文本文件,包含构建指令
4. **仓库(Repository)**: 存储镜像的地方,如Docker Hub、私有仓库
5. **标签(Tag)**: 镜像的版本标识,如latest、1.0.0
6. **卷(Volume)**: 用于持久化数据的存储,独立于容器生命周期
7. **网络(Network)**: 容器之间的网络通信,支持桥接、主机、覆盖网络等
8. **Docker Compose**: 用于定义和运行多容器应用的工具

### Docker适用场景

1. **微服务架构**: 每个微服务独立容器化,便于部署和扩展
2. **CI/CD流水线**: 在容器中构建、测试、部署应用
3. **开发环境统一**: 开发、测试、生产环境保持一致
4. **云原生应用**: 容器化应用便于在Kubernetes等平台运行
5. **多环境部署**: 同一镜像部署到不同环境,减少配置差异
6. **快速扩缩容**: 容器可以快速启动和停止,便于弹性伸缩

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-docker-demo/
├── pom.xml                          # Maven配置文件
├── Dockerfile                       # Docker镜像构建文件
├── docker-compose.yml               # Docker Compose配置文件(可选)
├── .dockerignore                    # Docker构建忽略文件(可选)
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java                    # 启动类
│   │   │               ├── controller/                        # 控制器目录
│   │   │               │   └── HelloController.java           # 示例控制器
│   │   │               └── service/                           # 服务层目录(可选)
│   │   └── resources/
│   │       ├── application.yml                   # 配置文件
│   │       └── application-docker.yml            # Docker环境配置(可选)
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       └── ApplicationTest.java # 测试类(可选)
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot Maven插件已经内置了Docker镜像构建支持。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-docker-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Docker Demo</name>
    <description>Spring Boot 4整合Docker容器化示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Actuator: 提供健康检查、监控等端点 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 支持构建可执行JAR和Docker镜像 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <!-- 配置镜像名称和标签 -->
                    <image>
                        <name>${project.groupId}/${project.artifactId}:${project.version}</name>
                        <!-- 可选: 配置Docker构建参数 -->
                        <buildpacks>
                            <buildpack>paketobuildpacks/builder:base</buildpack>
                        </buildpacks>
                    </image>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 创建Spring Boot应用

创建一个简单的Spring Boot应用,用于演示Docker容器化:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * Spring Boot应用启动类
 * 用于演示Docker容器化
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
/**
 * 示例控制器
 * 提供一个简单的REST接口用于测试
 */
@RestController
class HelloController {
    /**
     * 健康检查接口
     * 返回应用状态信息
     */
    @GetMapping("/")
    public String hello() {
        return "Hello from Spring Boot 4 in Docker!";
    }
    /**
     * 获取应用信息
     * 返回Java版本和系统信息
     */
    @GetMapping("/info")
    public String info() {
        return String.format(
            "Java Version: %s, OS: %s", 
            System.getProperty("java.version"),
            System.getProperty("os.name")
        );
    }
}
```

### 配置文件

创建应用配置文件,支持Docker环境:

```yaml
# application.yml - 主配置文件
server:
  port: 8080  # 应用端口
spring:
  application:
    name: spring-boot-docker-demo  # 应用名称
# Actuator配置: 暴露健康检查端点
management:
  endpoints:
    web:
      exposure:
        include: health,info  # 暴露健康检查和信息端点
  endpoint:
    health:
      show-details: always  # 显示健康检查详情
```

```yaml
# application-docker.yml - Docker环境配置
server:
  port: 8080  # 容器内端口
spring:
  profiles:
    active: docker  # 激活Docker环境配置
# 日志配置: 容器环境使用控制台输出
logging:
  level:
    root: INFO
    com.example: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

## Dockerfile构建方式

### 基础Dockerfile

最简单的Dockerfile,直接复制JAR文件运行:

```dockerfile
# 使用OpenJDK 17作为基础镜像
FROM openjdk:17-jdk-slim
# 设置工作目录
WORKDIR /app
# 复制JAR文件到容器
COPY target/spring-boot-docker-demo-1.0.0.jar app.jar
# 暴露应用端口
EXPOSE 8080
# 设置JVM参数: 优化容器环境下的Java性能
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 多阶段构建Dockerfile

多阶段构建可以减小镜像大小,分离构建和运行环境:

```dockerfile
# syntax=docker/dockerfile:1
# 第一阶段: 构建阶段
FROM maven:3.9-eclipse-temurin-17 AS builder
# 设置工作目录
WORKDIR /build
# 复制Maven配置文件,利用Docker缓存层
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
# 下载依赖(这层会被缓存,除非pom.xml改变)
RUN ./mvnw dependency:go-offline -B
# 复制源代码
COPY src ./src
# 构建应用
RUN ./mvnw clean package -DskipTests
# 第二阶段: 运行阶段
FROM eclipse-temurin:17-jre-jammy
# 创建非root用户,提高安全性
RUN groupadd -r spring && useradd -r -g spring spring
# 设置工作目录
WORKDIR /app
# 从构建阶段复制JAR文件
COPY --from=builder /build/target/*.jar app.jar
# 更改文件所有者
RUN chown spring:spring app.jar
# 切换到非root用户
USER spring
# 暴露应用端口
EXPOSE 8080
# 设置JVM参数: 优化容器环境
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+UseContainerSupport"
# 健康检查: 定期检查应用健康状态
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 分层优化Dockerfile

Spring Boot支持分层JAR,可以进一步优化镜像大小和构建速度:

```dockerfile
# syntax=docker/dockerfile:1
# 第一阶段: 提取JAR层
FROM eclipse-temurin:17-jdk-jammy AS extractor
WORKDIR /extract
# 复制JAR文件
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} application.jar
# 使用Spring Boot的layertools提取JAR层
# 这会创建dependencies、spring-boot-loader、snapshot-dependencies、application等目录
RUN java -Djarmode=layertools -jar application.jar extract --destination extracted
# 第二阶段: 运行时镜像
FROM eclipse-temurin:17-jre-jammy
# 创建非root用户
RUN groupadd -r spring && useradd -r -g spring spring
WORKDIR /application
# 按依赖变化频率从低到高复制层,优化Docker缓存
# dependencies层: 第三方依赖,变化频率最低
COPY --from=extractor /extract/extracted/dependencies/ ./
# spring-boot-loader层: Spring Boot加载器,变化频率低
COPY --from=extractor /extract/extracted/spring-boot-loader/ ./
# snapshot-dependencies层: 快照依赖,变化频率中等
COPY --from=extractor /extract/extracted/snapshot-dependencies/ ./
# application层: 应用代码,变化频率最高
COPY --from=extractor /extract/extracted/application/ ./
# 更改文件所有者
RUN chown -R spring:spring /application
# 切换到非root用户
USER spring
# 暴露端口
EXPOSE 8080
# JVM参数优化
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
# 启动应用: 使用JarLauncher而不是直接运行JAR
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### 带AOT缓存的Dockerfile

Spring Boot 4支持AOT(提前编译)缓存,可以显著提升启动性能:

```dockerfile
# syntax=docker/dockerfile:1
# 第一阶段: 提取和训练AOT缓存
FROM bellsoft/liberica-openjre-debian:25-cds AS builder
WORKDIR /builder
# 复制JAR文件
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} application.jar
# 提取JAR层
RUN java -Djarmode=layertools -jar application.jar extract --layers --destination extracted
# 第二阶段: AOT缓存训练
FROM bellsoft/liberica-openjre-debian:25-cds AS trainer
WORKDIR /application
# 复制提取的层
COPY --from=builder /builder/extracted/dependencies/ ./
COPY --from=builder /builder/extracted/spring-boot-loader/ ./
COPY --from=builder /builder/extracted/snapshot-dependencies/ ./
COPY --from=builder /builder/extracted/application/ ./
# 执行AOT缓存训练: 运行应用生成AOT缓存文件
# -XX:AOTCacheOutput=app.aot: 指定AOT缓存输出文件
# -Dspring.context.exit=onRefresh: 应用上下文刷新后退出,用于训练缓存
RUN java -XX:AOTCacheOutput=app.aot -Dspring.context.exit=onRefresh -jar application.jar
# 第三阶段: 运行时镜像
FROM bellsoft/liberica-openjre-debian:25-cds
RUN groupadd -r spring && useradd -r -g spring spring
WORKDIR /application
# 复制层和AOT缓存文件
COPY --from=trainer /application/ ./
COPY --from=trainer /application/app.aot ./app.aot
RUN chown -R spring:spring /application
USER spring
EXPOSE 8080
# 启用AOT缓存: -XX:AOTCache=app.aot
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:AOTCache=app.aot"
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
# 启动应用: 使用AOT缓存加速启动
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar application.jar"]
```

### .dockerignore文件

创建.dockerignore文件,排除不需要的文件,减小构建上下文:

```plaintext
# Maven构建产物
target/
!target/*.jar
# IDE文件
.idea/
.vscode/
*.iml
*.ipr
*.iws
# Git文件
.git/
.gitignore
# 文档文件
README.md
*.md
# 日志文件
*.log
# 临时文件
*.tmp
*.swp
*~
```

## Cloud Native Buildpacks方式

### 使用Spring Boot Maven插件构建

Spring Boot 4的Maven插件内置了Cloud Native Buildpacks支持,无需编写Dockerfile:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <!-- 配置镜像信息 -->
                <image>
                    <!-- 镜像名称和标签 -->
                    <name>${project.groupId}/${project.artifactId}:${project.version}</name>
                    <!-- 可选: 配置Buildpack构建器 -->
                    <buildpacks>
                        <buildpack>paketobuildpacks/builder:base</buildpack>
                    </buildpacks>
                    <!-- 可选: 配置环境变量 -->
                    <env>
                        <BP_JVM_VERSION>17</BP_JVM_VERSION>
                    </env>
                </image>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 构建镜像命令

使用Maven命令构建Docker镜像:

```bash
# 构建Docker镜像(使用Cloud Native Buildpacks)
mvn spring-boot:build-image
# 或者使用Maven package命令(需要配置execution)
mvn clean package spring-boot:build-image
# 指定镜像名称
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=myapp:1.0.0
```

### 自定义Buildpack配置

可以在pom.xml中详细配置Buildpack参数:

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <image>
            <name>${project.groupId}/${project.artifactId}:${project.version}</name>
            <!-- 配置Buildpack构建器 -->
            <builder>paketobuildpacks/builder:base</builder>
            <!-- 或者使用tiny构建器(更小的镜像) -->
            <!-- <builder>paketobuildpacks/builder:tiny</builder> -->
            <!-- 环境变量配置 -->
            <env>
                <!-- JVM版本 -->
                <BP_JVM_VERSION>17</BP_JVM_VERSION>
                <!-- JVM类型 -->
                <BP_JVM_TYPE>JRE</BP_JVM_TYPE>
                <!-- 内存配置 -->
                <BPE_DEFAULT_JVM_OPTS>-Xms256m -Xmx512m</BPE_DEFAULT_JVM_OPTS>
            </env>
            <!-- Docker配置 -->
            <docker>
                <!-- Docker主机地址 -->
                <host>unix:///var/run/docker.sock</host>
                <!-- TLS验证 -->
                <tlsVerify>false</tlsVerify>
                <!-- 证书路径 -->
                <!-- <certPath>/path/to/certs</certPath> -->
            </docker>
        </image>
    </configuration>
</plugin>
```

## Docker Compose配置

### 基础Docker Compose配置

创建docker-compose.yml文件,用于管理多容器应用:

```yaml
version: '3.8'
services:
  # Spring Boot应用服务
  app:
    # 构建配置: 使用当前目录的Dockerfile
    build:
      context: .
      dockerfile: Dockerfile
    # 镜像名称
    image: spring-boot-docker-demo:1.0.0
    # 容器名称
    container_name: spring-boot-app
    # 端口映射: 主机端口:容器端口
    ports:
      - "8080:8080"
    # 环境变量
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - JAVA_OPTS=-Xms256m -Xmx512m
    # 依赖服务: 等待数据库启动后再启动应用
    depends_on:
      - db
    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    # 重启策略
    restart: unless-stopped
    # 网络
    networks:
      - app-network
  # MySQL数据库服务
  db:
    image: mysql:8.0
    container_name: mysql-db
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=springboot_db
      - MYSQL_USER=springboot
      - MYSQL_PASSWORD=springboot123
    ports:
      - "3306:3306"
    volumes:
      # 数据持久化
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network
  # Redis缓存服务
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped
    networks:
      - app-network
# 数据卷: 持久化数据
volumes:
  mysql_data:
  redis_data:
# 网络: 容器间通信
networks:
  app-network:
    driver: bridge
```

### 开发环境Docker Compose配置

针对开发环境的Docker Compose配置,支持热重载和调试:

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      # 使用开发环境的Dockerfile
      dockerfile: Dockerfile.dev
    image: spring-boot-docker-demo:dev
    container_name: spring-boot-app-dev
    ports:
      - "8080:8080"
      # 调试端口
      - "5005:5005"
    environment:
      - SPRING_PROFILES_ACTIVE=dev,docker
      # 启用远程调试
      - JAVA_OPTS=-Xms256m -Xmx512m -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005
      # 开发工具配置
      - SPRING_DEVTOOLS_RESTART_ENABLED=true
    volumes:
      # 挂载源代码,支持热重载
      - ./src:/app/src
      # 挂载Maven本地仓库,加速构建
      - ~/.m2:/root/.m2
    depends_on:
      - db
      - redis
    networks:
      - app-network
  db:
    image: mysql:8.0
    container_name: mysql-db-dev
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=springboot_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_dev_data:/var/lib/mysql
    networks:
      - app-network
  redis:
    image: redis:7-alpine
    container_name: redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    networks:
      - app-network
volumes:
  mysql_dev_data:
  redis_dev_data:
networks:
  app-network:
    driver: bridge
```

### Docker Compose命令

常用的Docker Compose命令:

```bash
# 启动所有服务
docker compose up
# 后台启动所有服务
docker compose up -d
# 启动特定服务
docker compose up app db
# 停止所有服务
docker compose stop
# 停止并删除容器
docker compose down
# 停止并删除容器和卷
docker compose down -v
# 查看服务状态
docker compose ps
# 查看服务日志
docker compose logs
# 查看特定服务日志
docker compose logs app
# 实时查看日志
docker compose logs -f app
# 重新构建镜像
docker compose build
# 强制重新构建
docker compose build --no-cache
# 执行命令
docker compose exec app sh
# 扩展服务实例
docker compose up -d --scale app=3
```

## 镜像优化最佳实践

### 选择合适的基础镜像

1. **使用官方镜像**: 优先使用官方维护的镜像,如eclipse-temurin、openjdk
2. **使用Alpine镜像**: Alpine Linux镜像更小,但可能缺少某些库
3. **使用JRE而非JDK**: 运行环境只需要JRE,不需要完整的JDK
4. **固定版本标签**: 使用具体版本号而非latest,保证构建一致性

```dockerfile
# 推荐: 使用eclipse-temurin JRE
FROM eclipse-temurin:17-jre-jammy
# 不推荐: 使用latest标签
# FROM openjdk:latest
# 不推荐: 使用完整JDK
# FROM eclipse-temurin:17-jdk-jammy
```

### 优化Dockerfile层

1. **合并RUN命令**: 减少镜像层数
2. **利用缓存**: 将变化频率低的层放在前面
3. **清理缓存**: 在构建过程中清理不必要的文件

```dockerfile
# 推荐: 合并RUN命令,清理缓存
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*
# 不推荐: 多个RUN命令
# RUN apt-get update
# RUN apt-get install -y curl
# RUN rm -rf /var/lib/apt/lists/*
```

### 多阶段构建优化

使用多阶段构建分离构建和运行环境:

```dockerfile
# 构建阶段: 包含构建工具
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests
# 运行阶段: 只包含运行时依赖
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 使用非root用户

提高安全性,使用非root用户运行应用:

```dockerfile
# 创建用户组和用户
RUN groupadd -r spring && useradd -r -g spring spring
# 更改文件所有者
RUN chown -R spring:spring /app
# 切换到非root用户
USER spring
```

### 配置健康检查

添加健康检查,便于容器编排工具监控:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
```

## 实际应用场景

### 场景1: 单应用容器化

最简单的场景,单个Spring Boot应用容器化:

```dockerfile
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

构建和运行:

```bash
# 构建镜像
docker build -t myapp:1.0.0 .
# 运行容器
docker run -d -p 8080:8080 --name myapp myapp:1.0.0
# 查看日志
docker logs -f myapp
# 停止容器
docker stop myapp
```

### 场景2: 微服务架构

多个Spring Boot微服务,使用Docker Compose编排:

```yaml
version: '3.8'
services:
  user-service:
    build: ./user-service
    ports:
      - "8081:8080"
    networks:
      - microservices
  order-service:
    build: ./order-service
    ports:
      - "8082:8080"
    depends_on:
      - user-service
    networks:
      - microservices
  gateway-service:
    build: ./gateway-service
    ports:
      - "8080:8080"
    depends_on:
      - user-service
      - order-service
    networks:
      - microservices
networks:
  microservices:
    driver: bridge
```

### 场景3: 生产环境部署

生产环境的Docker配置,包含监控、日志、安全等:

```yaml
version: '3.8'
services:
  app:
    image: myapp:1.0.0
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC
    volumes:
      # 日志持久化
      - ./logs:/app/logs
      # 配置文件
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: always
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    # 日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 常见问题和解决方案

### 问题1: 容器启动慢

**原因**: JVM启动需要时间,特别是首次启动

**解决方案**:

1. 使用AOT缓存加速启动
2. 优化JVM参数
3. 使用GraalVM原生镜像

```dockerfile
# 使用AOT缓存
ENV JAVA_OPTS="-XX:AOTCache=app.aot -Xms256m -Xmx512m"
```

### 问题2: 内存不足

**原因**: 容器内存限制过小

**解决方案**:

1. 调整JVM堆内存参数
2. 使用容器感知的JVM参数

```dockerfile
# 容器感知的JVM参数
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
```

### 问题3: 时区问题

**原因**: 容器默认使用UTC时区

**解决方案**:

1. 设置时区环境变量
2. 挂载时区文件

```dockerfile
# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
```

### 问题4: 文件权限问题

**原因**: 容器内文件权限不正确

**解决方案**:

1. 使用非root用户
2. 正确设置文件权限

```dockerfile
RUN chown -R spring:spring /app
USER spring
```

### 问题5: 网络连接问题

**原因**: 容器网络配置不正确,无法访问外部服务

**解决方案**:

1. 检查网络模式配置
2. 使用正确的服务名称访问
3. 配置DNS解析

```yaml
# docker-compose.yml
services:
  app:
    networks:
      - app-network
    # 使用服务名访问其他容器
    environment:
      - DB_HOST=db  # 使用服务名而非localhost
```

### 问题6: 日志文件过大

**原因**: 容器日志不断增长,占用磁盘空间

**解决方案**:

1. 配置日志轮转
2. 限制日志大小
3. 使用外部日志收集

```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"      # 单个日志文件最大10MB
        max-file: "3"        # 最多保留3个日志文件
```

### 问题7: 容器无法停止

**原因**: 应用没有正确处理SIGTERM信号

**解决方案**:

1. 使用exec形式的ENTRYPOINT
2. 确保应用正确处理信号
3. 配置优雅关闭

```dockerfile
# 使用exec形式,确保信号正确传递
ENTRYPOINT ["java", "-jar", "app.jar"]
# 在Spring Boot中配置优雅关闭
# application.yml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

## Docker命令详解

### 镜像管理命令

```bash
# 查看本地镜像列表
docker images
# 查看镜像详细信息
docker inspect myapp:1.0.0
# 查看镜像构建历史
docker history myapp:1.0.0
# 删除镜像
docker rmi myapp:1.0.0
# 强制删除镜像(即使有容器使用)
docker rmi -f myapp:1.0.0
# 清理未使用的镜像
docker image prune
# 清理所有未使用的镜像
docker image prune -a
# 导出镜像到文件
docker save -o myapp.tar myapp:1.0.0
# 从文件导入镜像
docker load -i myapp.tar
# 给镜像打标签
docker tag myapp:1.0.0 myregistry.com/myapp:1.0.0
# 推送镜像到仓库
docker push myregistry.com/myapp:1.0.0
# 从仓库拉取镜像
docker pull myregistry.com/myapp:1.0.0
```

### 容器管理命令

```bash
# 运行容器
docker run -d -p 8080:8080 --name myapp myapp:1.0.0
# 运行容器并挂载卷
docker run -d -p 8080:8080 -v /host/path:/container/path --name myapp myapp:1.0.0
# 运行容器并设置环境变量
docker run -d -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod --name myapp myapp:1.0.0
# 运行容器并设置资源限制
docker run -d -p 8080:8080 --memory="512m" --cpus="1.0" --name myapp myapp:1.0.0
# 查看运行中的容器
docker ps
# 查看所有容器(包括停止的)
docker ps -a
# 查看容器详细信息
docker inspect myapp
# 查看容器日志
docker logs myapp
# 实时查看容器日志
docker logs -f myapp
# 查看容器最后N行日志
docker logs --tail 100 myapp
# 进入运行中的容器
docker exec -it myapp sh
# 在容器中执行命令
docker exec myapp ls -la /app
# 停止容器
docker stop myapp
# 强制停止容器
docker kill myapp
# 启动已停止的容器
docker start myapp
# 重启容器
docker restart myapp
# 删除容器
docker rm myapp
# 强制删除运行中的容器
docker rm -f myapp
# 清理所有停止的容器
docker container prune
# 复制文件到容器
docker cp /host/file.txt myapp:/app/file.txt
# 从容器复制文件
docker cp myapp:/app/file.txt /host/file.txt
# 查看容器资源使用情况
docker stats myapp
# 查看所有容器资源使用情况
docker stats
```

### 构建命令

```bash
# 构建镜像
docker build -t myapp:1.0.0 .
# 指定Dockerfile构建
docker build -f Dockerfile.prod -t myapp:1.0.0 .
# 构建时传递构建参数
docker build --build-arg JAR_FILE=target/app.jar -t myapp:1.0.0 .
# 不使用缓存构建
docker build --no-cache -t myapp:1.0.0 .
# 构建时查看详细输出
docker build --progress=plain -t myapp:1.0.0 .
# 构建并推送镜像
docker build -t myregistry.com/myapp:1.0.0 . && docker push myregistry.com/myapp:1.0.0
```

## 网络配置详解

### Docker网络类型

Docker支持多种网络类型,每种类型适用于不同场景:

1. **bridge网络**: 默认网络类型,容器间可以通信
2. **host网络**: 容器直接使用宿主机网络
3. **none网络**: 容器没有网络接口
4. **overlay网络**: 用于Docker Swarm多主机网络
5. **macvlan网络**: 容器直接连接到物理网络

### 创建自定义网络

```bash
# 创建bridge网络
docker network create app-network
# 创建网络并指定子网
docker network create --subnet=172.20.0.0/16 app-network
# 创建网络并指定网关
docker network create --gateway=172.20.0.1 --subnet=172.20.0.0/16 app-network
# 查看网络列表
docker network ls
# 查看网络详细信息
docker network inspect app-network
# 删除网络
docker network rm app-network
# 清理未使用的网络
docker network prune
```

### Docker Compose网络配置

```yaml
version: '3.8'
services:
  app:
    build: .
    networks:
      - frontend
      - backend
  db:
    image: mysql:8.0
    networks:
      - backend
  redis:
    image: redis:7-alpine
    networks:
      - backend
# 定义多个网络
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.26.0.0/16
```

### 容器间通信

```yaml
version: '3.8'
services:
  app:
    build: .
    # 使用服务名访问其他容器
    environment:
      - DB_HOST=db          # 使用服务名
      - DB_PORT=3306
      - REDIS_HOST=redis    # 使用服务名
      - REDIS_PORT=6379
    networks:
      - app-network
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
    networks:
      - app-network
  redis:
    image: redis:7-alpine
    networks:
      - app-network
networks:
  app-network:
    driver: bridge
```

## 存储卷配置详解

### 数据卷类型

Docker支持三种数据卷类型:

1. **命名卷(Volume)**: Docker管理的卷,存储在Docker的数据目录
2. **绑定挂载(Bind Mount)**: 挂载宿主机文件系统路径
3. **tmpfs挂载**: 存储在内存中,容器停止后数据丢失

### 使用命名卷

```yaml
version: '3.8'
services:
  app:
    build: .
    volumes:
      # 使用命名卷
      - app_data:/app/data
      - app_logs:/app/logs
  db:
    image: mysql:8.0
    volumes:
      # 数据库数据持久化
      - mysql_data:/var/lib/mysql
      # 数据库配置
      - ./mysql/conf.d:/etc/mysql/conf.d
volumes:
  app_data:
    driver: local
  app_logs:
    driver: local
  mysql_data:
    driver: local
```

### 使用绑定挂载

```yaml
version: '3.8'
services:
  app:
    build: .
    volumes:
      # 绑定挂载: 开发环境挂载源代码
      - ./src:/app/src
      # 绑定挂载: 挂载配置文件
      - ./config:/app/config
      # 绑定挂载: 挂载日志目录
      - ./logs:/app/logs
      # 只读挂载
      - ./readonly:/app/readonly:ro
```

### 卷管理命令

```bash
# 创建卷
docker volume create myvolume
# 查看卷列表
docker volume ls
# 查看卷详细信息
docker volume inspect myvolume
# 删除卷
docker volume rm myvolume
# 清理未使用的卷
docker volume prune
# 备份卷数据
docker run --rm -v myvolume:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .
# 恢复卷数据
docker run --rm -v myvolume:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data
```

## 安全配置详解

### 使用非root用户

```dockerfile
# 创建非root用户
RUN groupadd -r spring && \
    useradd -r -g spring -u 1000 spring
# 创建应用目录并设置权限
RUN mkdir -p /app && \
    chown -R spring:spring /app
# 切换到非root用户
USER spring
# 确保后续操作以非root用户执行
WORKDIR /app
```

### 最小权限原则

```dockerfile
# 只暴露必要的端口
EXPOSE 8080
# 使用只读文件系统(如果可能)
# 需要在docker run时使用--read-only参数
# 限制容器能力
# 需要在docker run时使用--cap-drop=ALL --cap-add=NET_BIND_SERVICE
```

### 安全扫描

```bash
# 使用Docker Scout扫描镜像漏洞
docker scout quickview myapp:1.0.0
# 详细扫描报告
docker scout cves myapp:1.0.0
# 修复建议
docker scout recommendations myapp:1.0.0
```

### 密钥管理

```yaml
# docker-compose.yml - 使用Docker Secrets(生产环境)
version: '3.8'
services:
  app:
    build: .
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key
secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

## 性能调优详解

### JVM参数优化

```dockerfile
# 容器感知的JVM参数
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=50.0 \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200 \
               -XX:+HeapDumpOnOutOfMemoryError \
               -XX:HeapDumpPath=/tmp/heapdump.hprof \
               -Xlog:gc*:file=/tmp/gc.log:time,level,tags"
```

### 镜像大小优化

```dockerfile
# 使用多阶段构建减小镜像大小
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests
# 使用Alpine基础镜像减小体积
FROM eclipse-temurin:17-jre-alpine
# 清理不必要的文件
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
# 使用分层JAR优化
RUN java -Djarmode=layertools -jar app.jar extract
```

### 构建缓存优化

```dockerfile
# 将变化频率低的文件放在前面,利用Docker缓存
# 1. 先复制依赖配置文件
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
# 2. 下载依赖(这层会被缓存)
RUN ./mvnw dependency:go-offline -B
# 3. 最后复制源代码(变化频率最高)
COPY src ./src
# 4. 构建应用
RUN ./mvnw clean package -DskipTests
```

### 启动性能优化

```dockerfile
# 使用AOT缓存加速启动(Java 24+)
FROM bellsoft/liberica-openjre-debian:25-cds AS trainer
WORKDIR /application
COPY --from=builder /build/target/*.jar application.jar
# 训练AOT缓存
RUN java -XX:AOTCacheOutput=app.aot -Dspring.context.exit=onRefresh -jar application.jar
FROM bellsoft/liberica-openjre-debian:25-cds
WORKDIR /application
COPY --from=trainer /application/ ./
# 使用AOT缓存启动
ENV JAVA_OPTS="-XX:AOTCache=app.aot"
```

## CI/CD集成

### GitHub Actions示例

```yaml
# .github/workflows/docker.yml
name: Build and Push Docker Image
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    - name: Build with Maven
      run: mvn clean package -DskipTests
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          myregistry.com/myapp:${{ github.sha }}
          myregistry.com/myapp:latest
        cache-from: type=registry,ref=myregistry.com/myapp:buildcache
        cache-to: type=registry,ref=myregistry.com/myapp:buildcache,mode=max
```

### GitLab CI示例

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - package
  - deploy
variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
build:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn clean package -DskipTests
  artifacts:
    paths:
      - target/*.jar
    expire_in: 1 hour
test:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn test
package:
  stage: package
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
deploy:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker pull $DOCKER_IMAGE
    - docker run -d -p 8080:8080 $DOCKER_IMAGE
  only:
    - main
```

### Jenkins Pipeline示例

```groovy
// Jenkinsfile
pipeline {
    agent any
    environment {
        DOCKER_REGISTRY = 'myregistry.com'
        IMAGE_NAME = 'myapp'
    }
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        stage('Build Image') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}")
                    image.push()
                    image.push("latest")
                }
            }
        }
        stage('Deploy') {
            steps {
                sh """
                    docker stop ${IMAGE_NAME} || true
                    docker rm ${IMAGE_NAME} || true
                    docker run -d -p 8080:8080 --name ${IMAGE_NAME} ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}
                """
            }
        }
    }
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

## 监控和日志配置

### Prometheus监控集成

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    # 暴露监控端点
    labels:
      - "prometheus.scrape=true"
      - "prometheus.port=8080"
      - "prometheus.path=/actuator/prometheus"
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
volumes:
  prometheus_data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'spring-boot-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['app:8080']
```

### Grafana可视化

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
volumes:
  grafana_data:
```

### ELK日志收集

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    logging:
      driver: "gelf"
      options:
        gelf-address: "udp://localhost:12201"
        tag: "spring-boot-app"
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    ports:
      - "12201:12201/udp"
    depends_on:
      - elasticsearch
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
volumes:
  elasticsearch_data:
```

## 高级场景和最佳实践

### 场景1: 多环境配置管理

```yaml
# docker-compose.dev.yml - 开发环境
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - LOG_LEVEL=DEBUG
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
    ports:
      - "8080:8080"
      - "5005:5005"  # 调试端口
```

```yaml
# docker-compose.prod.yml - 生产环境
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - LOG_LEVEL=INFO
    ports:
      - "8080:8080"
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

```bash
# 使用不同环境的配置
docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.prod.yml up
```

### 场景2: 蓝绿部署

```bash
#!/bin/bash
# blue-green-deploy.sh
NEW_VERSION=$1
CURRENT_COLOR=$(docker ps --filter "name=app-" --format "{{.Names}}" | grep -oE "(blue|green)" | head -1)
if [ "$CURRENT_COLOR" == "blue" ]; then
    NEW_COLOR="green"
else
    NEW_COLOR="blue"
fi
# 启动新版本
docker run -d \
    --name app-$NEW_COLOR \
    -p 8081:8080 \
    myapp:$NEW_VERSION
# 健康检查
sleep 10
if curl -f http://localhost:8081/actuator/health; then
    # 切换流量
    docker stop app-$CURRENT_COLOR
    docker rm app-$CURRENT_COLOR
    # 更新nginx配置指向新容器
    # ...
    echo "Deployment successful: $NEW_COLOR is now active"
else
    echo "Health check failed, rolling back"
    docker stop app-$NEW_COLOR
    docker rm app-$NEW_COLOR
fi
```

### 场景3: 滚动更新

```yaml
# docker-compose.yml with multiple instances
version: '3.8'
services:
  app:
    build: .
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 5s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 40s
```

### 场景4: 容器编排最佳实践

```yaml
version: '3.8'
services:
  app:
    build: .
    # 使用健康检查确保服务就绪
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    # 依赖服务健康检查
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    # 重启策略
    restart: unless-stopped
    # 日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"
  db:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

## 故障排查指南

### 查看容器日志

```bash
# 查看实时日志
docker logs -f container_name
# 查看最后100行日志
docker logs --tail 100 container_name
# 查看指定时间范围的日志
docker logs --since "2024-01-01T00:00:00" --until "2024-01-01T23:59:59" container_name
# 查看带时间戳的日志
docker logs -t container_name
```

### 进入容器调试

```bash
# 进入运行中的容器
docker exec -it container_name sh
# 进入容器并执行命令
docker exec container_name ps aux
# 查看容器环境变量
docker exec container_name env
# 查看容器网络配置
docker exec container_name ip addr
# 查看容器进程
docker exec container_name ps -ef
```

### 检查容器资源使用

```bash
# 实时查看资源使用
docker stats container_name
# 查看容器详细信息
docker inspect container_name
# 查看容器网络
docker network inspect network_name
# 查看容器挂载的卷
docker inspect -f '{{ .Mounts }}' container_name
```

### 常见错误排查

```bash
# 容器无法启动
# 1. 查看容器日志
docker logs container_name
# 2. 检查镜像是否存在
docker images | grep myapp
# 3. 检查端口是否被占用
netstat -tulpn | grep 8080
# 4. 检查Docker daemon是否运行
docker info
# 容器启动后立即退出
# 1. 查看退出码
docker ps -a
# 2. 以前台模式运行查看错误
docker run myapp:1.0.0
# 3. 检查应用配置
docker exec container_name cat /app/application.yml
# 网络连接问题
# 1. 检查网络配置
docker network ls
docker network inspect network_name
# 2. 测试容器间连接
docker exec container_name ping other_container
# 3. 检查DNS解析
docker exec container_name nslookup other_container
```

## Spring Boot 4 Docker Compose Dev Services

### 什么是Dev Services

Spring Boot 4引入了Docker Compose Dev Services功能,可以在开发环境中自动启动和管理Docker Compose服务,无需手动配置;这个功能特别适合本地开发,自动管理数据库、Redis、消息队列等依赖服务。

### 启用Dev Services

在`pom.xml`中添加依赖:

```xml
<dependencies>
    <!-- Spring Boot Docker Compose支持 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-docker-compose</artifactId>
        <scope>runtime</scope>
        <!-- 只在开发环境启用 -->
        <optional>true</optional>
    </dependency>
</dependencies>
```

### 创建compose.yml文件

在项目根目录创建`compose.yml`文件:

```yaml
# compose.yml - Spring Boot会自动检测并启动
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=springboot_db
      - MYSQL_USER=springboot
      - MYSQL_PASSWORD=springboot123
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Spring Boot会自动检测并创建连接
    labels:
      - "org.springframework.boot.service-connection=mysql"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    labels:
      - "org.springframework.boot.service-connection=redis"
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=springboot_db
      - POSTGRES_USER=springboot
      - POSTGRES_PASSWORD=springboot123
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U springboot"]
      interval: 10s
      timeout: 5s
      retries: 5
    labels:
      - "org.springframework.boot.service-connection=postgres"
```

### 配置Dev Services

在`application.yml`中配置:

```yaml
# application.yml
spring:
  docker:
    compose:
      # 启用Docker Compose支持
      enabled: true
      # Compose文件路径(默认查找compose.yml)
      file: compose.yml
      # 生命周期管理: start-and-stop(启动和停止), start-only(仅启动), none(不管理)
      lifecycle-management: start-and-stop
      # 启动时等待服务就绪
      start:
        command: up
      # 停止时关闭服务
      stop:
        command: down
```

### 自定义服务连接

如果需要自定义服务连接配置:

```yaml
# compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=springboot_db
    labels:
      # 自定义JDBC URL参数
      - "org.springframework.boot.jdbc.parameters.useSSL=false"
      - "org.springframework.boot.jdbc.parameters.serverTimezone=Asia/Shanghai"
```

### 禁用Dev Services

在生产环境禁用Dev Services:

```yaml
# application-prod.yml
spring:
  docker:
    compose:
      enabled: false
```

或者在代码中禁用:

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        // 禁用Docker Compose Dev Services
        System.setProperty("spring.docker.compose.enabled", "false");
        SpringApplication.run(Application.class, args);
    }
}
```

## 实际项目案例

### 案例1: 电商微服务架构

完整的电商系统Docker配置:

```yaml
# docker-compose.yml
version: '3.8'
services:
  # 用户服务
  user-service:
    build:
      context: ./user-service
      dockerfile: Dockerfile
    image: ecommerce/user-service:1.0.0
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://eureka:8761/eureka/
    depends_on:
      - mysql
      - redis
      - eureka
    networks:
      - ecommerce-network
  # 商品服务
  product-service:
    build:
      context: ./product-service
      dockerfile: Dockerfile
    image: ecommerce/product-service:1.0.0
    ports:
      - "8082:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://eureka:8761/eureka/
    depends_on:
      - mysql
      - redis
      - eureka
    networks:
      - ecommerce-network
  # 订单服务
  order-service:
    build:
      context: ./order-service
      dockerfile: Dockerfile
    image: ecommerce/order-service:1.0.0
    ports:
      - "8083:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://eureka:8761/eureka/
    depends_on:
      - mysql
      - redis
      - eureka
    networks:
      - ecommerce-network
  # API网关
  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    image: ecommerce/gateway:1.0.0
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://eureka:8761/eureka/
    depends_on:
      - eureka
    networks:
      - ecommerce-network
  # 服务注册中心
  eureka:
    image: ecommerce/eureka-server:1.0.0
    ports:
      - "8761:8761"
    networks:
      - ecommerce-network
  # MySQL数据库
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=ecommerce_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - ecommerce-network
  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ecommerce-network
volumes:
  mysql_data:
  redis_data:
networks:
  ecommerce-network:
    driver: bridge
```

### 案例2: 前后端分离项目

包含前端和后端的完整配置:

```yaml
# docker-compose.yml
version: '3.8'
services:
  # Spring Boot后端
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: myapp/backend:1.0.0
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/myapp_db
      - SPRING_DATASOURCE_USERNAME=myapp
      - SPRING_DATASOURCE_PASSWORD=myapp123
      - SPRING_REDIS_HOST=redis
      - SPRING_REDIS_PORT=6379
    depends_on:
      - db
      - redis
    networks:
      - app-network
  # Nginx前端
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: myapp/frontend:1.0.0
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - app-network
  # MySQL数据库
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=myapp_db
      - MYSQL_USER=myapp
      - MYSQL_PASSWORD=myapp123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network
volumes:
  mysql_data:
  redis_data:
networks:
  app-network:
    driver: bridge
```

### 案例3: 高可用生产环境

包含负载均衡、监控、日志的完整配置:

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  # 应用实例1
  app1:
    image: myapp:1.0.0
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SERVER_PORT=8080
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
      restart_policy:
        condition: on-failure
        max_attempts: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  # 应用实例2
  app2:
    image: myapp:1.0.0
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SERVER_PORT=8080
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
      restart_policy:
        condition: on-failure
        max_attempts: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  # Nginx负载均衡
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app1
      - app2
    networks:
      - app-network
  # Prometheus监控
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - app-network
  # Grafana可视化
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - app-network
volumes:
  prometheus_data:
  grafana_data:
networks:
  app-network:
    driver: bridge
```

## 性能基准测试

### 镜像大小对比

不同构建方式的镜像大小对比:

```bash
# 基础Dockerfile构建
docker images | grep myapp-basic
# myapp-basic:1.0.0    500MB
# 多阶段构建
docker images | grep myapp-multistage
# myapp-multistage:1.0.0    250MB
# 分层JAR优化
docker images | grep myapp-layered
# myapp-layered:1.0.0    200MB
# Cloud Native Buildpacks
docker images | grep myapp-buildpack
# myapp-buildpack:1.0.0    180MB
# Alpine基础镜像
docker images | grep myapp-alpine
# myapp-alpine:1.0.0    150MB
```

### 启动时间对比

不同优化方式的启动时间:

```bash
# 标准JAR启动
time docker run --rm myapp:standard
# 启动时间: 15-20秒
# 分层JAR启动
time docker run --rm myapp:layered
# 启动时间: 12-15秒
# AOT缓存启动(Java 24+)
time docker run --rm myapp:aot
# 启动时间: 5-8秒
# GraalVM原生镜像
time docker run --rm myapp:native
# 启动时间: 0.5-1秒
```

### 内存使用对比

不同JVM配置的内存使用:

```bash
# 默认JVM参数
docker stats myapp-default
# 内存使用: 512MB
# 容器感知JVM参数
docker stats myapp-container-aware
# 内存使用: 384MB
# 优化后的JVM参数
docker stats myapp-optimized
# 内存使用: 256MB
```

## 总结

Spring Boot 4整合Docker容器化,主要有三种方式:

1. **Dockerfile方式**: 最灵活,可以完全控制构建过程,适合需要精细控制的场景
2. **Cloud Native Buildpacks方式**: 最简单,Spring Boot Maven插件自动构建,零配置
3. **Docker Compose方式**: 适合多容器应用,统一管理服务依赖和网络

关键优化点:

1. **多阶段构建**: 减小镜像大小,分离构建和运行环境
2. **分层JAR**: 利用Docker层缓存,加速构建
3. **AOT缓存**: 提升启动性能(Java 24+)
4. **非root用户**: 提高安全性
5. **健康检查**: 便于监控和编排
6. **资源限制**: 防止资源耗尽

实际使用中,根据项目需求选择合适的方式;简单项目用Buildpacks,复杂项目用Dockerfile,多服务用Docker Compose;记住,容器化的目标是环境一致性,一次构建到处运行,别整得太复杂,能用就行。
