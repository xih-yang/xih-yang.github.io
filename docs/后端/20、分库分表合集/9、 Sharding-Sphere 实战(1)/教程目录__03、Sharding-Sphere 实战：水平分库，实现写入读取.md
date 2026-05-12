# 03、Sharding-Sphere 实战：水平分库，实现写入读取
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/3.html
- 分类：分库分表
- 分组：教程目录
概述：本章将介绍如何通过Sharding jdbc来实现数据库的水平分库操作，并从零搭建一个SpringBoot工程实现分库的读写操作。本文章在上一章节基础上改造，其中内容包含了表的水平拆分内容

环境：SpringBoot 2.2 + mybatis plus3.0 + Sharding jdbc4.0

需求：我们将客户号为单数的用户数据存储于 course_db_2 数据库中，将客户号为单号的课程数据存储于 course_db_1 库中。

主要步骤：

**1、** 数据库环境准备；

**2、** 创建maven工程引入依赖；

**3、** 创建主启动类；

**4、** 创建实体类、dao接口类业务代码；

**5、** 创建配置文件application.properties；

**6、** 创建测试类测试验证；

项目完整目录结构如下：

**一、数据库环境准备** 数据库创建与表创建

```java
#创建数据库
CREATE DATABASE course_db_1; 
CREATE DATABASE course_db_2; 
#在两个数据库下分别创建表1
CREATE TABLE course_1 (
  cid bigint(20) NOT NULL,
  cname varchar(50) NOT NULL,
  user_id bigint(20) NOT NULL,
  cstatus varchar(10) NOT NULL,
  PRIMARY KEY (cid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#在两个数据库下分别表2
CREATE TABLE course_2 (
  cid bigint(20) NOT NULL,
  cname varchar(50) NOT NULL,
  user_id bigint(20) NOT NULL,
  cstatus varchar(10) NOT NULL,
  PRIMARY KEY (cid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

**二、创建maven工程**，并引入相关依赖。

pom.xml 文件内容如下：

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

**三：创建主启动类**，并指定mapper包扫描路径

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

**四、创建业务代码** 数据库实体类以及表Dao接口

src/main/java/com/xiaohui/entity/Course.java

src/main/java/com/xiaohui/mapper/CourseMapper.java

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

```java
package com.xiaohui.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xiaohui.entity.Course;
import org.springframework.stereotype.Repository;
@Repository
public interface CourseMapper extends BaseMapper<Course> {
}
```

**五**、**添加配置文件** application.properties 配置（重点）

```java
#sharding-jdbc 分片策略
#=================================数据源配置部分========================================
#数据源名称，多数据源以逗号分隔
spring.shardingsphere.datasource.names=ds0,ds1
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
#=================================数据节点配置部分======================================
#配置course表在数据库上的信息，在那些数据库里，以及库中的分表情况(tables 后面的course可以随便取名代表后面的匹配表)
spring.shardingsphere.sharding.tables.course.actual-data-nodes=ds$->{0..1}.course_$->{1..2}
#=================================数据库分库策略=======================================
# 配置默认的水平分库的策略 使用 user_id字段进行判断
#spring.shardingsphere.sharding.default-database-strategy.inline.sharding-column=user_id
#spring.shardingsphere.sharding.default-database-strategy.inline.algorithm-expression=ds$->{user_id % 2}
# 配置course表的分库策略
spring.shardingsphere.sharding.tables.course.database-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.course.database-strategy.inline.algorithm-expression=ds$->{user_id % 2}
#=================================数据库分表策略========================================
#指定分片策略 约定cid值偶数添加到couse_1表，奇数添加到course_2表上
spring.shardingsphere.sharding.tables.course.table-strategy.inline.sharding-column=cid
spring.shardingsphere.sharding.tables.course.table-strategy.inline.algorithm-expression=course_$->{cid % 2 + 1}
#==================================数据库字段生成策略====================================
###单表的水平拆分配置 指定course表里面主键cid的生成策略 SNOWFKAKE 雪花算法
spring.shardingsphere.sharding.tables.course.key-generator.column=cid
spring.shardingsphere.sharding.tables.course.key-generator.type=SNOWFLAKE
#==================================其他配置=============================================
#解决报错 Consider renaming one of the beans or enabling overriding...
spring.main.allow-bean-definition-overriding=true
#打开sql日志输出
spring.shardingsphere.props.sql.show=true
```

在上面配置中 数据库配置部分我们声明了两个数据库分别取名为ds0、ds1。

在数据节点上我们指定了course表的分布情况ds$->{0..1}.course_$->{1..2} 表示分布在 ds0.course_1、ds0.course_2、ds1.course_1、ds1.course_2 上。

在数据库分库策略配置部分

spring.shardingsphere.sharding.tables.course.**database-strategy.inline.sharding-column**=user_id 表示用户计算分库的数据库表字段

spring.shardingsphere.sharding.tables.course.**database-strategy.inline.algorithm-expression**=ds$->{user_id % 2} 表示计算分库的表达式，该表达式表示奇数的客户号将存储于ds1上。偶数客户号将存储于ds0上

#spring.shardingsphere.sharding.default-database-strategy.inline.sharding-column=user_id 表示默认的分库策略字段

#spring.shardingsphere.sharding.default-database-strategy.inline.algorithm-expression=ds`$`->{user_id % 2} 表示默认的分库表达式

其他字段配置为分表策略以及字段生成策略，可参考文章《[ShardingSphere(二) 水平分表配置搭建，实现分表写入读取](/zhuanlan/sharding/shardingsphere/1/2.html)》

**六、编写测试类** 进行测试验证：

```java
package com.xiaohui;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xiaohui.entity.Course;
import com.xiaohui.mapper.CourseMapper;
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
    @Test
    public void testDbAdd(){
        for (int i = 1; i <= 4; i++) {
            Course course = new Course();
            course.setCname("sql_"+i);
            course.setUserId(100L+i);
            course.setCstatus("1");
            courseMapper.insert(course);
        }
    }
    @Test
    public void testDbGet(){
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("cid",557605627916976129L);
        wrapper.eq("user_id",101L);
        Course course = courseMapper.selectOne(wrapper);
        System.out.println(course);
    }
    @Test
    public void testDbGetList(){
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("cstatus","1");
        wrapper.in("cid",557605627916976129L,557588085982887936L);
        List<Course> courseList = courseMapper.selectList(wrapper);
        System.out.println(courseList.toString());
    }
}
```

执行测试添加方法testDbAdd() ，打印sql 如下：

```java
2023-02-01 20:46:58.964  INFO 10496 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO course  ( cname,user_id,cstatus )  VALUES  ( ?,?,? )
2023-02-01 20:46:58.966  INFO 10496 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds1 ::: INSERT INTO course_2   (cname, user_id, cstatus, cid) VALUES (?, ?, ?, ?) ::: [sql_1, 101, 1, 563102168291213313]
2023-02-01 20:46:59.057  INFO 10496 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO course  ( cname,user_id,cstatus )  VALUES  ( ?,?,? )
2023-02-01 20:46:59.057  INFO 10496 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: INSERT INTO course_1   (cname, user_id, cstatus, cid) VALUES (?, ?, ?, ?) ::: [sql_2, 102, 1, 563102169142657024]
2023-02-01 20:46:59.139  INFO 10496 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO course  ( cname,user_id,cstatus )  VALUES  ( ?,?,? )
2023-02-01 20:46:59.139  INFO 10496 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds1 ::: INSERT INTO course_2   (cname, user_id, cstatus, cid) VALUES (?, ?, ?, ?) ::: [sql_3, 103, 1, 563102169486589953]
2023-02-01 20:46:59.222  INFO 10496 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO course  ( cname,user_id,cstatus )  VALUES  ( ?,?,? )
2023-02-01 20:46:59.230  INFO 10496 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: INSERT INTO course_1   (cname, user_id, cstatus, cid) VALUES (?, ?, ?, ?) ::: [sql_4, 104, 1, 563102169834717184]
```

通过实际打印的sql以及参数我们可以看到 101 103编号的用户课程信息存储在了ds1的数据库中，102 104编号的记录被存放在了ds0的数据库中。同时也根据课程主键的奇偶数分别存在了当前库的对应分表上。

我们测试查询方法：testDbGet() 打印如下：

```java
2023-02-01 20:56:13.021  INFO 8012 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds1 ::: SELECT  cid,cname,user_id,cstatus  FROM course_2  WHERE  cid = ? AND user_id = ? ::: [563102168291213313, 101]
Course(cid=563102168291213313, cname=sql_1, userId=101, cstatus=1)
```

Sharding将根据查询的字段userId 和 cid 在对应的库和对应的表中进行查询，有则返回查询数据，无则返回null。
