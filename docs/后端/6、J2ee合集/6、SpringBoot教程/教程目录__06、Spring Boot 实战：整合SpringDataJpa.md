# 06、Spring Boot 实战：整合SpringDataJpa
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/8/6.html
- 分类：J2EE框架
- 分组：教程目录
SpringBoot 是为了简化 Spring 应用的创建、运行、调试、部署等一系列问题而诞生的产物，**自动装配的特性让我们可以更好的关注业务本身而不是外部的XML配置，我们只需遵循规范，引入相关的依赖就可以轻易的搭建出一个 WEB 工程**

上一篇介绍了Spring JdbcTemplate的使用，对比原始的JDBC而言，它更加的简洁。但随着表的增加，重复的CRUD工作让我们苦不堪言，这时候Spring Data Jpa的作用就体现出来了…..

## JPA

JPA是Java Persistence API的简称，中文名**Java持久层API**，是官方（Sun）在JDK5.0后提出的Java持久化规范。其目的是为了简化现有JAVA EE和JAVA SE应用开发工作，以及整合现有的ORM技术实现规范统一

> JPA的总体思想和现有Hibernate、TopLink、JDO等ORM框架大体一致。总的来说，JPA包括以下3方面的技术：

- **ORM映射元数据：** 支持XML和注解两种元数据的形式，元数据描述对象和表之间的映射关系，框架据此将实体对象持久化到数据库表中；
- **API：** 操作实体对象来执行CRUD操作，框架在后台替代我们完成所有的事情，开发者从繁琐的JDBC和SQL代码中解脱出来。
- **查询语言：** 通过面向对象而非面向数据库的查询语言查询数据，避免程序的SQL语句紧密耦合。

JPA只是一种规范，它需要第三方自行实现其功能，在众多框架中Hibernate是最为强大的一个。从功能上来说，JPA就是Hibernate功能的一个子集。Hibernate 从3.2开始，就开始兼容JPA。同时Hibernate3.2获得了Sun TCK的JPA(Java Persistence API) 兼容认证。

## Spring Data JPA

常见的ORM框架中Hibernate的JPA最为完整，因此Spring Data JPA 是采用基于JPA规范的Hibernate框架基础下提供了Repository层的实现**。Spring Data Repository极大地简化了实现各种持久层的数据库访问而写的样板代码量，同时CrudRepository提供了丰富的CRUD功能去管理实体类**。

> 优点

- 丰富的API，简单操作无需编写额外的代码
- 丰富的SQL日志输出

> 缺点

- 学习成本较大，需要学习HQL
- 配置复杂，虽然SpringBoot简化的大量的配置，关系映射多表查询配置依旧不容易
- 性能较差，对比JdbcTemplate、Mybatis等ORM框架，它的性能无异于是最差的

## 导入依赖

在pom.xml 中添加 spring-boot-starter-data-jpa 的依赖

```xml
<!-- Spring JDBC 的依赖包，使用 spring-boot-starter-jdbc 或 spring-boot-starter-data-jpa 将会自动获得HikariCP依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
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
<!-- 测试包,当我们使用 mvn package 的时候该包并不会被打入,因为它的生命周期只在 test 之内-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

## 连接数据库

在application.properties中添加如下配置。值得注意的是，SpringBoot默认会自动配置DataSource，它将优先采用HikariCP连接池，如果没有该依赖的情况则选取tomcat-jdbc，如果前两者都不可用最后选取Commons DBCP2**。通过spring.datasource.type属性可以指定其它种类的连接池**

```java
spring.datasource.url=jdbc:mysql://localhost:3306/chapter5?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&useSSL=false
spring.datasource.password=root
spring.datasource.username=root
#spring.datasource.type
# JPA配置
spring.jpa.hibernate.ddl-auto=update
# 输出日志
spring.jpa.show-sql=true
# 数据库类型
spring.jpa.database=mysql
```

> ddl-auto 几种属性

- **create：** 每次运行程序时，都会重新创建表，故而数据会丢失
- **create-drop：** 每次运行程序时会先创建表结构，然后待程序结束时清空表
- **upadte：** 每次运行程序，没有表时会创建表，如果对象发生改变会更新表结构，原有数据不会清空，只会更新（推荐使用）
- **validate：** 运行程序会校验数据与数据库的字段类型是否相同，**字段不同会报错**

## 具体编码

由于上面我们采用的是spring.jpa.hibernate.ddl-auto=update方式，因此这里可以跳过手动建表的操作

### 实体类

JPA规范注解坐落在javax.persistence包下，**@Id注解一定不要引用错了，否则会报错****。@GeneratedValue(strategy = GenerationType.IDENTITY)自增策略，不需要映射的字段可以通过@Transient注解排除掉**

> 常见的几种自增策略

- **TABLE：** 使用一个特定的数据库表格来保存主键
- **SEQUENCE：** 根据底层数据库的序列来生成主键，条件是数据库支持序列。这个值要与generator一起使用，generator 指定生成主键使用的生成器（可能是orcale中自己编写的序列）。
- **IDENTITY：** 主键由数据库自动生成（主要是支持自动增长的数据库，如mysql）
- **AUTO：** 主键由程序控制，也是GenerationType的默认值。

```java
package com.battcn.entity;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import java.io.Serializable;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/5/7 0007
 */
