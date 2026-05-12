# 35、SpringCloud Alibaba Seata（2）框架的搭建-7800字匠心出品
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/68.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
**在本示例中，我们模拟了一个用户购买货物的场景：**

- StorageService 负责扣减库存数量；
- OrderService 负责保存订单；
- AccountService 负责扣减用户账户余额；
- Business 负责用户下单的整个流程处理；

## 1.搭建 seata-examples 项目

seata-examples 用来控制所有项目的依赖版本号，以及去除公共的依赖 seata。

### 1.1 使用 IDEA 创建 Maven 项目

选择 Maven 项目：

点击 Next，添加以下的信息：

- Parent：选择 spring-cloud-alibaba-examples
- Name：seata-examples
- 其他的信息保持默认即可。然后点击 Finish 即可完成创建

### 1.2 添加依赖

打开项目的 pom.xml 文件，添加以下的依赖。

```xml
<dependencies>
	<!-- 服务注册-->
	<dependency> 
		<groupId>com.alibaba.cloud</groupId> 
		<artifactId>spring-cloud-alibaba-nacos-discovery</artifactId> 
	</dependency>
	<!-- seata-->
	<dependency> 
		<groupId>com.alibaba.cloud</groupId> 
		<artifactId>spring-cloud-starter-alibaba-seata</artifactId> 
	</dependency>
	<!-- web 项目的基础依赖-->
	<dependency> 
		<groupId>org.springframework.boot</groupId> 
		<artifactId>spring-boot-starter-web</artifactId>
	</dependency> 
</dependencies>
```

### 1.3 完整的 pom.xml

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
	<artifactId>seata-examples</artifactId>
	<dependencies>
		<!-- 服务注册-->
		<dependency> 
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-alibaba-nacos-discovery</artifactId> 
		</dependency>
		<!-- seata-->
		<dependency> 
			<groupId>com.alibaba.cloud</groupId> 
			<artifactId>spring-cloud-starter-alibaba-seata</artifactId> 
		</dependency>
		<!-- web 项目的基础依赖-->
		<dependency> 
			<groupId>org.springframework.boot</groupId> 
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency> 
	</dependencies>
</project>
```

最后，我们的项目的依赖关系如下：

## 2.搭建 account-service 项目

Account-service 项目将负责扣减用户账户余额

### 2.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next 后，填写以下的信息：

- Parent：seata-examples
- Name：account-service
- 其他的值保持默认即可。

### 2.2 添加依赖

- 我们需要使用 ORM 框架来完成对数据库的操作。在次我们需要使用 Mybatis-Plus 来操作数据库
- 打开 pom.xml ，在里面添加如下内容：

```xml
<dependencies> 
	<dependency> 
		<groupId>com.baomidou</groupId> 
		<artifactId>mybatis-plus-boot-starter</artifactId> 
		<version>3.3.0</version> 
	</dependency> 
	<!--MySQL 依赖 --> 
	<dependency> 
		<groupId>mysql</groupId> 
		<artifactId>mysql-connector-java</artifactId> 
	</dependency> 
