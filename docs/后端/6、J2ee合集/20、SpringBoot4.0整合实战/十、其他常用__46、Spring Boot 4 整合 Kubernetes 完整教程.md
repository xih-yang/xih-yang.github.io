# 46、Spring Boot 4 整合 Kubernetes 完整教程
- 来源：https://ddkk.com/springboot/4-action/46.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
部署Spring Boot应用的时候最烦的就是手动管理服务器、配置负载均衡、处理扩容缩容,一堆运维工作搞得人头大;其实Kubernetes这玩意儿就是为了解决这问题,自动管理容器、自动扩缩容、自动故障恢复,真正的云原生平台;但是直接用Kubernetes写YAML,那叫一个复杂,Deployment、Service、ConfigMap、Secret、Probe,一堆资源对象写得人头疼;后来发现Spring Boot 4直接支持Kubernetes,Actuator自动提供健康检查端点,CloudPlatform自动检测Kubernetes环境,零配置就能用;现在Spring Boot 4出来了,整合Kubernetes更是方便得不行,Spring Boot自动检测Kubernetes环境、提供探针端点、支持ConfigMap和Secret,开发部署一条龙;但是很多兄弟不知道里面的门道,也不知道咋写Deployment、配置Service、用ConfigMap、设置Probe、实现HPA这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实Kubernetes在Spring Boot里早就支持了,你只要把应用打包成容器镜像,基本上就能部署;但是很多兄弟不知道里面的门道,也不知道咋写完整的Kubernetes清单、配置Service、用ConfigMap管理配置、设置健康检查探针、实现自动扩缩容这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Kubernetes基础概念

### Kubernetes是啥玩意儿

Kubernetes(简称K8s)是一个开源的容器编排平台,用于自动化部署、扩展和管理容器化应用;Kubernetes的核心特性包括:

1. **自动化部署**: 自动部署和更新应用,支持滚动更新和回滚
2. **自动扩缩容**: 根据CPU、内存等指标自动调整Pod数量
3. **服务发现**: 自动为Pod分配IP和DNS名称,支持服务发现
4. **负载均衡**: 自动在多个Pod实例间分配流量
5. **自愈能力**: 自动重启失败的容器,替换不健康的节点
6. **配置管理**: 通过ConfigMap和Secret管理配置和敏感信息
7. **存储编排**: 自动挂载存储系统,支持多种存储类型
8. **滚动更新**: 零停机时间更新应用

### Kubernetes和Docker Compose的区别

1. **规模**: Kubernetes适合大规模生产环境;Docker Compose适合小规模开发环境
2. **功能**: Kubernetes提供完整的容器编排功能;Docker Compose主要管理多容器应用
3. **高可用**: Kubernetes支持多节点集群和高可用;Docker Compose单机运行
4. **自动扩缩容**: Kubernetes支持HPA自动扩缩容;Docker Compose需要手动调整
5. **服务发现**: Kubernetes内置服务发现;Docker Compose使用服务名
6. **配置管理**: Kubernetes有ConfigMap和Secret;Docker Compose使用环境变量和文件

### Kubernetes的核心概念

1. **Pod**: 最小的部署单元,包含一个或多个容器,共享网络和存储
2. **Deployment**: 管理Pod的副本和更新策略,支持滚动更新和回滚
3. **Service**: 为Pod提供稳定的网络访问,支持负载均衡
4. **ConfigMap**: 存储非敏感的配置数据,如配置文件、环境变量
5. **Secret**: 存储敏感信息,如密码、密钥、证书
6. **Namespace**: 虚拟集群,用于资源隔离和组织
7. **Node**: 集群中的工作节点,运行Pod
8. **Cluster**: 由多个Node组成的Kubernetes集群
9. **Label**: 键值对,用于组织和选择资源
10. **Selector**: 用于选择匹配Label的资源

### Kubernetes适用场景

1. **微服务架构**: 每个微服务独立部署和扩展
2. **云原生应用**: 容器化应用在云平台运行
3. **大规模部署**: 需要管理大量容器和服务的场景
4. **高可用系统**: 需要自动故障恢复和负载均衡
5. **CI/CD集成**: 与CI/CD工具集成,自动化部署流程
6. **多环境管理**: 统一管理开发、测试、生产环境

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-k8s-demo/
├── pom.xml                          # Maven配置文件
├── Dockerfile                       # Docker镜像构建文件
├── k8s/                             # Kubernetes清单目录
│   ├── deployment.yaml              # Deployment配置
│   ├── service.yaml                 # Service配置
│   ├── configmap.yaml               # ConfigMap配置
│   ├── secret.yaml                  # Secret配置
│   └── ingress.yaml                 # Ingress配置(可选)
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java                    # 启动类
│   │   │               ├── controller/                        # 控制器目录
│   │   │               │   └── HelloController.java           # 示例控制器
│   │   │               └── config/                             # 配置类目录(可选)
│   │   └── resources/
│   │       ├── application.yml                   # 配置文件
│   │       └── application-k8s.yml                # Kubernetes环境配置
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       └── ApplicationTest.java # 测试类(可选)
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot Actuator已经内置了Kubernetes探针支持。

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
    <artifactId>spring-boot-k8s-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Kubernetes Demo</name>
    <description>Spring Boot 4整合Kubernetes容器编排示例项目</description>
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
        <!-- Spring Boot Actuator: 提供健康检查、监控等端点,支持Kubernetes探针 -->
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
                    </image>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 创建Spring Boot应用

