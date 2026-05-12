# 14、Spring Boot - 中度量指标监控与健康检查
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/14.html
- 分类：J2EE框架
- 分组：教程目录
## 1.使用 Actuator 检查与监控

### 1.创建项目

### 2.需改 POM 文件，添加依赖

### 2.需改 POM 文件，添加依赖

org.springframework.boot
spring-boot-starter-actuator

### 3.修改配置文件

```SH
#配置访问端点的根路径 
management.endpoints.web.base-path=/actuator 
#配置开启其他端点的 URI 
#开启所有的端点访问：* 
#指定开启端点访问：如：beans,env 
management.endpoints.web.exposure.include=*
```

### 4.各项监控指标接口 URL 介绍

2.使用可视化监控应用 Spring Boot Admin

### 1.使用步骤

- Spring Boot Admin 的使用是需要建立服务端与客户端。
- 服务端：独立的项目，会将搜集到的数据在自己的图形界面中展示。
- 客户端：需要监控的项目。
- 对应关系：一个服务端可以监控多个客户端。

### 2.搭建服务端

#### 1.创建项目

#### 2.修改 POM 文件

- 注意：目前在 Spring Boot Admin Starter Server2.1.6 版本中不支持 Spring Boot2.2.x 版本, 只支持到 2.1.X

```xml
<dependency>
    <groupId>de.codecentric</groupId> 
    <artifactId>spring-boot-admin-starter-server</artifactId> 
    <version>2.1.6</version>
</dependency>
```

#### 3.修改配置文件

```sh
server.port=9090
```

#### 4.修改启动类

```java
@SpringBootApplication 
@EnableAdminServer //开启 Spring Boot Admin 服务端 
public class SpringbootactuatorserverApplication { 
    public static void main(String[] args) {
        SpringApplication.run(SpringbootactuatorserverApplication.class, args); 
    } 
}
```

### 2.搭建客户端

#### 1.修改 POM 文件

```xml
<dependency> 
    <groupId>de.codecentric</groupId> 
    <artifactId>spring-boot-admin-starter-client</artifactId> 
    <version>2.1.6</version> 
</dependency>
```

#### 2.修改配置文件

```sh
#配置访问端点的根路径 
management.endpoints.web.base-path=/actuator 
#配置开启其他端点的 URI #开启所有的端点访问：* 
#指定开启端点访问：如：beans,env 
management.endpoints.web.exposure.include=* 
#指定服务端的访问地址 
spring.boot.admin.client.url=http://localhost:9090
```

#### 4.效果图
