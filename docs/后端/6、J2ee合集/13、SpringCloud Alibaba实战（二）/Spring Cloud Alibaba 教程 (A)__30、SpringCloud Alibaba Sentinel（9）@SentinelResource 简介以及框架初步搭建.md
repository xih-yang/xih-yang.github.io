# 30、SpringCloud Alibaba Sentinel（9）@SentinelResource 简介以及框架初步搭建
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/63.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.@SentinelResource 简介

Sentinel 提供了@SentinelResource 注解用于定义资源，并提供可选的异常回退和 Block 回退。异常回退指的是@SentinelResource 注解标注的方法发生 Java 异常时的回退处理；Block 回退指的是当@SentinelResource 资源访问不符合 Sentinel 控制台定义的规则时的回退（默认返回 Blocked by Sentinel (flow limiting)）。

## 2.框架的搭建

我们将搭建如图所示的测试框架：

### 2.1 搭建 sentinel-example

我们将在 sentinel-example 里面演示所有@SentinelResource 的的功能

#### 2.1.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next，填写以下的内容：

Parent：选择 spring-cloud-alibaba-example

Name：sentinel-example

点击 Finish，完成创建

#### 2.1.2 添加依赖

```xml
<dependencies> 
	<dependency> 
		<groupId>org.springframework.boot</groupId> 
		<artifactId>spring-boot-starter-web</artifactId> 
	</dependency> 
	<dependency> 
		<groupId>com.alibaba.cloud</groupId> 
		<artifactId>spring-cloud-alibaba-nacos-discovery</artifactId> 
	</dependency> 
</dependencies>
```

Spring-boot-stater-web 是开发 web 最基础的依赖；

spring-cloud-alibaba-nacos-discovery 是服务的发现组件

#### 2.1.3 修改项目的打包方式

```xml
<packaging>pom</packaging>
```

#### 2.1.4 完整的 pom.xml 文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>spring-cloud-alibaba-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<packaging>pom</packaging>
	<artifactId>sentinel-examples</artifactId>
	<dependencies> 
		<dependency> 
			<groupId>org.springframework.boot</groupId> 
			<artifactId>spring-boot-starter-web</artifactId> 
		</dependency> 
		<dependency> 
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-alibaba-nacos-discovery</artifactId> 
		</dependency> 
	</dependencies>
</project>
```

### 2.2 搭建 sentinel-provider

Provide 是一个普通的服务的提供者。

#### 2.2.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next，填写以下的内容：

Parent：选择 sentinel-example

Name：sentinel-provider

点击 Finish，完成创建。

#### 2.2.2 修改项目的打包方式

我们修改项目的打包方式，以后我们可以使用 jar 来发布项目。

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

#### 2.2.3 完整的 pom.xml 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>sentinel-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent>
	<modelVersion>4.0.0</modelVersion>
	<artifactId>sentinel-provider</artifactId>
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

### 2.3 搭建 sentinel-consumer

Provide 是一个普通的服务的消费者。

#### 2.3.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next，填写以下的内容：

Parent：选择 sentinel-example

Name：sentinel-consumer

点击 Finish，完成创建。

#### 2.3.2 修改 pom.xml 文件

我们将在该项目里面演示@SentinelResource 的功能

```xml
<dependencies> 
	<dependency> 
		<groupId>com.alibaba.cloud</groupId> 
		<artifactId>spring-cloud-starter-alibaba-sentinel</artifactId> 
	</dependency> 
</dependencies>
```

我们修改项目的打包方式，以后我们可以使用 jar 来发布项目。

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

#### 2.3.3 完整的 pom.xml 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
<parent> 
    <artifactId>sentinel-examples</artifactId> 
    <groupId>com.dqcgm</groupId> 
    <version>1.0</version> 
</parent> 
<modelVersion>4.0.0</modelVersion>
<artifactId>sentinel-consumer</artifactId>
<dependencies> 
    <dependency> 
        <groupId>com.alibaba.cloud</groupId> 
        <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId> 
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
```
