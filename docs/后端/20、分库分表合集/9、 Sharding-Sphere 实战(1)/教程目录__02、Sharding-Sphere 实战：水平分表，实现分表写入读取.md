# 02、Sharding-Sphere 实战：水平分表，实现分表写入读取
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/2.html
- 分类：分库分表
- 分组：教程目录
**概述：**本章内容分将搭建一个ShardingSphere工程环境，并实现最简单的单库下的水平分表配置演示。通过解读配置文件我们来了解ShardingSphere中是如何实现他的路由操作。

环境：SpringBoot 2.2 + mybatis plus3.0 + Sharding jdbc4.0

需求：我们对课程表进行水平拆分，将课程id为偶数的课程存放在course_1表中，单数的课程存放在course_2表中。

主要步骤：

**1、** 数据库环境准备；

**2、** 创建maven工程；

**3、** 创建SpringBoot启动类；

**4、** 业务代码编写；

**5、** 添加配置文件（重点）；

**6、** 编写测试类测试；

项目目录：

**一、数据库环境准备**

创建数据库course_db。并创建两张表 course_1、course_2 表，表结构一致。

```java
CREATE TABLE course_2 (
  cid bigint(20) NOT NULL,
  cname varchar(50) NOT NULL,
  user_id bigint(20) NOT NULL,
  cstatus varchar(10) NOT NULL,
  PRIMARY KEY (cid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

**二、创建maven工程，**引入相关依赖 pom.xml文件如下：

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
        <artifactId>spring-boot-starter-parent</artifactId>
        <groupId>org.springframework.boot</groupId>
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

**三、创建SpringBoot启动类**，并指定mybatis Mapper 包扫描路径

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

**四、业务代码创建** 创建课程表的数据库实体类以及数据库操作接口类

数据库实体类：src/main/java/com/xiaohui/entity/Course.java

dao接口类：src/main/java/com/xiaohui/mapper/CourseMapper.java

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

ShardingSphere在配置文件中主要配置包含 数据源配置、数据节点配置、数据库分库策略配置、数据库分表策略配置、字段生成策略配置、其他配置

```java
#sharding-jdbc 分片策略
#=================================数据源配置部分========================================
#数据源名称，多数据源以逗号分隔
spring.shardingsphere.datasource.names=ds0
#配置数据源具体内容
spring.shardingsphere.datasource.ds0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds0.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds0.url=jdbc:mysql://127.0.0.1:3306/course_db
spring.shardingsphere.datasource.ds0.username=root
spring.shardingsphere.datasource.ds0.password=root
#=================================数据节点配置部分======================================
#指定course表分布情况 分布在那些数据源上以及那些表上
spring.shardingsphere.sharding.tables.course.actual-data-nodes=ds$->{0}.course_$->{1..2}
#=================================数据库分库策略=======================================
#（分表单库无需配置）
#=================================数据库分表策略========================================
#指定分片策略 约定cid值偶数添加到couse_1表，奇数添加到course_2表上
spring.shardingsphere.sharding.tables.course.table-strategy.inline.sharding-column=cid
spring.shardingsphere.sharding.tables.course.table-strategy.inline.algorithm-expression=course_$->{cid % 2 +1}
#==================================数据库字段生成策略====================================
#指定course表里面主键cid的生成策略 SNOWFKAKE 雪花算法
spring.shardingsphere.sharding.tables.course.key-generator.column=cid
spring.shardingsphere.sharding.tables.course.key-generator.type=SNOWFLAKE
#==================================其他配置=============================================
#解决报错 Consider renaming one of the beans or enabling overriding...
spring.main.allow-bean-definition-overriding=true
#打开sql日志输出
spring.shardingsphere.props.sql.show=true
```

- 在数据源配置部分

spring.shardingsphere**.datasource.names**=配置声明了我们的链接的所有数据源

spring.shardingsphere**.datasource.ds0.xxxx**= 配置了每个数据源的详情链接信息

- 在数据节点配置部分 **actual-data-nodes**

spring.shardingsphere.sharding.tables.course**.actual-data-nodes**= 声明了我们的course表所分布的数据源以及表情况。

该配置支持行表达式，${ expression }或$->{ expression }。${begin..end}表示范围区间，${[unit1, unit2, unit_x]}表示枚举值。行表达式中如果出现连续多个${ expression }或$->{ expression }表达式，整个表达式最终的结果将会根据每个子表达式的结果进行笛卡尔组合。

${['online'， 'offline']}_table${1..3}：最终会解析为：online_table1, online_table2, online_table3, offline_table1, offline_table2, offline_table3

- 数据库分库策略 **database-strategy**

由于本章示例中只有一个数据库，所以不需要进行配置。

- 数据库分表策略 **table-strategy**

数据库的分表策略也是建立在每张表上，不同的表有不同的分表规则。所以每张表都可以进行配置其对应的分表策略。当然我们也可以配置默认的分表策略。在该部分中我们配置了两行。

spring.shardingsphere.sharding.tables.course**.table-strategy.inline.sharding-column**=表示 用于分表所用的字段，sharing 使用该字段进行计算将操作那张表。

spring.shardingsphere.sharding.tables.course**.table-strategy.inline.algorithm-expression**=表示通过使用上面的字段使用该表达式计算出一个表名

- 字段生成策略 **key-generator**

spring.shardingsphere.sharding.tables.course**.key-generator.column**=cid 表示那些字段需要通过Sharding生成

spring.shardingsphere.sharding.tables.course**.key-generator.type**=SNOWFLAKE 生成的规则策略如此处的雪花算法，另外还有UUID

- 其他配置

配置是否打印sql日志等

**六、编写测试类** 进行测试验证：

src/test/java/com/xiaohui/MainTest.java

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
    public void testAdd(){
        for (int i = 1; i <= 10; i++) {
            Course course = new Course();
            course.setCname("html_"+i);
            course.setUserId(100L);
            course.setCstatus("1");
            courseMapper.insert(course);
        }
    }
    @Test
    public void testGet(){
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("cid",563014015635161088L);
        Course course = courseMapper.selectOne(wrapper);
        System.out.println(course);
    }
    @Test
    public void testGetList(){
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("cstatus","1");
        wrapper.in("cid",557587021787299841L,557588085982887936L);
        List<Course> courseList = courseMapper.selectList(wrapper);
        System.out.println(courseList.toString());
    }
}
```

