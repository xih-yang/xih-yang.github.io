# 04、SpringCloud Alibaba（3）父项目的创建
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/37.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
使用父项目能控制所有子项目依赖的全局版本，能有效的去除子项目里面重复的依赖，减少出错的几率。在此，我们将创建一个父 pom，让所有的子模块都继承该父 pom。

## 1.spring-cloud-alibaba-examples 项目的创建

- spring-cloud-alibaba-examples 将作为我们子项目的最大父 pom 项目
- 注意：在使用 IDEA 之前我们假设您已经设置了相应的 **JDK 配置**和 **Maven 配置**

### 1.1 使用 IDEA 创建一个 Maven 项目

选择 Next：

**填写下面的相关信息：**

- Name：spring-cloud-alibaba-examples
- Location：D:\workspace\spring-cloud-alibaba-examples（不要随便放）
- GroupId：com.dqcgm(每个人不一样，自己定)
- Version：1.0
- 最后，点击 finish 完成创建的过程

### 1.2 Spring Boot 版本的控制

- 我们采用`` 的方式来导入 Spriing Boot 的版本号。
- 打开项目的 pom.xml 文件，添加依赖内容：

```xml
<parent>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-parent</artifactId>
	<version>2.2.3.RELEASE</version>
	<relativePath/> <!-- lookup parent from repository -->
</parent>
```

这样，我们的项目就已经规定了 Spring Boot 的版本为 2.2.3.RELEASE 了。

### 1.3 Spring Cloud 版本的控制

我们使用依赖管理的方式来添加 Spring Cloud 的版本信息，在`` 里面定义版本信息，这里面我们选择 Hoxton.SR3 这个版本！

```xml
<properties> 
	<spring-cloud.version>Hoxton.SR3</spring-cloud.version> 
</properties>
```

之后在 `` 里面添加 spring-cloud 的 bom 信息，这将允许您省略任何 Maven 依赖项的版本，而是将版本控制委派给 BOM。

```xml
<dependencyManagement> 
	<dependencies> 
		<dependency> 
			<groupId>org.springframework.cloud</groupId> 
			<artifactId>spring-cloud-dependencies</artifactId> 
			<version>${
     spring-cloud.version}</version> 
			<type>pom</type> 
			<scope>import</scope> 
		</dependency> 
	</dependencies> 
</dependencyManagement>
```

### 1.4 SpringCloud Alibaba 版本的控制

同样，我们使用依赖管理的方式来添加 SpringCloud Alibaba 的版本信息。在`` 里面定义版本信息，这里面我们选择 2.2.0.RELEASE 这个版本！

```xml
<properties> 
	... 
	<com-alibaba-cloud.version>2.2.0.RELEASE</com-alibaba-cloud.version> 
	... 
</properties>
```

之后在 `` 里面添加 spring-cloud 的 bom 信息，这将允许您省略任何 Maven 依赖项的版本，而是将版本控制委派给 BOM。

```xml
<dependencyManagement> 
	<dependencies> 
		...
		<dependency> 
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-alibaba-dependencies</artifactId> 
			<version>${
     com-alibaba-cloud.version}</version> 
			<type>pom</type> 
			<scope>import</scope> 
		</dependency> 
		.... 
	</dependencies> 
</dependencyManagement>
```

### 1.5 设置为 pom 的版本方式

添加项目的打包方式：

```xml
<packaging>pom</packaging>
```

这将保证我们的项目是以 pom 打包的

### 1.6 完整的 pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>2.2.3.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.dqcgm</groupId>
	<artifactId>spring-cloud-alibaba-examples</artifactId>
	<version>1.0</version>
	<properties> 
		<spring-cloud.version>Hoxton.SR3</spring-cloud.version> 
		<com-alibaba-cloud.version>2.2.0.RELEASE</com-alibaba-cloud.version> 
	</properties>
	<dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>org.springframework.cloud</groupId> 
				<artifactId>spring-cloud-dependencies</artifactId> 
				<version>${
     spring-cloud.version}</version> 
				<type>pom</type> 
				<scope>import</scope>
			</dependency>
			<dependency>
				<groupId>com.alibaba.cloud</groupId> 
				<artifactId>spring-cloud-alibaba-dependencies</artifactId> 
				<version>${
     com-alibaba-cloud.version}</version> 
				<type>pom</type> 
				<scope>import</scope>
			</dependency>
		</dependencies>
	</dependencyManagement>
</project>
```

## 2.项目的打包

### 2.1 删除项目里面多余的文件夹

我们的项目仅仅是一个父 pom 文件，因此，项目只需要保留 pom.xml 即可，我们在此可以删除 src 目录

点击 Delete 即可删除

### 2.2 执行打包

使用 Maven 打包我们的项目

最后在控制台出现：

代表项目打包成功！

### 2.3 观察打包后的效果

我们打开我们 Maven 设置的本地仓库地址，如图所示：

打开 Maven 里面的 settings.xml 文件，找到该标签

发现我们本地仓库的地址位于 D 盘的 lib\jar 文件夹里面：

打开该文件夹：

发现该文件已经存在，证明我们的打包成功了
