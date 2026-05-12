# 14、Spring Security 入门 - Remember Me 功能实现
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/14.html
- 分类：安全框架
- 分组：教程目录
Spring Security 中 Remember Me 为“记住我”功能，用户只需要在登录时添加 remember-me 复选框，取值为 true。Spring Security 会自动把用户信息存储到数据源中，以后就可以不登录进行访问

### 1.添加依赖

Spring Security 实现 Remember Me 功能时底层实现依赖 Spring-JDBC，所以需要导入 Spring-JDBC。以后多使用 MyBatis 框架而很少直接导入 spring-jdbc，所以此处导入 mybatis 启动器

同时还需要添加 MySQL 驱动

```xml
<dependency>
	<groupId>org.mybatis.spring.boot</groupId>
	<artifactId>mybatis-spring-boot-starter</artifactId>
	<version>2.1.0</version>
</dependency>
<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
	<version>5.1.47</version>
</dependency>
```

### 2.配置数据源

在 application.properties 中配置数据源。请确保数据库中已经存在 security 数据库

```java
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/security
spring.datasource.username=root
spring.datasource.password=root
```

### 3.编写配置

新建 com.dqcgm.config.RememberMeConfig 类，并创建 Bean 对象

```java
@Configuration
public class RememberMeConfig {
	@Autowired
	private DataSource dataSource;
	@Bean
	public PersistentTokenRepository getPersistentTokenRepository() {
		JdbcTokenRepositoryImpl jdbcTokenRepositoryImpl=new JdbcTokenRepositoryImpl();
		jdbcTokenRepositoryImpl.setDataSource(dataSource);
		//自动建表，第一次启动时需要，第二次启动时注释掉
		//jdbcTokenRepositoryImpl.setCreateTableOnStartup(true);
		return jdbcTokenRepositoryImpl;
	}
}
```

### 4.修改 SecurityConfig

在 SecurityConfig 中添加 RememberMeConfig 和 UserDetailsService 实现类对象，并自动注入。

在 configure 中添加下面配置内容

```java
http.rememberMe()
	.userDetailsService(userDetailsService) //登录逻辑交给哪个对象
	.tokenRepository(repository); //持久层对象
```

### 5.在客户端页面中添加复选框

在客户端登录页面中添加 remember-me 的复选框，只要用户勾选了复选框下次就不需要进行登录了

```xml
<form action = "/login" method="post">
	用户名：<input type="text" name="username"/><br/>
	密码:<input type="text" name="password"/><br/>
	<input type="checkbox" name="remember-me" value="true"/> <br/>
	<input type="submit" value="登录"/>
</form>
```

### 6.有效时间

默认情况下重启项目后登录状态失效了。但是可以通过设置状态有效时间，即使项目重新启动下次也可以正常登录

```java
//remember Me
http.rememberMe()
	.tokenValiditySeconds(120)//单位：秒
	.tokenRepository(repository)
	.userDetailsService(userDetailsServiceImpl);
```
