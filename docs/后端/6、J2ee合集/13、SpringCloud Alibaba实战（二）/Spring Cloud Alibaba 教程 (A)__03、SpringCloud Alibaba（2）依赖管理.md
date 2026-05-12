# 03、SpringCloud Alibaba（2）依赖管理
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/36.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
SpringCloud Alibaba BOM 包含了它所使用的所有依赖的版本。如果您是 Maven Central 用户，请将我们的 BOM 添加到您的 pom.xml 中的 `` 部分。 这将允许您省略任何 Maven 依赖项的版本，而是将版本控制委派给 BOM。

```xml
<dependencyManagement> 
	<dependencies> 
		<dependency>
			<groupId>com.alibaba.cloud</groupId>
			<artifactId>spring-cloud-alibaba-dependencies</artifactId>
			<version>2.2.0.RELEASE</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>
```

在下面的章节中，假设您使用的是 SpringCloud Alibaba bom，相关 starter 依赖将不包含版本号。
