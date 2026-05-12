# 11、Spring Cloud Config 配置热刷新
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/11.html
- 分类：配置中心
- 分组：教程目录
文章说明：该篇只是作为local环境跑起来，如果是线上，还需要考虑配置文件加密，链接kafka的账号和密码等问题...

## 1、前置条件：kafka 先跑起来（建议使用docker desktop，简单好用，何乐而不为？）

**1.创建一个docker-compose.yml文件** （使用此docker配置需要添加hosts: 127.0.0.1 kafka.local, 127.0.0.1 zookkeeper.local）

```sh
version: '2'
services:
  zookeeper:
    image: "zookeeper"
    hostname: "zookeeper.local"
    container_name: "zookeeper"
   设置网络别名
    networks:
      local:
        aliases:
          - "zookeeper.local"
  kafka:
    image: "wurstmeister/kafka"
    hostname: "kafka.local"
    container_name: "kafka"
    ports:
      - "9092:9092"
    networks:
      local:
        aliases:
          - "kafka.local"
    environment:
      KAFKA_ADVERTISED_HOST_NAME: kafka.local
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
#设置网络，名为local
networks:
  local:
    driver: bridge
```

**2.执行命令** docker-compose up -d (拉取镜像并运行)

**3.第二部执行完之后，打开dockerdesktop 可以看到运行的镜像**

## 4.进入kafka 的docker容器中，创建topic，并发送接受消息，测试kafka是否正常运行

- docker exec -it kafka /bin/bash
- kafka-topics.sh --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic testDemo
- kafka-console-producer.sh --broker-list localhost:9092 --topic testDemo
- kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic testDemo

到这里可以看到，kafka正常运行！

## 2、建立git仓库（这里很简单，只附一张config结构图）

## 3、server 端配置

**1.pom文件**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.5</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.firebit</groupId>
    <artifactId>config-server</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>config-server</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>2021.0.1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-config-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-bootstrap</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-bus-kafka</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**2.application.yml**

```sh
server:
  port: 9999
logging:
  level:
    root: info
spring:
  application:
    name: config-server
  cloud:
    config:
      server:
        git:
          uri: https://gitee.com/你自己的git/cloud-config-server.git
          search-paths: /config/{application}/*,/*
          default-label: develop
    bus:
      enabled: true
      refresh:
        enabled: true
      ack:
        enabled: true
      trace:
        enabled: true
  kafka:
    bootstrap-servers: localhost:9092
management:
  endpoints:
    web:
      exposure:
        include: '*'
```

**3.启动类**

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

## 4、client 端配置

**1.pom文件**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.6</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.firebit</groupId>
    <artifactId>config-client</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>config-client</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>2021.0.1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-bootstrap</artifactId>
            <version>3.0.2</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-bus-kafka</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**2.bootstrap.yml** （profile这个变量是启动参数，自己给个dev，prod之类的就行）

```sh
spring:
  profiles:
    active: ${profile:test}
  application:
    name: config-client
  cloud:
    config:
      fail-fast: true
      uri: http://localhost:9999/
      label: develop
    bus:
      enabled: true
      refresh:
        enabled: true
      ack:
        enabled: true
      trace:
        enabled: true
  kafka:
    bootstrap-servers: localhost:9092
management:
  endpoints:
    web:
      exposure:
        include: '*'
```

**3.application.yml**

```sh
spring:
  profiles:
    active: ${profile:test}
logging:
  level:
    root: info
hello: default
server:
  port: 8080
fire:
  name: li
  age: 18
---
spring:
  config:
    activate:
      on-profile: test
hello: test
server:
  port: 8881
```

**4.controller 测试类**

```java
@Slf4j
@RestController
public class TestController {
    @Autowired
    private EnvProperties envProperties;
    @GetMapping("/test")
    public String getConfig(){
        return envProperties.getName();
    }
}
```

**5.refreshscope 注解类**

```java
@RefreshScope
@ConfigurationProperties(prefix = "fire")
@Component
@Data
public class EnvProperties {
    private String name;
    private Integer age;
}
```

**6.启动类**

```java
@EnableConfigurationProperties
@SpringBootApplication
public class ConfigClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigClientApplication.class, args);
    }
}
```

## 5、测试

**1.访问localhost:8080/test（client 以profile=dev启动）**

这是仓库的dev配置文件的配置，

接口响应是：

可见配置是正确拉取，

**2.修改git仓库的prod配置文件，再次调用localhost:8080/test，会发现响应结果依然是：**

> prod-goodnight

因为此时并未有去做热刷新啊，这是符合预期的

**3.接着去call server端的 refresh接口，localhost:9999/actuator/busrefresh**

这个是没有响应内容的，只是返回200

**4.再去调用localhost:8080/test，会发现响应内容是你刚刚修改的内容了，此时便是进行了配置的热刷新**

**5.测试完毕**

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
