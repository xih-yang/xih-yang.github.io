# 10、Spring Security 实战 - 记住我
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/10.html
- 分类：安全框架
- 分组：教程目录
## 前言

前面介绍了设置用户最大登录数，这节实现**记住我**功能。

## 配置数据库

**记住我**需要用到数据库，所以这里先配置以下**Mysql**数据库

添加依赖

```java
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
```

添加配置

```java
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/security?useUnicode=true&characterEncoding=UTF-8&serverTimezone=GMT%2B8
    username: root
    password: 123456
```

## 实现

依旧在**SpringSecurityConfig**中添加以下代码

```java
@Autowired
private DataSource dataSource;
@Bean
JdbcTokenRepositoryImpl jdbcTokenRepository() {
    JdbcTokenRepositoryImpl repository = new JdbcTokenRepositoryImpl();
    repository.setDataSource(dataSource);
//        repository.setCreateTableOnStartup(true);
    return repository;
}
```

> repository.setCreateTableOnStartup(true); 在项目启动时，创建表

添加记住我配置

```java
http.rememberMe()
.tokenRepository(jdbcTokenRepository())
.tokenValiditySeconds(60 * 60 * 24 * 7);
```

> tokenValiditySeconds(60 * 60 * 24 * 7); token有效时长

## 验证

启动项目，发现数据库中表已经创建完成

在浏览器输入[http://localhost:8080](http://localhost:8080)，选择记住我

登录成功之后，查看数据库，记住我的信息已经成功存入数据库。

紧接着，重新启动项目，访问[http://localhost:8080/admin](http://localhost:8080/admin)，发现访问成功

记住我功能已经实现。
