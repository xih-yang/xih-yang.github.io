# 05、Spring Boot 实战：使用 JdbcTemplate 访问数据库
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/8/5.html
- 分类：J2EE框架
- 分组：教程目录
SpringBoot 是为了简化 Spring 应用的创建、运行、调试、部署等一系列问题而诞生的产物，**自动装配的特性让我们可以更好的关注业务本身而不是外部的XML配置，我们只需遵循规范，引入相关的依赖就可以轻易的搭建出一个 WEB 工程**

Spring Framework对数据库的操作在JDBC上面做了深层次的封装，通过依赖注入功能，可以将 DataSource 注册到JdbcTemplate之中，使我们可以轻易的完成对象关系映射，并有助于规避常见的错误，在SpringBoot中我们可以很轻松的使用它。

> 特点

- 速度快，对比其它的ORM框架而言，JDBC的方式无异于是最快的
- 配置简单，Spring自家出品，几乎没有额外配置
- 学习成本低，毕竟JDBC是基础知识，JdbcTemplate更像是一个DBUtils

## 导入依赖

在pom.xml 中添加对 JdbcTemplate 的依赖

```xml
<!-- Spring JDBC 的依赖包，使用 spring-boot-starter-jdbc 或 spring-boot-starter-data-jpa 将会自动获得HikariCP依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
<!-- MYSQL包 -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
<!-- 默认就内嵌了Tomcat 容器，如需要更换容器也极其简单-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

## 连接数据库

在application.properties中添加如下配置。值得注意的是，SpringBoot默认会自动配置DataSource，它将优先采用HikariCP连接池，如果没有该依赖的情况则选取tomcat-jdbc，如果前两者都不可用最后选取Commons DBCP2**。通过spring.datasource.type属性可以指定其它种类的连接池**

```java
spring.datasource.url=jdbc:mysql://localhost:3306/chapter4?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&useSSL=false
spring.datasource.password=root
spring.datasource.username=root
#spring.datasource.type
#更多细微的配置可以通过下列前缀进行调整
#spring.datasource.hikari
#spring.datasource.tomcat
#spring.datasource.dbcp2
```

启动项目，通过日志，可以看到默认情况下注入的是HikariDataSource

```java
2021-05-07 10:33:54.021  INFO 9640 --- [           main] o.s.j.e.a.AnnotationMBeanExporter        : Bean with name 'dataSource' has been autodetected for JMX exposure
2021-05-07 10:33:54.026  INFO 9640 --- [           main] o.s.j.e.a.AnnotationMBeanExporter        : Located MBean 'dataSource': registering with JMX server as MBean [com.zaxxer.hikari:name=dataSource,type=HikariDataSource]
2021-05-07 10:33:54.071  INFO 9640 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2021-05-07 10:33:54.075  INFO 9640 --- [           main] com.battcn.Chapter4Application           : Started Chapter4Application in 3.402 seconds (JVM running for 3.93)
```

## 具体编码

完成基本配置后，接下来进行具体的编码操作**。为了减少代码量，就不写UserDao、UserService之类的接口了，将直接在Controller中使用JdbcTemplate进行访问数据库操作，这点是不规范的，各位别学我…**

### 表结构

创建一张 t_user 的表

```java
CREATE TABLE t_user (
  id int(8) NOT NULL AUTO_INCREMENT COMMENT '主键自增',
  username varchar(50) NOT NULL COMMENT '用户名',
  password varchar(50) NOT NULL COMMENT '密码',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表';
```

### 实体类

```java
package com.battcn.entity;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/5/7 0007
 */
public class User {
    private Long id;
    private String username;
    private String password;
    // TODO  省略get set
}
```

### restful 风格接口

```java
package com.battcn.controller;
import com.battcn.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/4/23 0023
 */
@RestController
@RequestMapping("/users")
public class SpringJdbcController {
    private final JdbcTemplate jdbcTemplate;
    @Autowired
    public SpringJdbcController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    @GetMapping
    public List<User> queryUsers() {
        // 查询所有用户
        String sql = "select * from t_user";
        return jdbcTemplate.query(sql, new Object[]{}, new BeanPropertyRowMapper<>(User.class));
    }
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // 根据主键ID查询
        String sql = "select * from t_user where id = ?";
        return jdbcTemplate.queryForObject(sql, new Object[]{id}, new BeanPropertyRowMapper<>(User.class));
    }
    @DeleteMapping("/{id}")
    public int delUser(@PathVariable Long id) {
        // 根据主键ID删除用户信息
        String sql = "DELETE FROM t_user WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }
    @PostMapping
    public int addUser(@RequestBody User user) {
        // 添加用户
        String sql = "insert into t_user(username, password) values(?, ?)";
        return jdbcTemplate.update(sql, user.getUsername(), user.getPassword());
    }
    @PutMapping("/{id}")
    public int editUser(@PathVariable Long id, @RequestBody User user) {
        // 根据主键ID修改用户信息
        String sql = "UPDATE t_user SET username = ? ,password = ? WHERE id = ?";
        return jdbcTemplate.update(sql, user.getUsername(), user.getPassword(), id);
    }
}
```

### 测试

由于上面的接口是 restful 风格的接口，添加和修改无法通过浏览器完成，所以需要我们自己编写junit或者使用postman之类的工具。

创建单元测试Chapter4ApplicationTests，通过TestRestTemplate模拟**GET、POST、PUT、DELETE等请求操作**

```java
package com.battcn;
import com.battcn.entity.User;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = Chapter4Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class Chapter4ApplicationTests {
    private static final Logger log = LoggerFactory.getLogger(Chapter4ApplicationTests.class);
    @Autowired
    private TestRestTemplate template;
    @LocalServerPort
    private int port;
    @Test
    public void test1() throws Exception {
        template.postForEntity("http://localhost:" + port + "/users", new User("user1", "pass1"), Integer.class);
        log.info("[添加用户成功]\n");
        // TODO 如果是返回的集合,要用 exchange 而不是 getForEntity ，后者需要自己强转类型
        ResponseEntity<List<User>> response2 = template.exchange("http://localhost:" + port + "/users", HttpMethod.GET, null, new ParameterizedTypeReference<List<User>>() {
        });
        final List<User> body = response2.getBody();
        log.info("[查询所有] - [{}]\n", body);
        Long userId = body.get(0).getId();
        ResponseEntity<User> response3 = template.getForEntity("http://localhost:" + port + "/users/{id}", User.class, userId);
        log.info("[主键查询] - [{}]\n", response3.getBody());
        template.put("http://localhost:" + port + "/users/{id}", new User("user11", "pass11"), userId);
        log.info("[修改用户成功]\n");
        template.delete("http://localhost:" + port + "/users/{id}", userId);
        log.info("[删除用户成功]");
    }
}
```

## 总结

本章介绍了JdbcTemplate常用的几种操作，详细请参考[JdbcTemplate API文档](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html)

目前很多大佬都写过关于 **SpringBoot** 的教程了，如有雷同，请多多包涵，本教程基于最新的 spring-boot-starter-parent：2.0.1.RELEASE编写，包括新版本的特性都会一起介绍…

## 说点什么

全文代码：[https://github.com/battcn/spring-boot2-learning/tree/master/chapter4](https://github.com/battcn/spring-boot2-learning/tree/master/chapter4)
