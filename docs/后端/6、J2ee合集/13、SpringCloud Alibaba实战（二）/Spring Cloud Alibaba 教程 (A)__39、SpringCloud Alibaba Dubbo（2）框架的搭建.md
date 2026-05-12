# 39、SpringCloud Alibaba Dubbo（2）框架的搭建
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/72.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
我们将搭建如图所示的项目框架

## 1.搭建 spring-cloud-dubbo-examples

spring-cloud-dubbo-exmaples 是一个父项目，用来给子项目控制版本和去除公共的依赖

### 1.1 创建项目

使用 IDEA 创建一个模块：

选择 Maven：

点击 Next，进行下一步操作：

- Parent：必须选择之前我们创建的 spring-cloud-alibaba-examples
- Name：spring-cloud-dubbo-examples 项目的名称
- 点击 Finish，完成项目的创建

至此，spring-cloud-dubbo-examples 项目已经完成创建了。

### 1.2 添加依赖

打开该项目的 pom.xml，添加以下内容：

```xml
<dependencies> 
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

### 1.3 修改项目的打包方式

``pom``

### 1.4 完整的 pom.xml 文件如下

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
	<artifactId>spring-cloud-dubbo-examples</artifactId>
	<dependencies>
		<dependency>
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-starter-dubbo</artifactId>
		</dependency>
		<dependency>
			<groupId>com.alibaba.cloud</groupId>
			<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
		</dependency>
	</dependencies>
</project>
```

## 2.搭建 dubbo-api

dubbo-api 里面将存放用于发表服务的接口

### 2.1 创建 dubbo-api 项目

使用 IDEA 创建一个子模块

选择 Maven 项目：

点击 Next 进行下一步操作：

- Parent：选择 spring-cloud-dubbo-examples
- Name：名称为 dubbo-api
- 点击 Finish 完成项目的创建：

### 2.2 完整的 pom.xml 文件如下

dubbo-api 的 pom.xml 文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>spring-cloud-dubbo-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent>
	<modelVersion>4.0.0</modelVersion>
	<artifactId>dubbo-api</artifactId>
</project>
```

## 3.搭建 dubbo-provider

### 3.1 创建 dubbo-provider 项目

搭建 dubbo-provider 用来做一个服务的提供者。

使用 IDEA 创建一个模块：

选择 Maven 项目：

点击 Next，进行下一步操作：

- Parent：选择 spring-cloud-alibaba-examples
- Name：dubbo-provider
- 点击 Finish，完成项目的创建。

### 3.2 修改 Maven 的打包方式

- Maven 项目默认会被 target 目录下的 class 文件打包在一个 jar 里面，该 jar 并不能直接运行，我们需要修改它的打包方式为 spring-boot 的打包，这样，打包后的项目将能直接被运行
- 修改 pom.xml ,添加如下的内容：

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

这样，该项目将最终被打包成为一个 jar，能直接通过 java -jar 来运行

### 3.3 完整的 pom.xml 文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>spring-cloud-dubbo-examples</artifactId> 
		<groupId>com.dqcgm </groupId> 
		<version>1.0</version> 
	</parent>
	<modelVersion>4.0.0</modelVersion> 
	<artifactId>dubbo-provider</artifactId>
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

## 4.搭建 dubbo-consumer

### 4.1 创建 dubbo-provider-consumer 项目

搭建 dubbo-provider 用来做一个服务的提供者

使用 IDEA 创建一个模块：

选择 Maven 项目：

点击 Next，进行下一步操作：

- Parent：选择 spring-cloud-alibaba-examples
- Name：dubbo-consumer
- 点击 Finish，完成项目的创建

### 4.2 修改 Maven 的打包方式

- Maven 项目默认会被 target 目录下的 class 文件打包在一个 jar 里面，该 jar 并不能直接运行，我们需要修改它的打包方式为 spring-boot 的打包，这样，打包后的项目将能直接被运行。
- 修改 pom.xml ,添加如下的内容：

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

这样，该项目将最终被打包成为一个 jar，能直接通过 java -jar 来运行

### 4.3 完整的 pom.xml 文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent>
		<artifactId>spring-cloud-dubbo-examples</artifactId>
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version>
	</parent> 
	<modelVersion>4.0.0</modelVersion> 
	<artifactId>dubbo-consumer</artifactId>
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

### 4.4 完整的项目结构