创建一个简单的Spring Boot应用,用于演示Kubernetes部署:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * Spring Boot应用启动类
 * 用于演示Kubernetes部署
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
        return "Hello from Spring Boot 4 in Kubernetes!";
    }
    /**
     * 获取应用信息
     * 返回Java版本和系统信息
     */
    @GetMapping("/info")
    public String info() {
        return String.format(
            "Java Version: %s, OS: %s, Hostname: %s", 
            System.getProperty("java.version"),
            System.getProperty("os.name"),
            System.getenv().getOrDefault("HOSTNAME", "unknown")
        );
    }
}
```

### 配置文件

创建应用配置文件,支持Kubernetes环境:

```yaml
# application.yml - 主配置文件
server:
  port: 8080  # 应用端口
spring:
  application:
    name: spring-boot-k8s-demo  # 应用名称
# Actuator配置: 暴露健康检查端点,支持Kubernetes探针
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics  # 暴露健康检查、信息、指标端点
  endpoint:
    health:
      show-details: always  # 显示健康检查详情
      probes:
        enabled: true  # 启用Kubernetes探针端点
  # Kubernetes探针配置
  kubernetes:
    probes:
      liveness:
        enabled: true  # 启用存活探针
        path: /actuator/health/liveness  # 存活探针路径
      readiness:
        enabled: true  # 启用就绪探针
        path: /actuator/health/readiness  # 就绪探针路径
```

```yaml
# application-k8s.yml - Kubernetes环境配置
server:
  port: 8080  # 容器内端口
spring:
  profiles:
    active: k8s  # 激活Kubernetes环境配置
  # Kubernetes环境自动检测
  main:
    cloud-platform: kubernetes  # 明确指定Kubernetes平台
# 日志配置: 容器环境使用控制台输出
logging:
  level:
    root: INFO
    com.example: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

## Kubernetes清单文件

### Deployment配置

Deployment是Kubernetes中最重要的资源,用于管理Pod的副本和更新策略:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1  # API版本
kind: Deployment  # 资源类型
metadata:
  name: spring-boot-app  # Deployment名称
  namespace: default  # 命名空间(可选,默认default)
  labels:
    app: spring-boot-app  # 标签,用于选择器匹配
    version: v1.0.0  # 版本标签
spec:
  replicas: 3  # Pod副本数量,确保高可用
  selector:
    matchLabels:
      app: spring-boot-app  # 选择器,匹配Pod标签
  template:
    metadata:
      labels:
        app: spring-boot-app  # Pod标签,必须匹配selector
        version: v1.0.0
    spec:
      containers:
      - name: spring-boot-app  # 容器名称
        image: myregistry.com/spring-boot-k8s-demo:1.0.0  # 容器镜像
        imagePullPolicy: IfNotPresent  # 镜像拉取策略: Always(总是拉取)、IfNotPresent(不存在时拉取)、Never(从不拉取)
        ports:
        - name: http  # 端口名称
          containerPort: 8080  # 容器端口
          protocol: TCP  # 协议类型
        # 环境变量配置
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "k8s"
        - name: JAVA_OPTS
          value: "-Xms256m -Xmx512m -XX:+UseG1GC"
        # 从ConfigMap读取配置
        envFrom:
        - configMapRef:
            name: app-config  # ConfigMap名称
        # 从Secret读取敏感信息
        - secretRef:
            name: app-secret  # Secret名称
        # 资源限制: 防止资源耗尽
        resources:
          requests:  # 资源请求,调度器保证的最小资源
            memory: "256Mi"
            cpu: "250m"  # 250毫核,即0.25核
          limits:  # 资源限制,容器最大可用资源
            memory: "512Mi"
            cpu: "500m"  # 500毫核,即0.5核
        # 存活探针: 检查容器是否还在运行
        livenessProbe:
          httpGet:  # HTTP GET探针
            path: /actuator/health/liveness  # 探针路径
            port: 8080  # 探针端口
          initialDelaySeconds: 60  # 初始延迟,容器启动后60秒开始检查
          periodSeconds: 10  # 检查周期,每10秒检查一次
          timeoutSeconds: 5  # 超时时间,5秒内无响应视为失败
          successThreshold: 1  # 成功阈值,1次成功视为健康
          failureThreshold: 3  # 失败阈值,连续3次失败重启容器
        # 就绪探针: 检查容器是否准备好接收流量
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30  # 初始延迟30秒
          periodSeconds: 10  # 每10秒检查一次
          timeoutSeconds: 5  # 超时5秒
          successThreshold: 1  # 1次成功视为就绪
          failureThreshold: 3  # 连续3次失败从Service移除
        # 启动探针: 检查容器是否启动完成(可选,用于慢启动应用)
        startupProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 0  # 立即开始检查
          periodSeconds: 10  # 每10秒检查一次
          timeoutSeconds: 5  # 超时5秒
          successThreshold: 1  # 1次成功视为启动完成
          failureThreshold: 30  # 最多检查30次(5分钟)
      # 重启策略: Always(总是重启)、OnFailure(失败时重启)、Never(从不重启)
      restartPolicy: Always
      # 镜像拉取密钥(如果使用私有镜像仓库)
      # imagePullSecrets:
      # - name: registry-secret
