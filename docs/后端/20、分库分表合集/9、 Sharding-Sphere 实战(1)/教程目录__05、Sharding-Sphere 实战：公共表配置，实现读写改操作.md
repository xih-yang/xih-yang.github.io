# 05、Sharding-Sphere 实战：公共表配置，实现读写改操作
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/5.html
- 分类：分库分表
- 分组：教程目录
概述：如果我们有一些非业务表如基础配置表或者数据字典等表，不需要做分库分表那么改如何设计，Sharding-jdbc 中公共表可实现该种配置。公共表即每个数据库中都存在的一张表，改表在数据库中也无分表配置，独立唯一。

环境：SpringBoot 2.2 + mybatis plus3.0 + Sharding jdbc4.0

需求：我们在数据库course_1、course_2、user_db 三个数据库中都创建一张数据字典表t_data,然后实现新增，修改，删除，查询，查询所有表是否同步更新。

工程目录结构：

主要步骤：

**1、** 创建数据库环境；

**2、** 创建maven工程，导入依赖；

**3、** 创建主启动类；

**4、** 创建实体类、数据库接口类；

**5、** 创建配置文件；

**6、** 编写测试代码测试验证；

**一、创建数据库环境**

分别创建三个数据库、course_db_1、course_db_2、user_db。每张表中都创建一个t_data。其他表创建参考《[ShardingSphere(四) 垂直分库配置搭建，实现写入读取](/zhuanlan/sharding/shardingsphere/1/4.html)》。

```java
CREATE TABLE t_data (
  data_id bigint(20) NOT NULL,
  field_name varchar(20) DEFAULT NULL,
  field_value varchar(20) DEFAULT NULL,
  field_key varchar(20) DEFAULT NULL,
  PRIMARY KEY (data_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

**二、创建maven工程，导入依赖**

idea创建maven工程并引入Sharding mybatisplus 等依赖，pom.xml 内容如下：

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

**四、创建业代码**

src/main/java/com/xiaohui/entity/TData.java

```java
package com.xiaohui.entity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
@Data
@TableName(value = "t_data")
public class TData {
    private Long dataId;
    private String fieldKey;
    private String fieldName;
    private String fieldValue;
}
```

src/main/java/com/xiaohui/mapper/DataMapper.java

```java
package com.xiaohui.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xiaohui.entity.TData;
import org.springframework.stereotype.Repository;
@Repository
public interface DataMapper extends BaseMapper<TData> {
}
```

其他实体类、数据库接口类参考上一章节文章《[ShardingSphere(四) 垂直分库配置搭建，实现写入读取](/zhuanlan/sharding/shardingsphere/1/4.html)》。

**五、创建配置文件**

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
#公共表 数据字典表
spring.shardingsphere.sharding.broadcast-tables=t_data
#=================================数据节点配置部分======================================
#=================================数据库分库策略=======================================
#=================================数据库分表策略========================================
#==================================数据库字段生成策略====================================
spring.shardingsphere.sharding.tables.t_data.key-generator.column=data_id
spring.shardingsphere.sharding.tables.t_data.key-generator.type=SNOWFLAKE
#==================================其他配置=============================================
#解决报错 Consider renaming one of the beans or enabling overriding...
spring.main.allow-bean-definition-overriding=true
#打开sql日志输出
spring.shardingsphere.props.sql.show=true
```

公共表配置主要使用**broadcast-tables**进行声明配置，如下配置则表示t_data为所有数据库中的公共表。

spring.shardingsphere.sharding.broadcast-tables=t_data

**六、编写测试类测试验证**

```java
package com.xiaohui;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xiaohui.entity.Course;
import com.xiaohui.entity.TData;
import com.xiaohui.entity.User;
import com.xiaohui.mapper.DataMapper;
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
    private DataMapper dataMapper;
    //=============================公共表测试===================================
    @Test
    public void testAddData(){
        TData data = new TData();
        data.setFieldKey("1");
        data.setFieldName("sex");
        data.setFieldValue("男");
        dataMapper.insert(data);
    }
    @Test
    public void testGetById(){
        QueryWrapper<TData> dataQueryWrapper = new QueryWrapper<>();
        dataQueryWrapper.eq("data_id",562742414687600641L);
        TData data = dataMapper.selectOne(dataQueryWrapper);
        System.out.println(data);
    }
    @Test
    public void testDataDel(){
        QueryWrapper<TData> dataQueryWrapper = new QueryWrapper<>();
        dataQueryWrapper.eq("data_id",557657187803987969L);
        dataMapper.delete(dataQueryWrapper);
    }
}
```

- 测试执行新增测试testAddData()

