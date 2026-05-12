# 04、Sharding-Sphere 实战：垂直分库，实现写入读取
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/4.html
- 分类：分库分表
- 分组：教程目录
概述：垂直分库即转库专用，不同的数据库中存放不同的表信息。比如学生和课程信息，我们将课程表存放与一个数据库中，学生信息存储于另一个库中，本章将介绍如何通过配置Sharding jdbc实现垂直分库操作。

环境：SpringBoot 2.2 + mybatis plus3.0 + Sharding jdbc4.0

需求：我们将用户表t_user 表存放在数据库user_db中。course表保持上一章节《[03、Sharding-Sphere 实战：水平分库，实现写入读取](/zhuanlan/sharding/shardingsphere/1/3.html)》中的水平分库水平分表配置。我们在保存读取用户信息时在user_db库中操作，读写course表时在course_db_1、course_db_2表中操作。

工程目录结构：

主要步骤：

**1、** 数据库环境准备；

**2、** 创建maven工程引入依赖；

**3、** 创建主启动类；

**4、** 创建业务代码；

**5、** 创建SpringBoot配置文件；

**6、** 编写测试类测试验证；

**一、数据库环境准备**

分表创建三个数据库 user_db、course_db_1、course_db_2。user_db库中创建t_user表，course_db12中分别创建course_1、course_2表

