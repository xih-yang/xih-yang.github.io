# 01、MyBatis源码 - MyBatis简介及入门案例
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/1.html
- 分类：ORM框架
- 分组：教程目录
### 简介

[官方文档](https://mybatis.org/mybatis-3/zh/index.html)

[github地址](https://github.com/mybatis/mybatis-3/)

#### 什么是 MyBatis？

MyBatis 是一款优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。

MyBatis 免除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。MyBatis 可以通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。

#### MyBatis历史

MyBatis框架最早的名字叫iBatis

- 2001年 Clinton Begin发起一个开源项目 iBatis1.0
- 2005年 iBatis2.0
- 2010年 iBatis3.0，iBatis在这之前都是由Apache组织管理
- 2010年6月份 iBatis项目交由谷歌公司托管并改名为MyBatis
- 2013年11月 整个项目迁移至GitHub
- 2019年10月 MyBatis3.5.3

#### MyBatis与Hibernate、JPA、ORM区别

##### ORM

ORM（Object Relational Mapping）：对象关系映射，是一种设计思想，是为了解决面向对象与关系数据库存在的互不匹配的现象。ORM通过使用描述对象和数据库之间映射的元数据，将程序中的对象自动持久化到关系数据库中。

##### JPA

全称Java Persistence API，可以通过注解或者XML描述【对象-关系表】之间的映射关系，并将实体对象持久化到数据库中。

JPA仅仅是一种规范，也就是说JPA仅仅定义了一些接口，而接口是需要实现才能工作的。所以底层需要某种实现。

JPA是一套实现ORM理论的接口，没有实现代码。

##### Hibernate

Hibernate 是由 Gavin King 于 2001 年创建的开放源代码的对象关系框架。它强大且高效的构建具有关系对象持久性和查询服务的 Java 应用程序。

Hibernate 将 Java 类映射到数据库表中，从 Java 数据类型中映射到 SQL 数据类型中，并把开发人员从 95% 的公共数据持续性编程工作中解放出来。

Hibernate 是传统 Java 对象和数据库服务器之间的桥梁，用来处理基于 O/R 映射机制和模式的那些对象。

##### hibernate和mybatis的区别

Mybatis是一个半自动的ORM框架，相对于Hibernate来说，功能可能没有那么强大，但是其也有自身诸多优点，比如简单易用、自己编写SQL可方便排错及调优等等。

所以，目前国内大部分公司都采用Mybatis框架。

### 入门案例

[源码地址](https://gitee.com/pearl88/study-demo/tree/master/mybatis-demo)

**1、** 在数据库中导入Sql脚本(源码地址中有)![ ][nbsp1]；

**2、** 创建一个Maven工程，引入mybatis、Mysql驱动、lombok、logback相关依赖；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.example</groupId>
    <artifactId>mybatis-demo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <dependencies>
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.5.7</version>
        </dependency>
        <!--Mysql 驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.25</version>
        </dependency>
        <!--lombok-->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.20</version>
        </dependency>
        <!--logback日志-->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.7</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-core</artifactId>
            <version>1.1.7</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-access</artifactId>
            <version>1.1.7</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.1.7</version>
        </dependency>
    </dependencies>
    <build>
        <resources>
            <resource>
                <directory>src/main/java</directory>
                <!--idea默认不会编译src的java目录的xml文件-->
                <includes>
                    <!--配置将src源代码下的xml等资源文件编译进classes文件夹-->
                    <include>**/*.xml</include>
                </includes>
            </resource>
        </resources>
    </build>
</project>
```

**1、** 添加logback日志配置文件logback.xml，方便打印分析日志；

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <!-- encoders are assigned the type
             ch.qos.logback.classic.encoder.PatternLayoutEncoder by default -->
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    <root level="debug">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

**1、** 添加用户表对应的实体类；

```java
@Data
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long userId;
    private String userName;
    private String loginName;
    private Integer gender;
    private String phone;
    private String address;
    private Integer organizationId;
    private Boolean state;
    private String email;
    private Integer createUserId;
    private Date modifyDate;
    private Date createDate;
    private String password;
}
```

**1、** 添加用户表对应的UserMapper接口及XML文件，添加根据ID查询用户的SQL；

```java
public interface UserMapper {
    User selectOneById(Long id);
}
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.pearl.mybatis.demo.dao.UserMapper">
    <select id="selectOneById" resultType="org.pearl.mybatis.demo.pojo.entity.User">
    select user_id as userId,user_name as userName,login_name as loginName from base_user where user_id ={id}
  </select>
</mapper>
```

**1、** 添加全局配置文件，XML配置文件中包含了对MyBatis系统的核心设置，包括获取数据库连接实例的数据源（DataSource）以及决定事务作用域和控制方式的事务管理器（TransactionManager）XML头部的声明，用来验证XML文档的正确性environment元素体中包含了事务管理和连接池的配置mappers元素则包含了一组映射器（mapper），这些映射器的XML映射文件包含了SQL代码和映射定义信息；

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <!--驱动名-->
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <!--数据库地址-->
                <property name="url"
                          value="jdbc:mysql://127.0.0.1:3306/angel_admin?serverTimezone=Asia/Shanghai"/>
                <!--用户名-->
                <property name="username" value="root"/>
                <!--密码-->
                <property name="password" value="123456"/>
            </dataSource>
        </environment>
    </environments>
    <!-- 添加mapper XML所在文件夹-->
    <mappers>
        <package name="org.pearl.mybatis.demo.dao"/>
    </mappers>
</configuration>
```

**1、** 读取全局配置文件，获取SqlSessionFactory，通过SqlSession执行SQL；

```java
@Slf4j
public class Test001 {
    public static void main(String[] args) throws IOException {
        // 根据xml配置文件（全局配置文件）创建一个SqlSessionFactory对象
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        // 通过SqlSessionFactory获取SqlSession实例，SqlSession 提供了在数据库执行 SQL 命令所需的所有方法。你可以通过 SqlSession 实例来直接执行已映射的 SQL 语句
        SqlSession sqlSession = sqlSessionFactory.openSession();
		// 通过SqlSession获取Mapper接口实例，并进行SQL执行，映射结果集等操作。
        UserMapper mapper = sqlSession.getMapper(UserMapper.class);
        User user = mapper.selectOneById(1L);
        System.out.println(user);
    }
}
```