执行新增testAdd 方法，打印日志如下（摘取前两条sql部分）：

```java
2023-02-01 14:56:41.524  INFO 8732 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-01 14:56:41.527  INFO 8732 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO course  ( cname,user_id,cstatus )  VALUES  ( ?,?,? )
2023-02-01 14:56:41.528  INFO 8732 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: INSERT INTO course_2   (cname, user_id, cstatus, cid) VALUES (?, ?, ?, ?) ::: [html_1, 100, 1, 563014014649499649]
2023-02-01 14:56:41.623  INFO 8732 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO course  ( cname,user_id,cstatus )  VALUES  ( ?,?,? )
2023-02-01 14:56:41.623  INFO 8732 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: INSERT INTO course_1   (cname, user_id, cstatus, cid) VALUES (?, ?, ?, ?) ::: [html_2, 100, 1, 563014015635161088]
2023-02-01 14:56:41.686  INFO 8732 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
```

通过查看上面前两条数据的插入sql 我们可以看到 其分别打印了两条sql语句。一条为逻辑sql（Logic SQL），一条为实际执行sql（Actual）。实际执行sql 中打印了出了真实的数据源、真实的表信息。实际打印sql 需要在配置文件中打开sql打印开关方可打印。我们通过实际打印的sql可以看到 第一个生成的主键id 为奇数，根据我们配置的规则其落到了course_2表中。第二条主键为偶数落在了course_1表中。执行新增后的表数据如下：

执行查询操作打印如下：

```java
2023-02-01 16:53:57.499  INFO 8580 --- [           main] ShardingSphere-SQL                       : Logic SQL: SELECT  cid,cname,user_id,cstatus  FROM course  WHERE  cid = ?
2023-02-01 16:53:57.500  INFO 8580 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: SELECT  cid,cname,user_id,cstatus  FROM course_1  WHERE  cid = ? ::: [563014015635161088]
Course(cid=563014015635161088, cname=html_2, userId=100, cstatus=1)
```

查询我们也是根据主键进行判断奇偶数，奇数查询2表，偶数查询1表。测试符合我们的预期。