</dependencies>
```

为了以后我们打包发布我们的项目，在此我们添加 boot-maven 的打包插件：

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
		<artifactId>seata-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>account-service</artifactId>
	<dependencies> 
		<dependency> 
			<groupId>com.baomidou</groupId> 
			<artifactId>mybatis-plus-boot-starter</artifactId> 
			<version>3.3.0</version> 
		</dependency> 
		<!--MySQL 依赖 --> 
		<dependency> 
			<groupId>mysql</groupId> 
			<artifactId>mysql-connector-java</artifactId> 
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

项目的依赖关系如下：

## 3.搭建 business-service 项目

在 business 将主要完成下单逻辑，包含库存的扣减，订单的创建。

### 3.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next 后，填写以下的信息：

- Parent：seata-examples
- Name：business-service
- 其他的值保持默认即可。

### 3.2 添加依赖

为了以后我们打包发布我们的项目，在此我们添加 boot-maven 的打包插件：

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

### 3.3 完整的 pom.xml 文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>seata-examples</artifactId>
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>business-service</artifactId>
	<dependencies> 
		<dependency> 
			<groupId>com.baomidou</groupId> 
			<artifactId>mybatis-plus-boot-starter</artifactId> 
			<version>2.3</version> 
		</dependency> 
		<!--MySQL 依赖 --> 
		<dependency> 
			<groupId>mysql</groupId> 
			<artifactId>mysql-connector-java</artifactId> 
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

项目的依赖关系如下：

## 4.搭建 order-service 项目

order-service 项目将负责保存用户订单

### 4.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next 后，填写以下的信息：

- Parent：seata-examples
- Name：order-service
- 其他的值保持默认即可

### 4.2 添加依赖

- 我们需要使用 ORM 框架来完成对数据库的操作。在次我们需要使用 Mybatis-Plus 来操作数据库
- 打开 pom.xml ，在里面添加如下内容：

```xml
<dependencies> 
	<dependency> 
		<groupId>com.baomidou</groupId> 
		<artifactId>mybatis-plus-boot-starter</artifactId> 
		<version>3.3.0</version> 
	</dependency> 
	<!--MySQL 依赖 --> 
	<dependency> 
		<groupId>mysql</groupId> 
		<artifactId>mysql-connector-java</artifactId> 
	</dependency> 
</dependencies>
```

为了以后我们打包发布我们的项目，在此我们添加 boot-maven 的打包插件：

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

### 4.3 完整的 pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>seata-examples</artifactId> 
		<groupId>com.dqcgm</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion>
	<artifactId>order-service</artifactId>
	<dependencies> 
		<dependency> 
			<groupId>com.baomidou</groupId> 
			<artifactId>mybatis-plus-boot-starter</artifactId> 
			<version>3.3.0</version> 
		</dependency> 
		<!--MySQL 依赖 --> 
		<dependency> 
			<groupId>mysql</groupId> 
			<artifactId>mysql-connector-java</artifactId> 
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

项目的依赖关系如下：

## 5.搭建 storage-service 项目

storage-service 将负责扣除商品的库存。

### 5.1 使用 IDEA 创建一个 Maven 项目

选择 Maven 项目：

点击 Next 后，填写以下的信息：

- Parent：seata-examples
- Name：storage-service
- 其他的值保持默认即可。

### 5.2 添加依赖

- 我们需要使用 ORM 框架来完成对数据库的操作。在次我们需要使用 Mybatis-Plus 来操作数据库。
- 打开 pom.xml ，在里面添加如下内容：

```xml
<dependencies> 
	<dependency> 
		<groupId>com.baomidou</groupId> 
		<artifactId>mybatis-plus-boot-starter</artifactId> 
		<version>3.3.0</version> 
	</dependency> 
	<!--MySQL 依赖 --> 
	<dependency> 
		<groupId>mysql</groupId> 
		<artifactId>mysql-connector-java</artifactId> 
	</dependency> 
</dependencies>
```

为了以后我们打包发布我们的项目，在此我们添加 boot-maven 的打包插件：

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

### 5.3 完整的 pom.xml 文件如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
	http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<parent> 
		<artifactId>seata-examples</artifactId> 
		<groupId>com.bjsxt</groupId> 
		<version>1.0</version> 
	</parent> 
	<modelVersion>4.0.0</modelVersion> 
	<artifactId>storage-service</artifactId>
	<dependencies> 
		<dependency> 
			<groupId>com.baomidou</groupId> 
			<artifactId>mybatis-plus-boot-starter</artifactId> 
			<version>3.3.0</version> 
		</dependency> 
		<!--MySQL 依赖 --> 
		<dependency> 
			<groupId>mysql</groupId> 
			<artifactId>mysql-connector-java</artifactId> 
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

项目的依赖关系如下：

## 6.完整的项目的案例为