```java
2023-02-02 16:50:12.866  INFO 7532 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-02 16:50:12.868  INFO 7532 --- [           main] ShardingSphere-SQL                       : Logic SQL: INSERT INTO t_data  ( field_key,field_name,field_value )  VALUES  ( ?,?,? )
2023-02-02 16:50:12.869  INFO 7532 --- [           main] ShardingSphere-SQL                       : SQLStatement: InsertStatement(super=DMLStatement(super=AbstractSQLStatement(type=DML, tables=Tables(tables=[Table(name=t_data, alias=Optional.absent())]), routeConditions=Conditions(orCondition=OrCondition(andConditions=[AndCondition(conditions=[])])), encryptConditions=Conditions(orCondition=OrCondition(andConditions=[])), sqlTokens=[TableToken(tableName=t_data, quoteCharacter=NONE, schemaNameLength=0), SQLToken(startIndex=20)], parametersIndex=3, logicSQL=INSERT INTO t_data  ( field_key,
field_name,field_value )  VALUES  ( ?,?,? )), deleteStatement=false, updateTableAlias={}, updateColumnValues={}, whereStartIndex=0, whereStopIndex=0, whereParameterStartIndex=0, whereParameterEndIndex=0), columnNames=[field_key, field_name, field_value], values=[InsertValue(columnValues=[org.apache.shardingsphere.core.parse.old.parser.expression.SQLPlaceholderExpression@4a44cfc0, org.apache.shardingsphere.core.parse.old.parser.expression.SQLPlaceholderExpression@60e3c26e, org.apache.shardingsphere.core.parse.old.parser.expression.SQLPlaceholderExpression@80b122b])])
2023-02-02 16:50:12.869  INFO 7532 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: INSERT INTO t_data   (field_key, field_name, field_value, data_id) VALUES (?, ?, ?, ?) ::: [1, sex, 男, 563404971823857665]
2023-02-02 16:50:12.869  INFO 7532 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds1 ::: INSERT INTO t_data   (field_key, field_name, field_value, data_id) VALUES (?, ?, ?, ?) ::: [1, sex, 男, 563404971823857665]
2023-02-02 16:50:12.869  INFO 7532 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds2 ::: INSERT INTO t_data   (field_key, field_name, field_value, data_id) VALUES (?, ?, ?, ?) ::: [1, sex, 男, 563404971823857665]
```

通过打印我们可以看到实际执行的sql再每个数据库都执行了新增操作。并且新增时生成的主键id也是一样的。

- 测试查询操作testGetById()

打印日志如下：通过多次执行查询可以通过选择的数据源看出，他会随机的在多个数据源中选择一个进行查询。

```java
2023-02-02 16:54:11.311  INFO 10184 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-02 16:54:11.313  INFO 10184 --- [           main] ShardingSphere-SQL                       : Logic SQL: SELECT  data_id,field_key,field_name,field_value  FROM t_data  WHERE  data_id = ?
2023-02-02 16:54:11.314  INFO 10184 --- [           main] ShardingSphere-SQL                       : SQLStatement: SelectStatement(super=DQLStatement(super=AbstractSQLStatement(type=DQL, tables=Tables(tables=[Table(name=t_data, alias=Optional.absent())]), routeConditions=Conditions(orCondition=OrCondition(andConditions=[])), encryptConditions=Conditions(orCondition=OrCondition(andConditions=[])), sqlTokens=[TableToken(tableName=t_data, quoteCharacter=NONE, schemaNameLength=0)], parametersIndex=1, logicSQL=SELECT  data_id,field_key,field_name,field_value  FROM t_data  WHERE  data_id = ?)), containStar=false, firstSelectItemStartIndex=8, selectListStopIndex=47, groupByLastIndex=0, items=[CommonSelectItem(expression=data_id, alias=Optional.absent()), CommonSelectItem(expression=field_key, alias=Optional.absent()), CommonSelectItem(expression=field_name, alias=Optional.absent()), CommonSelectItem(expression=field_value, alias=Optional.absent())], groupByItems=[], orderByItems=[], limit=null, subqueryStatement=null, subqueryStatements=[], subqueryConditions=[])
2023-02-02 16:54:11.314  INFO 10184 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds2 ::: SELECT  data_id,field_key,field_name,field_value  FROM t_data  WHERE  data_id = ? ::: [563404971823857665]
TData(dataId=563404971823857665, fieldKey=1, fieldName=sex, fieldValue=男)
```

- 测试删除操作testDataDel()

打印如下，可以看到他对每个数据源都进行了删除操作，来保证每张表的数据在每个数据源上保持统一。

```java
2023-02-02 16:57:19.769  INFO 1936 --- [           main] ShardingSphere-SQL                       : Rule Type: sharding
2023-02-02 16:57:19.772  INFO 1936 --- [           main] ShardingSphere-SQL                       : Logic SQL: DELETE FROM t_data  WHERE  data_id = ?
2023-02-02 16:57:19.772  INFO 1936 --- [           main] ShardingSphere-SQL                       : SQLStatement: DMLStatement(super=AbstractSQLStatement(type=DML, tables=Tables(tables=[Table(name=t_data, alias=Optional.absent())]), routeConditions=Conditions(orCondition=OrCondition(andConditions=[])), encryptConditions=Conditions(orCondition=OrCondition(andConditions=[])), sqlTokens=[TableToken(tableName=t_data, quoteCharacter=NONE, schemaNameLength=0)], parametersIndex=1, logicSQL=DELETE FROM t_data  WHERE  data_id = ?), deleteStatement=true, updateTableAlias={t_data=t_data}, updateColumnValues={}, whereStartIndex=20, whereStopIndex=37, whereParameterStartIndex=0, whereParameterEndIndex=0)
2023-02-02 16:57:19.772  INFO 1936 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds0 ::: DELETE FROM t_data  WHERE  data_id = ? ::: [563404971823857665]
2023-02-02 16:57:19.772  INFO 1936 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds1 ::: DELETE FROM t_data  WHERE  data_id = ? ::: [563404971823857665]
2023-02-02 16:57:19.772  INFO 1936 --- [           main] ShardingSphere-SQL                       : Actual SQL: ds2 ::: DELETE FROM t_data  WHERE  data_id = ? ::: [563404971823857665]
```