@Entity(name = "t_user")
public class User implements Serializable {
    private static final long serialVersionUID = 8655851615465363473L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;
    /**
     * TODO 忽略该字段的映射
     */
    @Transient
    private String  email;
    // TODO  省略get set
}
```

### Repository

创建UserRepository数据访问层接口，需要继承JpaRepository``，**第一个泛型参数是实体对象的名称，第二个是主键类型**。只需要这样简单的配置，该UserRepository就拥常用的CRUD功能，JpaRepository本身就包含了常用功能，剩下的查询我们按照规范写接口即可，**JPA支持@Query注解写HQL，也支持findAllByUsername这种根据字段名命名的方式（强烈推荐IntelliJ IDEA对JPA支持非常NICE）**

```java
package com.battcn.repository;
import com.battcn.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
/**
 * t_user 操作
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/5/7 0007
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 根据用户名查询用户信息
     *
     * @param username 用户名
     * @return 查询结果
     */
    List<User> findAllByUsername(String username);
}
```

### 测试

完成数据访问层接口后，最后编写一个junit测试类来检验代码的正确性。

下面的几个操作中，只有findAllByUsername是我们自己编写的代码，其它的都是继承自JpaRepository接口中的方法，更关键的是分页及排序是如此的简单实例化一个Pageable即可…

```java
package com.battcn;
import com.battcn.entity.User;
import com.battcn.repository.UserRepository;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.junit4.SpringRunner;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@RunWith(SpringRunner.class)
@SpringBootTest
public class Chapter5ApplicationTests {
    private static final Logger log = LoggerFactory.getLogger(Chapter5ApplicationTests.class);
    @Autowired
    private UserRepository userRepository;
    @Test
    public void test1() throws Exception {
        final User user = userRepository.save(new User("u1", "p1"));
        log.info("[添加成功] - [{}]", user);
        final List<User> u1 = userRepository.findAllByUsername("u1");
        log.info("[条件查询] - [{}]", u1);
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Order.desc("username")));
        final Page<User> users = userRepository.findAll(pageable);
        log.info("[分页+排序+查询所有] - [{}]", users.getContent());
        userRepository.findById(users.getContent().get(0).getId()).ifPresent(user1 -> log.info("[主键查询] - [{}]", user1));
        final User edit = userRepository.save(new User(user.getId(), "修改后的ui", "修改后的p1"));
        log.info("[修改成功] - [{}]", edit);
        userRepository.deleteById(user.getId());
        log.info("[删除主键为 {} 成功] - [{}]", user.getId());
    }
}
```

## 总结

更多内容请参考[官方文档](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)

目前很多大佬都写过关于 **SpringBoot** 的教程了，如有雷同，请多多包涵，本教程基于最新的 spring-boot-starter-parent：2.0.1.RELEASE编写，包括新版本的特性都会一起介绍…

## 说点什么

全文代码：[https://github.com/battcn/spring-boot2-learning/tree/master/chapter5](https://github.com/battcn/spring-boot2-learning/tree/master/chapter5)
