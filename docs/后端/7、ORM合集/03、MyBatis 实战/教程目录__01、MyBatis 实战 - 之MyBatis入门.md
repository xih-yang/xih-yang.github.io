# 01、MyBatis 实战 - 之MyBatis入门
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/1.html
- 分类：ORM框架
- 分组：教程目录
## 一、mybatis的本质

```java
mybatis本质上就是对JDBC的封装，是一个持久层框架
```

## 二、ORM思想的深入理解和mybatis的特点

### 1、ORM思想：对象关系映射

O：jvm中的java对象

R：关系型数据库

M：映射

mybatis框架就是一个ORM框架

mybatis可以干什么？

java对象数据库表中的一条记录

### 2、mybatis的特点

**mybatis是一个半自动化的ORM框架**，因为在mybatis框架中，sql语句需要程序员自己编写

**Hibernate框架就是一个全自动化的ORM框架**，使用Hibernate框架的时候，不需要程序员手动编写SQL语句，SQL语句是自动生成的。

## 三、mybatis的入门程序

### 1、先准备mysql表

```java
SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for t_car
-- ----------------------------
DROP TABLE IF EXISTS t_car;
CREATE TABLE t_car  (
  id int(11) NOT NULL AUTO_INCREMENT,
  car_num varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  brand varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  guide_price decimal(10, 2) NULL DEFAULT NULL,
  produce_time char(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  car_type varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
SET FOREIGN_KEY_CHECKS = 1;
```

### 2、加入mybatis依赖，加入mysql驱动依赖

```xml
<dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis</artifactId>
      <version>3.5.10</version>
    </dependency>
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>8.0.30</version>
    </dependency>
```

### 3、编写mybatis核心配置文件：mybatis-config.xml

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
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/powernode"/>
                <property name="username" value="root"/>
                <property name="password" value="root"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="CarMapper.xml"/>
    </mappers>
</configuration>
```

**注意：**

```java
这个xml文件名不是必须要叫mybatis-config.xml，可以叫其他名字。
这个文件存放的位置也不是固定的，可以随意，但一般情况下，是放在根目录下
```

### 4、从XML 中构建 SqlSessionFactory

### 5、mybatis有两个注意的配置文件

（1）一个是 mybatis-config.xml，这个是核心配置文件，主要配置连接数据库的信息（一个）

（2）另外一个是，XxxxMapper.xml文件，用来配置sql语句（一个表一个）

### 6、编写mapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="jskdlf">
    <insert id="">
        insert into t_car (id,car_num,brand,guide_price,produce_time,car_type)
        values (null ,1003,'auto',30.0,'2020-01-02','燃油')
    </insert>
</mapper>
```

### 7、编写mybatis程序代码

- 在mybatis中，负责执行sql语句的那个对象叫 SqlSession。

要想获取SqlSession对象，需要先获取SqlSessionFactory对象，

要获取SqlSessionFactory对象，需要通过SqlSessionFactoryBuilder的build方法来得到SqlSessionFactory对象。

```java
package com.ba01.dao;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
public class Test
{
    public static void main(String[] args) throws IOException {
        SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
        SqlSessionFactory sqlSessionFactory = sqlSessionFactoryBuilder.build(Resources.getResourceAsStream("mybatis-config.xml"));
        SqlSession sqlSession = sqlSessionFactory.openSession();
        int insertCar = sqlSession.insert("insertCar");
        sqlSession.commit();
    }
}
```

```java
运行结果
```
