# 07、Sharding-Sphere 实战：读写分离配置，实现分库读写操作
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/7.html
- 分类：分库分表
- 分组：教程目录
概述：本章通过介绍使用ShardingSphere实现数据库的读写分离操作。在实现读写分离之前，数据库的主从同步需要提前配置完成，主从同步实现不由Sharding提供。主从同步可参考上一章节《[06、Sharding-Sphere 实战：读写分离之MYSQL主从同步配置](/zhuanlan/sharding/shardingsphere/1/6.html)》。

环境：SpringBoot 2.2 + mybatis plus3.0 + Sharding jdbc4.0

需求：实现数据库新增修改删除操作操作3306端口的主库（3306/user_db），查询操作读取3307端口的从库（3307/user_db）。

项目目录结构：

步骤：

**1、** 准备数据库环境；

**2、** idea创建maven工程，引入依赖；

**3、** 创建主启动类；

**4、** 编写业务代码；

**5、** 添加配置文件；

**6、** 编写测试代码测试验证；

**一、准备数据库环境**

准备两个数据库服务器，实现主从同步配置，两个库user_db中都创建t_user表,表结构如下：

```java
CREATE TABLE t_user (
  user_id bigint(20) NOT NULL,
  username varchar(50) NOT NULL,
  ustatus varchar(50) NOT NULL,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

**二、创建maven工程，引入依赖**

创建maven工程，引入Shardingjdbc以及其他相关依赖，pom.xml 如下

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

**四、编写业务代码**

主要为数据库实体类：src/main/java/com/xiaohui/entity/User.java

数据库层接口类：src/main/java/com/xiaohui/mapper/UserMapper.java

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

```java
package com.xiaohui.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xiaohui.entity.User;
import org.springframework.stereotype.Repository;
@Repository
public interface UserMapper extends BaseMapper<User> {
}
```

**五、添加配置文件application.properties（重点）**

```java
#sharding-jdbc 读写分离
#=================================数据源配置部分=====================================
#数据源名称，多数据源以逗号分隔
spring.shardingsphere.datasource.names=ds2,slave0
#配置 ds0 ds1数据源具体内容
spring.shardingsphere.datasource.ds2.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds2.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds2.url=jdbc:mysql://127.0.0.1:3306/user_db
spring.shardingsphere.datasource.ds2.username=root
spring.shardingsphere.datasource.ds2.password=root
#从库
spring.shardingsphere.datasource.slave0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.slave0.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.slave0.url=jdbc:mysql://127.0.0.1:3307/user_db
spring.shardingsphere.datasource.slave0.username=root
spring.shardingsphere.datasource.slave0.password=root
#=================================主从数据库声明部分====================================
#配置指定主从数据库
spring.shardingsphere.sharding.master-slave-rules.ms0.master-data-source-name=ds2
spring.shardingsphere.sharding.master-slave-rules.ms0.slave-data-source-names=slave0
#=================================数据节点配置部分======================================
#设置表数据节点（最后的ms0 一定要注意，不能写ds2.t_user）
spring.shardingsphere.sharding.tables.t_user.actual-data-nodes=ms0.t_user
#=================================数据库分表策略========================================
#表策略table-strategy
spring.shardingsphere.sharding.tables.t_user.table-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.t_user.table-strategy.inline.algorithm-expression=t_user
#==================================数据库字段生成策略====================================
#字段生成策略key-generator
spring.shardingsphere.sharding.tables.t_user.key-generator.column=user_id
spring.shardingsphere.sharding.tables.t_user.key-generator.type=SNOWFLAKE
#==================================其他配置=============================================
#解决报错 Consider renaming one of the beans or enabling overriding...
spring.main.allow-bean-definition-overriding=true
#打开sql日志输出
spring.shardingsphere.props.sql.show=true
```

主从同步主要配置的为**spring.shardingsphere.sharding.master-slave-rules** 配置

```java
spring.shardingsphere.sharding.master-slave-rules.ms0.master-data-source-name=ds2
spring.shardingsphere.sharding.master-slave-rules.ms0.slave-data-source-names=slave0
```

为主从同步部取一个名称为ms0，并指定其主数据库ds2，和从数据库slave0。

```java
spring.shardingsphere.sharding.tables.t_user.actual-data-nodes=ms0.t_user
```

在设置表的数据节点时主要注意的是不能写主库或从库的数据库节点名称如ds2.t_user。。需要使用主从同步配置设置的节点名称ms0。

**六、编写测试代码测试验证**

src/test/java/com/xiaohui/MainTest.java

```java
package com.xiaohui;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xiaohui.entity.User;
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
    private UserMapper userMapper;
    @Test
    public void testUserAdd(){
        User u = new User();
        u.setUsername("张三");
        u.setUstatus("1");
        userMapper.insert(u);
    }
    @Test
    public void testUserGet(){
        QueryWrapper wrapper = new QueryWrapper<User>();
        wrapper.eq("user_id", 564030748839903233L);
        User user = userMapper.selectOne(wrapper);
        System.out.println(user);
    }
}
```

执行保存操作testUserAdd()，打印日志如下： 通过实际的sql 我们可以看到其操作的为ds2 即我们的主数据库。

```java
2023-02-04 10:16:49.743  INFO 9428 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-04 10:16:49.746  INFO 9428 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO t_user  ( username,ustatus )  VALUES  ( ?,? )
2023-02-04 10:16:49.746  INFO 9428 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds2 ::: INSERT INTO t_user   (username, ustatus, user_id) VALUES (?, ?, ?) ::: [张三, 1, 564030748839903233]
```

执行查询操作，打印日志如下：通过实际的sql 我们可以看到查询读取的为 slave0 从库，即已实现数据读写分离。

```java
2023-02-04 10:20:13.929  INFO 1544 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-04 10:20:13.931  INFO 1544 --- [           main] ShardingSphere-SQL                       : Logic SQL: SELECT  user_id,username,ustatus  FROM t_user  WHERE  user_id = ?
2023-02-04 10:20:13.931  INFO 1544 --- [           main] ShardingSphere-SQL                       : SQLStatement: SelectStatement(super=DQLStatement(super=AbstractSQLStatement(type=DQL, tables=Tables(tables=[Table(name=t_user, alias=Optional.absent())]), routeConditions=Conditions(orCondition=OrCondition(andConditions=[AndCondition(conditions=[Condition(column=Column(name=user_id, tableName=t_user), operator=EQUAL, compareOperator==, positionValueMap={}, positionIndexMap={0=0})])])), encryptConditions=Conditions(orCondition=OrCondition(andConditions=[])), sqlTokens=[TableToken(tableName=t_user, quoteCharacter=NONE, schemaNameLength=0)], parametersIndex=1, logicSQL=SELECT  user_id,username,ustatus  FROM t_user  WHERE  user_id = ?)), containStar=false, firstSelectItemStartIndex=8, selectListStopIndex=31, groupByLastIndex=0, items=[CommonSelectItem(expression=user_id, alias=Optional.absent()), CommonSelectItem(expression=username, alias=Optional.absent()), CommonSelectItem(expression=ustatus, alias=Optional.absent())], groupByItems=[], orderByItems=[], limit=null, subqueryStatement=null, subqueryStatements=[], subqueryConditions=[])
2023-02-04 10:20:13.932  INFO 1544 --- [           main] ShardingSphere-SQL                       : Actual SQL: slave0 ::: SELECT  user_id,username,ustatus  FROM t_user  WHERE  user_id = ? ::: [564030748839903233]
User(userId=564030748839903233, username=张三, ustatus=1)
```
