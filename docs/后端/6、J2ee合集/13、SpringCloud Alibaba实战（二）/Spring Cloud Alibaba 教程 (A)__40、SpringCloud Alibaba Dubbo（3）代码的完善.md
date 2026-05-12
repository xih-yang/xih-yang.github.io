# 40、SpringCloud Alibaba Dubbo（3）代码的完善
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/73.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.dubbo-api 代码的完善

### 1.1 定义 Dubbo 服务接口

Dubbo 服务接口是服务提供方与消费方的远程通讯契约，通常由普通的 Java 接口 （interface）来声明

代码如下：

```java
public interface EchoService {
	String echo(String message); 
}
```

### 1.2 项目的打包

Api 项目主要是为了把 rpc 中定义的接口发布出去。

我们可以使用 Maven 的普通打包方式把编译后的 class 文件打包为 jar。

打包成功后，项目的 jar 位于：

## 2.dubbo-provider 代码的完善

### 2.1 添加依赖

在 dubbo-provider 的 pom.xml 的 dependencies 添加以下的依赖

```xml
<dependencies> 
	<dependency> 
		<groupId>com.dqcgm</groupId> 
		<artifactId>dubbo-api</artifactId> 
		<version>1.0</version> 
	</dependency> 
</dependencies>
```

### 2.2 实现 dubbo-api 里面定义的接口

代码的内容如下：

```java
@Service 
public class EchoServiceImpl implements EchoService {
	@Override 
	public String echo(String message) {
		return "[echo] Hello, " + message; 
	} 
}
```

### 2.3 添加配置文件

```java
dubbo: 
	scan:
		# dubbo 服务扫描基准包
		base-packages: com.dqcgm.service.impl
	cloud:
		subscribed-services: dubbo-provider
	protocol:
		# dubbo 协议
		name: dubbo
		# dubbo 协议端口（ -1 表示自增端口，从 20880 开始）
		port: -1
	registry:
		# 挂载到 Spring Cloud 注册中心
		address: spring-cloud://localhost
spring:
	application:
		# Dubbo 应用名称
		name: dubbo-provider
	main:
		# Spring Boot 2.1 需要设定
		allow-bean-definition-overriding: true
	cloud:
		nacos:
			# Nacos 服务发现与注册配置
			discovery:
				server-addr: localhost:8848
```

### 2.4 启动类

代码如下：

```java
@SpringBootApplication 
@EnableDiscoveryClient 
public class ProviderServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(ProviderServiceApplication.class, args) ; 
	} 
}
```

## 3.dubbo-consumer 代码的完善

### 3.1 添加依赖

在 dubbo-consumer 的 pom.xml 的 dependencies 添加以下的依赖

```xml
<dependencies>
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-web</artifactId>
	</dependency>
	<dependency>
		<groupId>com.dqcgm</groupId>
		<artifactId>dubbo-api</artifactId>
		<version>1.0</version>
	</dependency>
	<!-- Dubbo Spring Cloud Starter -->
	<dependency>
		<groupId>com.alibaba.cloud</groupId>
		<artifactId>spring-cloud-starter-dubbo</artifactId>
	</dependency>
	<dependency>
		<groupId>com.alibaba.cloud</groupId>
		<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
	</dependency>
</dependencies>
```

### 3.2 添加配置文件

内容如下：

```java
dubbo: 
	registry:
		# 挂载到 Spring Cloud 注册中心
		address: nacos://127.0.0.1:8848
	cloud:
		subscribed-services: dubbo-provider
server:
	port: 8080
spring:
	application:
		# Dubbo 应用名称
		name: dubbo-consumer
	main:
		# Spring Boot 2.1 需要设定
		allow-bean-definition-overriding: true
	cloud:
		nacos:
			# Nacos 服务发现与注册配置
			discovery:
				server-addr: 127.0.0.1:8848
```

### 3.3 启动类

代码如下：

```java
@EnableDiscoveryClient 
@SpringBootApplication 
@RestController 
public class ConsumerServiceApplication {
	@Reference 
	private EchoService echoService ;
	public static void main(String[] args) {
		SpringApplication.run(ConsumerServiceApplication.class,args) ; 
	}
	@GetMapping("/rpc")
	public ResponseEntity<String> rpc(){
		return ResponseEntity.ok(String.format("调用结果为%s",echoService.echo("info")));
	}
}
```

## 4.远程调用测试

- 启动 Nacos-Server
- 启动 dubbo-provider
- 启动 dubbo-consumer
- 查看 Nacos 控制台：

http://localhost:8848/nacos/

浏览器访问：

调用已经成功；