```

### Service配置

Service为Pod提供稳定的网络访问,支持负载均衡:

```yaml
# k8s/service.yaml
apiVersion: v1  # API版本
kind: Service  # 资源类型
metadata:
  name: spring-boot-service  # Service名称
  namespace: default
  labels:
    app: spring-boot-app
spec:
  type: ClusterIP  # Service类型: ClusterIP(集群内部)、NodePort(节点端口)、LoadBalancer(负载均衡器)、ExternalName(外部名称)
  selector:
    app: spring-boot-app  # 选择器,匹配Pod标签
  ports:
  - name: http  # 端口名称
    port: 80  # Service端口
    targetPort: 8080  # 目标端口,Pod的容器端口
    protocol: TCP  # 协议类型
  # 会话亲和性: ClientIP(基于客户端IP)、None(无)
  sessionAffinity: None
  # 会话超时时间(秒)
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

### ConfigMap配置

ConfigMap用于存储非敏感的配置数据:

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config  # ConfigMap名称
  namespace: default
data:
  # 键值对形式的配置
  application.properties: |
    server.port=8080
    spring.application.name=spring-boot-k8s-demo
    logging.level.root=INFO
    logging.level.com.example=DEBUG
  # YAML格式的配置
  application.yml: |
    server:
      port: 8080
    spring:
      application:
        name: spring-boot-k8s-demo
    logging:
      level:
        root: INFO
        com.example: DEBUG
  # 环境变量形式的配置
  database.host: "mysql-service"
  database.port: "3306"
  database.name: "springboot_db"
  redis.host: "redis-service"
  redis.port: "6379"
```

### Secret配置

Secret用于存储敏感信息,如密码、密钥、证书:

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret  # Secret名称
  namespace: default
type: Opaque  # Secret类型: Opaque(用户自定义)、kubernetes.io/dockerconfigjson(Docker镜像仓库)、kubernetes.io/tls(TLS证书)
data:
  # Base64编码的值(注意:这不是加密,只是编码)
  # 编码命令: echo -n 'value' | base64
  database.username: c3ByaW5nYm9vdA==  # springboot
  database.password: c3ByaW5ndGVzdDEyMw==  # springtest123
  api.key: YWJjZGVmZ2hpams=  # abcdefghijk
stringData:
  # 直接使用明文,会自动Base64编码
  database.url: "jdbc:mysql://mysql-service:3306/springboot_db"
  redis.password: "redis123"
```

### Ingress配置

Ingress用于暴露HTTP/HTTPS服务到集群外部:

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spring-boot-ingress
  namespace: default
  annotations:
    # Ingress控制器特定注解
    kubernetes.io/ingress.class: "nginx"  # 使用nginx ingress控制器
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  # TLS配置(可选)
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-secret  # TLS证书Secret
  rules:
  - host: app.example.com  # 域名
    http:
      paths:
      - path: /  # 路径
        pathType: Prefix  # 路径类型: Exact(精确匹配)、Prefix(前缀匹配)、ImplementationSpecific(实现特定)
        backend:
          service:
            name: spring-boot-service  # 后端Service
            port:
              number: 80  # Service端口
```

## Spring Boot 4 Kubernetes特性

### 自动环境检测

Spring Boot 4可以自动检测Kubernetes环境,通过检查环境变量`*_SERVICE_HOST`和`*_SERVICE_PORT`:

```java
package com.example.demo.config;
import org.springframework.boot.cloud.CloudPlatform;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
/**
 * Kubernetes环境检测配置
 * Spring Boot会自动检测Kubernetes环境
 */
@Configuration
public class KubernetesConfig {
    /**
     * 检查是否运行在Kubernetes环境中
     */
    public boolean isKubernetes(Environment env) {
        // Spring Boot自动检测Kubernetes环境
        // 通过检查环境变量 *_SERVICE_HOST 和 *_SERVICE_PORT
        return CloudPlatform.getActive(env) == CloudPlatform.KUBERNETES;
    }
}
```

### Actuator健康探针

Spring Boot 4的Actuator提供了专门的Kubernetes探针端点:

```yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true  # 启用Kubernetes探针端点
  kubernetes:
    probes:
      liveness:
        enabled: true  # 启用存活探针
        path: /actuator/health/liveness
      readiness:
        enabled: true  # 启用就绪探针
        path: /actuator/health/readiness
```

探针端点说明:

1. **存活探针(Liveness Probe)**: `/actuator/health/liveness`

- 检查应用是否还在运行
- 失败时Kubernetes会重启容器
- 用于检测死锁、内存泄漏等问题
2. **就绪探针(Readiness Probe)**: `/actuator/health/readiness`

- 检查应用是否准备好接收流量
- 失败时从Service移除,不再接收流量
- 用于检测应用启动、数据库连接等问题

### 应用可用性状态管理

Spring Boot 4提供了应用可用性状态管理,可以手动控制应用状态:

```java
package com.example.demo.config;
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
/**
 * 应用可用性状态管理
 * 可以手动控制应用的存活和就绪状态
 */
