# 44、SpringCloud Alibaba RocketMQ（3）测试框架搭建
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/77.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
我们将创建 spring-cloud-bus-rocketmq-example 项目，用来测试它的所有功能。

## 1.搭建 spring-cloud-bus-rocketmq-example

spring-cloud-bus-rocketmq-example 将去除子模块的公共依赖部分。

### 1.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next ，填写以下的内容：

- Parent：我们选择 spring-cloud-alibaba-examples
- Name：spring-cloud-bus-rocketmq-example
- 其他的项保持不变。
- 点击 Finish 完成创建

### 1.2 添加依赖

打开项目的 pom.xml 文件，我们添加以下的内容：

```xml
<dependencies> 
	<dependency>
		<groupId>com.alibaba.cloud</groupId> 
		<artifactId>spring-cloud-starter-bus-rocketmq</artifactId> 
	</dependency>
	<dependency> 
		<groupId>org.springframework.boot</groupId> 
		<artifactId>spring-boot-starter-web</artifactId> 
	</dependency>
	<dependency> 
		<groupId>org.springframework.boot</groupId> 
		<artifactId>spring-boot-starter-actuator</artifactId> 
	</dependency>
</dependencies>
```

### 1.3 完整的 pom.xml 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>spring-cloud-alibaba-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> </parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>spring-cloud-bus-rocketmq-example</artifactId> 
	<packaging>pom</packaging> 
	<modules> 
		<module>rocketmq-produce-example</module> 
	</modules>
	<dependencies> 
		<dependency> 
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-starter-bus-rocketmq</artifactId> 
		<dependency> 
			<groupId>org.springframework.boot</groupId> 
			<artifactId>spring-boot-starter-web</artifactId> 
		</dependency>
		<dependency> 
			<groupId>org.springframework.boot</groupId> 
			<artifactId>spring-boot-starter-actuator</artifactId> 
		</dependency>
	</dependencies>
	<build> 
		<plugins> 
			<plugin> 
				<groupId>org.springframework.boot</groupId> 
				<artifactId>spring-boot-maven-plugin</artifactId> 
			</plugin> 
		</plugins> 
	</build> 
</project>
```

## 2.搭建 rocketmq-produce-example

produce 代表服务的生产者，用来发送消息。

### 2.1 使用 IDEA 创建一个 Maven 项目

选择 Maven：

点击 Next 添加以下的内容：

- Parent：spring-cloud-bus-rocketmq-example
- Name：rocketmq-produce-example
- 点击 Finish 完成项目的创建

### 2.2 修改 Maven 的打包方式

此项目我们以后可能需要使用 jar 发布，在此，我们添加 spring-boot 的打包插件：

```xml
<build> 
	<plugins> 
		<plugin> 
			<groupId>org.springframework.boot</groupId> 
			<artifactId>spring-boot-maven-plugin</artifactId> 
		</plugin> 
	</plugins>
</build>
```

### 2.3 完整的 pom.xml 文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>spring-cloud-bus-rocketmq-example</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>rocketmq-produce-example</artifactId>
	<build> 
		<plugins> 
			<plugin> 
				<groupId>org.springframework.boot</groupId> 
				<artifactId>spring-boot-maven-plugin</artifactId> 
			</plugin> 
		</plugins> 
	</build> 
</project>
```

## 3.搭建 rocketmq-consume-example

### 3.1 使用 IDEA 创建一个 Maven 项目

选择 Maven：

点击 Next 添加以下的内容：

- Parent：spring-cloud-bus-rocketmq-example
- Name：rocketmq-consumer-example
- 点击 Finish 完成项目的创建

### 3.2 修改 Maven 的打包方式

为了以后打包为一个 jar 发布，我们添加一个打包插件：

```xml
<build> 
	<plugins> 
		<plugin> 
			<groupId>org.springframework.boot</groupId> 
			<artifactId>spring-boot-maven-plugin</artifactId> 
		</plugin> 
	</plugins> 
</build>
```

### 3.3 完整的 pom.xml 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>spring-cloud-bus-rocketmq-example</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>rocketmq-consume-example</artifactId>
	<build> 
		<plugins> 
			<plugin> 
				<groupId>org.springframework.boot</groupId> 
				<artifactId>spring-boot-maven-plugin</artifactId> 
			</plugin> 
		</plugins> 
	</build> 
</project>
```

### 4.4 项目的完整结构如下
