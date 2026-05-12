# 14、SpringCloud Alibaba Nacos（2）项目的搭建
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/47.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
我们将在我们 nacos-examples 的基础上，搭建一个 config-client，用来今天 nacos 配置中心的案例测试

## 1.创建 config-client 项目

使用 IDEA 创建一个 Maven 模块：

选择 Maven：

点击下一步：

- Parent：选择 nacos-examples
- Name：config-client
- 其他的项，保持默认
- 点击 FINISH 完成创建的过程：

## 2.添加依赖

**我们的项目继承自 nacos-examples，它里面已经包含 2 个基本的依赖：**

- 服务注册和发现：spring-cloud-alibaba-nacos-discovery 这个是微服务里面必不可缺的组件
- Web 开发相关：spring-boot-starter-web 开发 web 项目最基础的依赖
- 现在，我们在里面添加今天我们要学习的配置获取的组件：

spring-cloud-alibaba-nacos-config

编辑 config-client 里面的 pom.xml 文件，添加以下的内容：

```xml
<dependencies> 
	<dependency> 
		<groupId>com.alibaba.cloud</groupId> 
		<artifactId>spring-cloud-alibaba-nacos-config</artifactId> 
	</dependency> 
</dependencies>
```

在添加一个 mavne 的打包插件：

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

查看项目所有的依赖：

现在，项目里面已经包含上面的 3 个依赖了。

## 3.完整的 pom.xml 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>nacos-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>config-client</artifactId>
	<dependencies> 
		<dependency> 
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-alibaba-nacos-config</artifactId> 
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

至此，项目的搭建完成了。