@Component
public class AvailabilityStateManager {
    private final ApplicationEventPublisher eventPublisher;
    public AvailabilityStateManager(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }
    /**
     * 设置应用为拒绝流量状态
     * 用于优雅关闭、维护等场景
     */
    public void refuseTraffic() {
        AvailabilityChangeEvent.publish(eventPublisher, this, ReadinessState.REFUSING_TRAFFIC);
    }
    /**
     * 设置应用为接受流量状态
     */
    public void acceptTraffic() {
        AvailabilityChangeEvent.publish(eventPublisher, this, ReadinessState.ACCEPTING_TRAFFIC);
    }
    /**
     * 监听就绪状态变化
     */
    @EventListener
    public void onReadinessStateChange(AvailabilityChangeEvent<ReadinessState> event) {
        ReadinessState state = event.getState();
        if (state == ReadinessState.ACCEPTING_TRAFFIC) {
            // 应用已就绪,可以接收流量
            System.out.println("Application is ready to accept traffic");
        } else if (state == ReadinessState.REFUSING_TRAFFIC) {
            // 应用拒绝流量,可能正在关闭或维护
            System.out.println("Application is refusing traffic");
        }
    }
    /**
     * 监听存活状态变化
     */
    @EventListener
    public void onLivenessStateChange(AvailabilityChangeEvent<LivenessState> event) {
        LivenessState state = event.getState();
        if (state == LivenessState.CORRECT) {
            // 应用正常运行
            System.out.println("Application is alive");
        } else if (state == LivenessState.BROKEN) {
            // 应用已损坏,需要重启
            System.out.println("Application is broken, needs restart");
        }
    }
}
```

### ConfigMap和Secret集成

Spring Boot 4支持从ConfigMap和Secret读取配置:

```yaml
# application.yml
spring:
  config:
    import:
      # 从ConfigMap挂载的目录读取配置
      - configtree:/etc/config/
      # 从Secret挂载的目录读取配置
      - configtree:/etc/secret/
```

在Deployment中挂载ConfigMap和Secret:

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: spring-boot-app
        # 挂载ConfigMap为文件
        volumeMounts:
        - name: config-volume
          mountPath: /etc/config
          readOnly: true
        - name: secret-volume
          mountPath: /etc/secret
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: app-config
      - name: secret-volume
        secret:
          secretName: app-secret
```

## 部署到Kubernetes

### 构建Docker镜像

首先需要将Spring Boot应用打包成Docker镜像:

```dockerfile
# Dockerfile
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY target/spring-boot-k8s-demo-1.0.0.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+UseContainerSupport"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

构建和推送镜像:

```bash
# 构建镜像
docker build -t myregistry.com/spring-boot-k8s-demo:1.0.0 .
# 推送镜像到仓库
docker push myregistry.com/spring-boot-k8s-demo:1.0.0
```

### 应用Kubernetes清单

使用kubectl命令应用Kubernetes清单:

```bash
# 创建ConfigMap
kubectl apply -f k8s/configmap.yaml
# 创建Secret
kubectl apply -f k8s/secret.yaml
# 创建Deployment
kubectl apply -f k8s/deployment.yaml
# 创建Service
kubectl apply -f k8s/service.yaml
# 创建Ingress(可选)
kubectl apply -f k8s/ingress.yaml
# 或者一次性应用所有清单
kubectl apply -f k8s/
```

### 查看部署状态

```bash
# 查看Deployment状态
kubectl get deployment spring-boot-app
# 查看Pod状态
kubectl get pods -l app=spring-boot-app
# 查看Pod详细信息
kubectl describe pod <pod-name>
# 查看Pod日志
kubectl logs <pod-name>
# 实时查看Pod日志
kubectl logs -f <pod-name>
# 查看Service
kubectl get service spring-boot-service
# 查看所有资源
kubectl get all -l app=spring-boot-app
```

### 测试应用

```bash
# 端口转发,访问应用
kubectl port-forward service/spring-boot-service 8080:80
# 在另一个终端测试
curl http://localhost:8080/
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/health/liveness
curl http://localhost:8080/actuator/health/readiness
```

## 高级配置

### 滚动更新策略

配置Deployment的滚动更新策略:

```yaml
# k8s/deployment.yaml
spec:
  strategy:
    type: RollingUpdate  # 滚动更新策略
    rollingUpdate:
      maxSurge: 1  # 最大激增Pod数,更新时允许超过期望副本数
      maxUnavailable: 0  # 最大不可用Pod数,更新时允许不可用的Pod数
  # 或者使用Recreate策略(先删除旧Pod,再创建新Pod,会有短暂停机)
  # strategy:
  #   type: Recreate
```

### 资源配额和限制

配置命名空间的资源配额:

```yaml
# k8s/resourcequota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: app-quota
  namespace: default
spec:
  hard:
    requests.cpu: "4"  # CPU请求总量
    requests.memory: 8Gi  # 内存请求总量
    limits.cpu: "8"  # CPU限制总量
    limits.memory: 16Gi  # 内存限制总量
    pods: "10"  # Pod数量限制
```

### 水平 Pod 自动扩缩容(HPA)

根据CPU和内存使用率自动调整Pod数量:

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spring-boot-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spring-boot-app  # 目标Deployment
  minReplicas: 2  # 最小副本数
  maxReplicas: 10  # 最大副本数
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # CPU使用率目标70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80  # 内存使用率目标80%
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 缩容稳定窗口5分钟
      policies:
      - type: Percent
        value: 50  # 每次最多缩容50%
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # 扩容立即执行
      policies:
      - type: Percent
        value: 100  # 每次最多扩容100%
        periodSeconds: 15
      - type: Pods
        value: 2  # 每次最多增加2个Pod
        periodSeconds: 15
      selectPolicy: Max  # 选择最大扩容策略
```

