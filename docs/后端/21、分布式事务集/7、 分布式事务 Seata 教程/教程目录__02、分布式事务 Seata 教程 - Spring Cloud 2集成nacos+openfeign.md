# 02、分布式事务 Seata 教程 - Spring Cloud 2集成nacos+openfeign
- 来源：https://ddkk.com/zhuanlan/transaction/5/2.html
- 分类：分布式事务
- 分组：教程目录
### 版本说明

组件
版本

JDK
1.8

spring boot
2.4.1

spring cloud
2020.0.1

spring cloud alibaba
2.2.5.RELEASE

nacos
1.4.1

seata
1.4.0

mariadb
10.4.2

mybatis plus
3.4.2

### 环境搭建

**1、** 创建父工程seata-demo，删除src目录；

**2、** 创建子模块；

模块
说明

seata-service-account
账户

seata-service-order
订单

seata-service-storage
库存

**1、** 父pom添加相关依赖；

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.example</groupId>
    <artifactId>seata-demo</artifactId>
    <packaging>pom</packaging>
    <version>1.0-SNAPSHOT</version>
    <modules>
        <module>seata-service-account</module>
        <module>seata-service-order</module>
        <module>seata-service-storage</module>
    </modules>
    <properties>
        <java.version>1.8</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <!--Spring-->
        <spring.boot.version>2.4.1</spring.boot.version>
        <spring.cloud.version>2020.0.1</spring.cloud.version>
        <spring.cloud.alibaba.version>2.2.5.RELEASE</spring.cloud.alibaba.version>
    </properties>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>2.2.5.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
            <!-- 使用spring loadbalancer，弃用ribbon -->
            <exclusions>
                <exclusion>
                    <groupId>org.springframework.cloud</groupId>
                    <artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-loadbalancer</artifactId>
        </dependency>
    </dependencies>
    <repositories>
        <repository>
            <id>aliyun-repos</id>
            <url>https://maven.aliyun.com/nexus/content/groups/public/</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>aliyun-plugin</id>
            <url>https://maven.aliyun.com/nexus/content/groups/public/</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
    <build>
        <finalName>${project.name}</finalName>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
            </resource>
            <resource>
                <directory>src/main/java</directory>
                <includes>
                    <include>**/*.xml</include>
                </includes>
            </resource>
        </resources>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring.boot.version}</version>
                    <configuration>
                        <fork>true</fork>
                        <finalName>${project.build.finalName}</finalName>
                    </configuration>
                    <executions>
                        <execution>
                            <goals>
                                <goal>repackage</goal>
                            </goals>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>${java.version}</source>
                    <target>${java.version}</target>
                    <encoding>UTF-8</encoding>
                    <compilerArgs>
                        <arg>-parameters</arg>
                    </compilerArgs>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-antrun-plugin</artifactId>
                <version>3.0.0</version>
            </plugin>
            <plugin>
                <groupId>org.commonjava.maven.plugins</groupId>
                <artifactId>directory-maven-plugin</artifactId>
                <version>0.1</version>
            </plugin>
        </plugins>
    </build>
</project>
```

**1、** 各个字模块添加启动类；

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class AccountApp {
    public static void main(String[] args) {
        SpringApplication.run(AccountApp.class, args);
    }
}
```

**1、** 各个字模块添加配置文件，配置端口，服务名，就nacos地址；

```java
server:
  port: 10000
spring:
  application:
    name: seata-service-account
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
```

**1、** seata-service-account模块添加feign测试接口及controller类，通过feign调用order模块接口；

```java
@FeignClient(name = "seata-service-order")
public interface TestFeign {
    @GetMapping("/test")
    void test();
}
```

```java
@RestController
public class TestController {
    @Autowired
    TestFeign testFeign;
    @GetMapping("/test")
    public void test() {
        testFeign.test();
    }
}
```

**1、** seata-service-order添加一个测试controller,供account模块feign调用；

```java
@RestController
public class TestController {
    @GetMapping("/test")
    public void test() {
        System.out.println("seata-service-order");
    }
}
```

**1、** 启动各个服务，访问nacos；

**2、** 调用10000:/test接口，访问正常，搭建完成；