```java
#课程表 course_1 course_2 结构一致
CREATE TABLE course_1 (
  cid bigint(20) NOT NULL,
  cname varchar(50) NOT NULL,
  user_id bigint(20) NOT NULL,
  cstatus varchar(10) NOT NULL,
  PRIMARY KEY (cid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
#用户表
CREATE TABLE t_user (
  user_id bigint(20) NOT NULL,
  username varchar(50) NOT NULL,
  ustatus varchar(50) NOT NULL,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

**二、创建maven工程**

pom.xml 引入相关依赖，内容如下：

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.sharding</groupId>
    <artifactId>sharding</artifactId>
    <version>1.0-SNAPSHOT</version>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.2.RELEASE</version>
    </parent>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid-spring-boot-starter</artifactId>
            <version>1.1.20</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.31</version>
        </dependency>
        <dependency>
            <groupId>org.apache.shardingsphere</groupId>
            <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
            <version>4.0.0-RC1</version>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.0.2</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
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

**三、创建主启动类**

src/main/java/com/xiaohui/ShardingApplication.java

```java
package com.xiaohui;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
@MapperScan("com.xiaohui.mapper")
public class ShardingApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShardingApplication.class,args);
    }
}
```

**四、创建业务代码**

编写数据库实体类以及表Dao层接口类，注意mybatis-plus 中接口层需要继承BaseMapper接口

src/main/java/com/xiaohui/entity/Course.java

```java
package com.xiaohui.entity;
import lombok.Data;
@Data
public class Course {
    private Long cid;
    private String cname;
    private Long userId;
    private String cstatus;
}
```

由于user实体类与表名不匹配，所以需要使用mybatis-plus @TableName注解进行声明

```java
package com.xiaohui.entity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
@Data
@TableName(value="t_user")
public class User {
    private Long userId;
    private String username;
    private String ustatus;
}
```

src/main/java/com/xiaohui/mapper/CourseMapper.java

```java
package com.xiaohui.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xiaohui.entity.Course;
import org.springframework.stereotype.Repository;
@Repository
public interface CourseMapper extends BaseMapper<Course> {
}
```

src/main/java/com/xiaohui/mapper/UserMapper.java

```java
package com.xiaohui.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xiaohui.entity.User;
import org.springframework.stereotype.Repository;
@Repository
public interface UserMapper extends BaseMapper<User> {
}
```

**五、创建SpringBoot 配置文件(重点)**

创建SpringBoot配置文件 application.properties

```java
#sharding-jdbc 分片策略
#=================================数据源配置部分========================================
#数据源名称，多数据源以逗号分隔
spring.shardingsphere.datasource.names=ds0,ds1,ds2
#配置 ds0 ds1数据源具体内容
spring.shardingsphere.datasource.ds0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds0.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds0.url=jdbc:mysql://127.0.0.1:3306/course_db_1
spring.shardingsphere.datasource.ds0.username=root
spring.shardingsphere.datasource.ds0.password=root
spring.shardingsphere.datasource.ds1.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds1.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds1.url=jdbc:mysql://127.0.0.1:3306/course_db_2
spring.shardingsphere.datasource.ds1.username=root
spring.shardingsphere.datasource.ds1.password=root
spring.shardingsphere.datasource.ds2.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds2.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds2.url=jdbc:mysql://127.0.0.1:3306/user_db
spring.shardingsphere.datasource.ds2.username=root
spring.shardingsphere.datasource.ds2.password=root
#=================================数据节点配置部分======================================
#配置course表在数据库上的信息，在那些数据库里，以及库中的分表情况(tables 后面的course可以随便取名代表后面的匹配表)
spring.shardingsphere.sharding.tables.course.actual-data-nodes=ds$->{0..1}.course_$->{1..2}
spring.shardingsphere.sharding.tables.t_user.actual-data-nodes=ds$->{2}.t_user
#=================================数据库分库策略=======================================
# 配置默认的水平分库的策略 使用 user_id字段进行判断
#spring.shardingsphere.sharding.default-database-strategy.inline.sharding-column=user_id
#spring.shardingsphere.sharding.default-database-strategy.inline.algorithm-expression=ds$->{user_id % 2}
#数据库策略
spring.shardingsphere.sharding.tables.t_user.database-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.t_user.database-strategy.inline.algorithm-expression=ds2
# 配置course表的分库策略
spring.shardingsphere.sharding.tables.course.database-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.course.database-strategy.inline.algorithm-expression=ds$->{user_id % 2}
#=================================数据库分表策略========================================
#指定分片策略 约定cid值偶数添加到couse_1表，奇数添加到course_2表上
spring.shardingsphere.sharding.tables.course.table-strategy.inline.sharding-column=cid
spring.shardingsphere.sharding.tables.course.table-strategy.inline.algorithm-expression=course_$->{cid % 2 +1}
#表策略table-strategy
spring.shardingsphere.sharding.tables.t_user.table-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.t_user.table-strategy.inline.algorithm-expression=t_user
#==================================数据库字段生成策略====================================
###单表的水平拆分配置 指定course表里面主键cid的生成策略 SNOWFKAKE 雪花算法
spring.shardingsphere.sharding.tables.course.key-generator.column=cid
spring.shardingsphere.sharding.tables.course.key-generator.type=SNOWFLAKE
#字段生成策略key-generator
spring.shardingsphere.sharding.tables.t_user.key-generator.column=user_id
spring.shardingsphere.sharding.tables.t_user.key-generator.type=SNOWFLAKE
#==================================其他配置=============================================
#解决报错 Consider renaming one of the beans or enabling overriding...
spring.main.allow-bean-definition-overriding=true
#打开sql日志输出
spring.shardingsphere.props.sql.show=true
```

在垂直分库配置中主要声明部分在 数据节点配置中需要指定对应表所在的库。以及分库策略中配置对应的分库策略，以来实现专库专用。

```java
spring.shardingsphere.sharding.tables.course.actual-data-nodes=ds$->{0..1}.course_$->{1..2}
spring.shardingsphere.sharding.tables.t_user.actual-data-nodes=ds$->{2}.t_user
```

```java
spring.shardingsphere.sharding.tables.t_user.database-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.t_user.database-strategy.inline.algorithm-expression=ds2
spring.shardingsphere.sharding.tables.course.database-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.course.database-strategy.inline.algorithm-expression=ds$->{user_id % 2}
```

我们t_user表只有一个库所以我们在配置inline的分库表达式就直接写死为ds2库。

**六、编写测试类测试验证**

编写测试类：src/test/java/com/xiaohui/MainTest.java

```java
package com.xiaohui;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xiaohui.entity.Course;
import com.xiaohui.entity.User;
import com.xiaohui.mapper.CourseMapper;
import com.xiaohui.mapper.UserMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import java.util.List;
@RunWith(SpringRunner.class)
@SpringBootTest
public class MainTest {
    @Autowired
    private CourseMapper courseMapper;
    @Autowired
    private UserMapper userMapper;
    @Test
    public void testUserAdd(){
        User u = new User();
        u.setUsername("王五");
        u.setUstatus("1");
        userMapper.insert(u);
    }
       @Test
    public void testUserGet(){
        QueryWrapper wrapper = new QueryWrapper<User>();
        wrapper.eq("user_id", 563316786842304513L);
        User user = userMapper.selectOne(wrapper);
        System.out.println(user);
    }
    @Test
    public void testCourseGet(){
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("cid",563102169142657024L);
        wrapper.eq("user_id",102L);
        Course course = courseMapper.selectOne(wrapper);
        System.out.println(course);
    }
    @Test
    public void testCourseDel(){
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("cid",557605627916976129L);
        wrapper.eq("user_id",101L);
        courseMapper.delete(wrapper);
    }
}
```

- 执行新增测试方法testUserAdd(),控制台打印如下：

```java
2023-02-02 10:59:47.944  INFO 8960 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO t_user  ( username,ustatus )  VALUES  ( ?,? )
2023-02-02 10:59:47.945  INFO 8960 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds2 ::: INSERT INTO t_user   (username, ustatus, user_id) VALUES (?, ?, ?) ::: [王五, 1, 563316786842304513]
```

通过sql 和数据库查看我们只在ds2即 user_db库中新增了一条数据。

执行查询用户测试方法testUserGet()，日志打印如下：

```java
2023-02-02 11:08:57.926  INFO 8780 --- [           main] ShardingSphere-SQL                       : Logic SQL: SELECT  user_id,username,ustatus  FROM t_user  WHERE  user_id = ?
2023-02-02 11:08:57.927  INFO 8780 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds2 ::: SELECT  user_id,username,ustatus  FROM t_user  WHERE  user_id = ? ::: [563316786842304513]
User(userId=563316786842304513, username=王五, ustatus=1)
```

- 执行课程查询方法，日志打印如下：

```java
2023-02-02 11:12:56.141  INFO 7824 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-02 11:12:56.143  INFO 7824 --- [           main] ShardingSphere-SQL                       : Logic SQL: SELECT  cid,cname,user_id,cstatus  FROM course  WHERE  cid = ? AND user_id = ?
2023-02-02 11:12:56.144  INFO 7824 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: SELECT  cid,cname,user_id,cstatus  FROM course_1  WHERE  cid = ? AND user_id = ? ::: [563102169142657024, 102]
Course(cid=563102169142657024, cname=sql_2, userId=102, cstatus=1)
```

根据上面打印，均按照Sharding对应的配置规则进行正确的分库分表路由。成功的进行了新增以及查询操作。