应用HPA:

```bash
# 应用HPA配置
kubectl apply -f k8s/hpa.yaml
# 查看HPA状态
kubectl get hpa spring-boot-hpa
# 查看HPA详细信息
kubectl describe hpa spring-boot-hpa
```

### Pod Disruption Budget(PDB)

确保在维护期间至少有一定数量的Pod可用:

```yaml
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: spring-boot-pdb
  namespace: default
spec:
  minAvailable: 2  # 最少可用Pod数
  # 或者使用maxUnavailable
  # maxUnavailable: 1  # 最多不可用Pod数
  selector:
    matchLabels:
      app: spring-boot-app
```

### 节点选择器和亲和性

将Pod调度到特定节点:

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      # 节点选择器: Pod必须调度到有这些标签的节点
      nodeSelector:
        disktype: ssd
        zone: us-west-1
      # 节点亲和性: 更灵活的调度规则
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:  # 硬性要求
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
          preferredDuringSchedulingIgnoredDuringExecution:  # 软性偏好
          - weight: 100
            preference:
              matchExpressions:
              - key: node-type
                operator: In
                values:
                - compute-optimized
        # Pod亲和性: 与其他Pod一起调度
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - database
            topologyKey: kubernetes.io/hostname
        # Pod反亲和性: 避免与其他Pod一起调度
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - spring-boot-app
              topologyKey: kubernetes.io/hostname
```

### 容忍度和污点

允许Pod调度到有污点的节点:

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      tolerations:
      - key: "special"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"  # 污点效果: NoSchedule(不调度)、PreferNoSchedule(尽量不调度)、NoExecute(驱逐)
```

### Init容器

在应用容器启动前执行初始化任务:

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      # Init容器: 在应用容器启动前运行
      initContainers:
      - name: init-db
        image: busybox:1.35
        command: ['sh', '-c']
        args:
        - |
          echo "Waiting for database..."
          until nc -z mysql-service 3306; do
            sleep 2
          done
          echo "Database is ready!"
      containers:
      - name: spring-boot-app
        # 应用容器
```

### Sidecar容器

在同一个Pod中运行辅助容器:

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: spring-boot-app
        # 主应用容器
      - name: log-collector
        # Sidecar容器: 收集日志
        image: fluent/fluent-bit:latest
        volumeMounts:
        - name: log-volume
          mountPath: /var/log/app
      volumes:
      - name: log-volume
        emptyDir: {}
```

## 监控和日志

### Prometheus监控

配置Prometheus监控Spring Boot应用:

```yaml
# k8s/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: spring-boot-monitor
  namespace: default
spec:
  selector:
    matchLabels:
      app: spring-boot-app
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 30s
```

### 日志收集

使用Fluentd或Fluent Bit收集日志:

```yaml
# k8s/fluentd-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
    </match>
```

## 故障排查

### 查看Pod状态

```bash
# 查看Pod状态
kubectl get pods -l app=spring-boot-app
# 查看Pod详细信息
kubectl describe pod <pod-name>
# 查看Pod事件
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### 查看日志

```bash
# 查看Pod日志
kubectl logs <pod-name>
# 查看前100行日志
kubectl logs <pod-name> --tail=100
# 实时查看日志
kubectl logs -f <pod-name>
# 查看多个Pod的日志
kubectl logs -l app=spring-boot-app
# 查看上一个容器的日志(如果容器重启)
kubectl logs <pod-name> --previous
```

### 进入Pod调试

```bash
# 进入Pod执行命令
kubectl exec -it <pod-name> -- sh
# 在Pod中执行命令
kubectl exec <pod-name> -- env
kubectl exec <pod-name> -- ps aux
kubectl exec <pod-name> -- netstat -tulpn
```

### 常见问题

1. **Pod一直Pending**: 检查节点资源、节点选择器、污点容忍度
2. **Pod一直CrashLoopBackOff**: 查看日志,检查应用配置、资源限制
3. **Service无法访问**: 检查Service选择器、Pod标签、端口配置
4. **探针失败**: 检查探针路径、端口、超时时间
5. **镜像拉取失败**: 检查镜像名称、镜像拉取密钥、网络连接

## 最佳实践

1. **使用标签和选择器**: 合理使用标签组织资源
2. **配置资源限制**: 设置合理的资源请求和限制
3. **使用探针**: 配置存活和就绪探针,确保应用健康
4. **滚动更新**: 使用滚动更新策略,零停机部署
5. **配置HPA**: 根据负载自动扩缩容
6. **使用ConfigMap和Secret**: 分离配置和代码
7. **日志收集**: 集中收集和管理日志
8. **监控告警**: 配置监控和告警,及时发现问题
9. **安全配置**: 使用非root用户、最小权限原则
10. **备份恢复**: 定期备份重要数据,测试恢复流程

## kubectl命令详解

### 基础命令

```bash
# 查看集群信息
kubectl cluster-info
# 查看节点
kubectl get nodes
# 查看节点详细信息
kubectl describe node <node-name>
# 查看所有命名空间
kubectl get namespaces
kubectl get ns
# 创建命名空间
kubectl create namespace <namespace-name>
# 切换命名空间上下文
kubectl config set-context --current --namespace=<namespace-name>
```

### 资源管理命令

```bash
# 应用YAML文件
kubectl apply -f <file.yaml>
kubectl apply -f <directory>/
# 创建资源
kubectl create -f <file.yaml>
# 删除资源
kubectl delete -f <file.yaml>
kubectl delete deployment <deployment-name>
kubectl delete pod <pod-name>
# 强制删除
kubectl delete pod <pod-name> --force --grace-period=0
# 编辑资源
kubectl edit deployment <deployment-name>
# 查看资源
kubectl get <resource-type>
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get configmaps
kubectl get secrets
# 查看所有资源
kubectl get all
# 查看资源详细信息
kubectl describe <resource-type> <resource-name>
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>
# 查看资源YAML
kubectl get <resource-type> <resource-name> -o yaml
kubectl get pod <pod-name> -o yaml
# 查看资源JSON
kubectl get <resource-type> <resource-name> -o json
# 查看资源列表(宽格式)
kubectl get pods -o wide
```

### Pod操作命令

```bash
# 查看Pod
kubectl get pods
kubectl get pods -l app=spring-boot-app  # 按标签筛选
kubectl get pods -n <namespace>  # 指定命名空间
kubectl get pods --all-namespaces  # 所有命名空间
# 查看Pod详细信息
kubectl describe pod <pod-name>
# 查看Pod日志
kubectl logs <pod-name>
kubectl logs <pod-name> -c <container-name>  # 多容器Pod指定容器
kubectl logs <pod-name> --previous  # 查看上一个容器的日志
kubectl logs <pod-name> --tail=100  # 查看最后100行
kubectl logs <pod-name> -f  # 实时查看日志
kubectl logs -l app=spring-boot-app  # 查看所有匹配标签的Pod日志
# 进入Pod执行命令
kubectl exec -it <pod-name> -- sh
kubectl exec <pod-name> -- env
kubectl exec <pod-name> -- ps aux
# 复制文件到Pod
kubectl cp <local-file> <pod-name>:/path/to/destination
# 从Pod复制文件
kubectl cp <pod-name>:/path/to/file <local-file>
# 端口转发
kubectl port-forward pod/<pod-name> 8080:8080
kubectl port-forward service/<service-name> 8080:80
kubectl port-forward deployment/<deployment-name> 8080:8080
```

### Deployment操作命令

```bash
# 查看Deployment
kubectl get deployments
kubectl get deploy
# 查看Deployment详细信息
kubectl describe deployment <deployment-name>
# 扩缩容
kubectl scale deployment <deployment-name> --replicas=5
# 滚动更新
kubectl set image deployment/<deployment-name> <container-name>=<new-image>
kubectl rollout status deployment/<deployment-name>
kubectl rollout history deployment/<deployment-name>
kubectl rollout undo deployment/<deployment-name>  # 回滚到上一个版本
kubectl rollout undo deployment/<deployment-name> --to-revision=2  # 回滚到指定版本
# 暂停/恢复滚动更新
kubectl rollout pause deployment/<deployment-name>
kubectl rollout resume deployment/<deployment-name>
```

### Service操作命令

```bash
# 查看Service
kubectl get services
kubectl get svc
# 查看Service详细信息
kubectl describe service <service-name>
# 查看Service端点
kubectl get endpoints <service-name>
```

### ConfigMap和Secret操作

```bash
# 查看ConfigMap
kubectl get configmaps
kubectl get cm
# 查看ConfigMap内容
kubectl get configmap <configmap-name> -o yaml
# 创建ConfigMap
kubectl create configmap <name> --from-file=<file>
kubectl create configmap <name> --from-literal=key=value
# 查看Secret
kubectl get secrets
# 查看Secret内容(解码)
kubectl get secret <secret-name> -o jsonpath='{.data.password}' | base64 -d
# 创建Secret
kubectl create secret generic <name> --from-literal=username=admin --from-literal=password=secret
kubectl create secret tls <name> --cert=<cert-file> --key=<key-file>
```

### 调试和故障排查

```bash
# 查看事件
kubectl get events
kubectl get events --sort-by='.lastTimestamp'
kubectl get events --field-selector involvedObject.name=<pod-name>
# 查看资源使用情况
kubectl top nodes
kubectl top pods
kubectl top pod <pod-name>
# 查看API资源
kubectl api-resources
kubectl api-versions
# 查看资源定义
kubectl explain <resource-type>
kubectl explain pod.spec.containers
# 验证YAML文件
kubectl apply --dry-run=client -f <file.yaml>
kubectl diff -f <file.yaml>
```

## 网络配置详解

### Service类型详解

#### ClusterIP(默认)

集群内部访问,不暴露到外部:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spring-boot-service
spec:
  type: ClusterIP  # 默认类型
  selector:
    app: spring-boot-app
  ports:
  - port: 80
    targetPort: 8080
```

#### NodePort

通过节点IP和端口访问:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spring-boot-service
spec:
  type: NodePort
  selector:
    app: spring-boot-app
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # 节点端口(30000-32767)
```

#### LoadBalancer

使用云提供商的负载均衡器:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spring-boot-service
spec:
  type: LoadBalancer
  selector:
    app: spring-boot-app
  ports:
  - port: 80
    targetPort: 8080
```

#### ExternalName

返回外部服务的CNAME:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-service
spec:
  type: ExternalName
  externalName: external.example.com
```

### Ingress配置详解

#### Nginx Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spring-boot-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-secret
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: spring-boot-service
            port:
              number: 80
```

#### 多路径Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-path-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /web
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### 网络策略(NetworkPolicy)

限制Pod之间的网络通信:

```yaml
# k8s/networkpolicy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: spring-boot-netpol
spec:
  podSelector:
    matchLabels:
      app: spring-boot-app
  policyTypes:
  - Ingress  # 入站规则
  - Egress   # 出站规则
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    - namespaceSelector:
        matchLabels:
          name: production
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 3306
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53  # DNS
```

## 存储配置详解

### PersistentVolume和PersistentVolumeClaim

#### 创建StorageClass

```yaml
# k8s/storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
volumeBindingMode: WaitForFirstConsumer  # 延迟绑定
allowVolumeExpansion: true  # 允许扩容
```

#### 创建PersistentVolumeClaim

```yaml
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data-pvc
spec:
  accessModes:
  - ReadWriteOnce  # 访问模式: ReadWriteOnce(单节点读写)、ReadOnlyMany(多节点只读)、ReadWriteMany(多节点读写)
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 10Gi  # 存储大小
```

#### 在Deployment中使用PVC

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: spring-boot-app
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: app-data-pvc
```

### ConfigMap和Secret作为卷

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: spring-boot-app
        volumeMounts:
        - name: config-volume
          mountPath: /etc/config
          readOnly: true
        - name: secret-volume
          mountPath: /etc/secret
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: app-config
          items:  # 选择性挂载
          - key: application.yml
            path: application.yml
      - name: secret-volume
        secret:
          secretName: app-secret
          defaultMode: 0400  # 文件权限
```

## 安全配置详解

### ServiceAccount和RBAC

#### 创建ServiceAccount

```yaml
# k8s/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spring-boot-sa
  namespace: default
```

#### 创建Role

```yaml
# k8s/role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: spring-boot-role
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "update"]
```

#### 创建RoleBinding

```yaml
# k8s/rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: spring-boot-rolebinding
  namespace: default
subjects:
- kind: ServiceAccount
  name: spring-boot-sa
  namespace: default
roleRef:
  kind: Role
  name: spring-boot-role
  apiGroup: rbac.authorization.k8s.io
```

#### 在Deployment中使用ServiceAccount

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      serviceAccountName: spring-boot-sa
      containers:
      - name: spring-boot-app
```

### Pod安全策略

```yaml
# k8s/podsecuritypolicy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: spring-boot-psp
spec:
  privileged: false  # 不允许特权容器
  allowPrivilegeEscalation: false  # 不允许权限提升
  requiredDropCapabilities:
  - ALL  # 删除所有能力
  volumes:
  - 'configMap'
  - 'secret'
  - 'emptyDir'
  hostNetwork: false  # 不允许使用主机网络
  hostIPC: false  # 不允许使用主机IPC
  hostPID: false  # 不允许使用主机PID
  runAsUser:
    rule: 'MustRunAsNonRoot'  # 必须非root用户运行
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true  # 只读根文件系统
```

### 安全上下文

在Pod和容器级别设置安全上下文:

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      # Pod级别安全上下文
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: spring-boot-app
        # 容器级别安全上下文
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
            add:
            - NET_BIND_SERVICE
```

## CI/CD集成

### GitHub Actions示例

```yaml
# .github/workflows/k8s-deploy.yml
name: Build and Deploy to Kubernetes
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
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
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    - name: Set up kubectl
      uses: azure/setup-kubectl@v2
    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=./kubeconfig
        
    - name: Deploy to Kubernetes
      run: |
        export KUBECONFIG=./kubeconfig
        # 更新镜像版本
        sed -i "s|image:.*|image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}|g" k8s/deployment.yaml
        kubectl apply -f k8s/
        kubectl rollout status deployment/spring-boot-app
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
  KUBERNETES_NAMESPACE: production
build:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn clean package -DskipTests
  artifacts:
    paths:
      - target/*.jar
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
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context $KUBERNETES_CONTEXT
    - sed -i "s|image:.*|image: $DOCKER_IMAGE|g" k8s/deployment.yaml
    - kubectl apply -f k8s/ -n $KUBERNETES_NAMESPACE
    - kubectl rollout status deployment/spring-boot-app -n $KUBERNETES_NAMESPACE
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
        KUBERNETES_NAMESPACE = 'production'
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
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                        sed -i 's|image:.*|image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}|g' k8s/deployment.yaml
                        kubectl apply -f k8s/ -n ${KUBERNETES_NAMESPACE}
                        kubectl rollout status deployment/spring-boot-app -n ${KUBERNETES_NAMESPACE}
                    """
                }
            }
        }
    }
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment succeeded!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
```

## 监控和告警

### Prometheus监控配置

```yaml
# k8s/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: spring-boot-monitor
  namespace: default
spec:
  selector:
    matchLabels:
      app: spring-boot-app
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 30s
    scrapeTimeout: 10s
```

### Grafana仪表板

```yaml
# k8s/grafana-dashboard.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard-spring-boot
  namespace: monitoring
data:
  spring-boot-dashboard.json: |
    {
      "dashboard": {
        "title": "Spring Boot Application",
        "panels": [
          {
            "title": "JVM Memory",
            "targets": [
              {
                "expr": "jvm_memory_used_bytes{application=\"spring-boot-app\"}"
              }
            ]
          }
        ]
      }
    }
```

### AlertManager告警规则

```yaml
# k8s/prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: spring-boot-alerts
spec:
  groups:
  - name: spring-boot
    rules:
    - alert: HighMemoryUsage
      expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage"
        description: "Memory usage is above 90%"
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[5m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod is crash looping"
```

## 多环境部署

### 开发环境配置

```yaml
# k8s/dev/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
  namespace: development
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: spring-boot-app
        image: myregistry.com/spring-boot-k8s-demo:dev
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "dev"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### 生产环境配置

```yaml
# k8s/prod/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
  namespace: production
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: spring-boot-app
        image: myregistry.com/spring-boot-k8s-demo:1.0.0
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## 实际项目案例

### 案例1: 微服务架构部署

完整的微服务系统Kubernetes配置:

```yaml
# k8s/microservices/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: microservices
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: myregistry.com/user-service:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "k8s"
        - name: EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE
          value: "http://eureka-service:8761/eureka/"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: microservices
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 8080
```

### 案例2: 高可用生产环境

包含HPA、PDB、监控的完整配置:

```yaml
# k8s/prod/complete-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
  namespace: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: spring-boot-app
  template:
    metadata:
      labels:
        app: spring-boot-app
    spec:
      serviceAccountName: spring-boot-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: spring-boot-app
        image: myregistry.com/spring-boot-k8s-demo:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - spring-boot-app
              topologyKey: kubernetes.io/hostname
```

## 故障排查详细指南

### Pod问题排查

#### Pod一直Pending

```bash
# 查看Pod状态
kubectl describe pod <pod-name>
# 常见原因:
# 1. 节点资源不足
kubectl describe node <node-name>
# 2. 节点选择器不匹配
kubectl get nodes --show-labels
# 3. 污点容忍度不匹配
kubectl describe node <node-name> | grep Taints
# 4. PVC未绑定
kubectl get pvc
```

#### Pod一直CrashLoopBackOff

```bash
# 查看Pod日志
kubectl logs <pod-name> --previous
# 查看Pod事件
kubectl describe pod <pod-name>
# 常见原因:
# 1. 应用启动失败
# 2. 配置错误
# 3. 资源限制过小
# 4. 健康检查失败
```

#### Pod一直ImagePullBackOff

```bash
# 查看Pod详细信息
kubectl describe pod <pod-name>
# 常见原因:
# 1. 镜像不存在
# 2. 镜像拉取密钥错误
# 3. 网络问题
# 4. 镜像仓库认证失败
# 解决方案:
# 1. 检查镜像名称
# 2. 检查imagePullSecrets
kubectl get secret <secret-name>
```

### Service问题排查

```bash
# 查看Service端点
kubectl get endpoints <service-name>
# 如果endpoints为空,检查:
# 1. Service选择器是否匹配Pod标签
kubectl get pods --show-labels
kubectl get service <service-name> -o yaml | grep selector
# 2. Pod是否运行
kubectl get pods -l app=spring-boot-app
# 测试Service连接
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://spring-boot-service:80
```

### 网络问题排查

```bash
# 查看网络策略
kubectl get networkpolicies
# 测试Pod间连接
kubectl run -it --rm debug --image=busybox --restart=Never -- ping <pod-ip>
# 查看DNS解析
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup <service-name>
```

## 性能优化

### JVM参数优化

```yaml
# k8s/deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: spring-boot-app
        env:
        - name: JAVA_OPTS
          value: "-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
```

### 资源请求和限制优化

```yaml
# 根据实际负载调整资源
resources:
  requests:
    memory: "512Mi"  # 根据实际内存使用调整
    cpu: "500m"      # 根据实际CPU使用调整
  limits:
    memory: "1Gi"    # 预留20-30%缓冲
    cpu: "1000m"     # 预留20-30%缓冲
```

### HPA优化

```yaml
# 根据实际负载调整HPA参数
spec:
  minReplicas: 3  # 最小副本数,保证高可用
  maxReplicas: 20  # 最大副本数,根据集群容量调整
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70  # CPU目标使用率
```

## 总结

Spring Boot 4整合Kubernetes容器编排,主要有以下要点:

1. **自动环境检测**: Spring Boot自动检测Kubernetes环境
2. **健康探针**: Actuator提供专门的Kubernetes探针端点
3. **配置管理**: 支持从ConfigMap和Secret读取配置
4. **状态管理**: 可以手动控制应用的可用性状态
5. **云原生特性**: 完全支持云原生应用开发

关键配置:

1. **Deployment**: 管理Pod副本和更新策略
2. **Service**: 提供稳定的网络访问
3. **ConfigMap**: 管理非敏感配置
4. **Secret**: 管理敏感信息
5. **Probe**: 健康检查探针
6. **HPA**: 自动扩缩容

实际使用中,根据项目需求选择合适的配置;简单应用用基础配置,复杂应用用高级特性;记住,Kubernetes的目标是自动化运维,让应用自己管理自己,别整得太复杂,能用就行。
