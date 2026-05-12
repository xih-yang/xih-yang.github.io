# 03、JDBC 教程 - 通过Statement执行更新操作
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/3.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 通过Statement执行更新操作

#### Statement

**1、** 用于执行SQL语句的对象；

**2、** 通过Connection的createStatement()方法获取；

**3、** 通过executeUpdate(sql)执行SQL语句；

**4、** 传入的SQL可以是INSERT，UPDATE和DELETE，但是不能是SELECT；

**5、** 执行了SQL之后会返回一个int类型的数值，这个值是数据库被改变的行数；

**6、** Statement和Connection都是应用程序和数据库服务器的连接资源，使用后一定要关闭，需要在finally块中关闭，关闭的顺序是先获取后关闭，倒序关闭，即先关闭Statement后关闭Connection；

#### 本章前提

默认前提：已有一个MySQL数据库：test，且有一个表：user表

MySQL数据库信息：

**1、** 地址：localhost；

**2、** 端口：3306；

**3、** 用户名：root；

**4、** 密码：admin123；

表结构：

列名
数据类型
长度
主键
非空
自增
注释

id
int
11
√
√
√
主键ID

name
varchar
10

√

姓名

age
int
10

√

年龄

remark
varchar
50

备注

建库及建表SQL语句如下：

```java
CREATE DATABASE test ;
USE test;
CREATE TABLE user (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  name varchar(10) COLLATE utf8_bin DEFAULT NULL COMMENT '姓名',
  age int(10) DEFAULT NULL COMMENT '年龄',
  remark varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
```

#### 本章开始

本章基于前面2章的基础，前面的知识，不过多赘述

本章中读取properties的方法参考这篇博文：[点击此处][Link1]

jdbc.properties内容

```java
databaseDriver=com.mysql.jdbc.Driver
databaseUrl=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull
user=root
password=admin123
```

pom.xml依赖

```java
<dependencies>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>5.1.25</version>
    </dependency>
</dependencies>
```

StateMent的执行类

```java
package com.tqazy.statementutils;
import com.tqazy.properties.PropertiesUtils;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
/**
 * @author 散场前的温柔
 */
public class StateMentUtil {
    private static Connection connection = null;
    private static Statement statement = null;
    /**
     * 执行SQL并返回改变行数
     * @param sql 执行语句
     * @param path 配置文件的路径+文件名
     * @return
     */
    public static int stateMentUtils(String sql, String path){
        // 获取数据库的链接
        StateMentUtil.getConnection(path);
        // 如果创建连接失败，返回0行
        if(connection == null){
            System.out.println("创建数据库连接失败");
            return 0;
        }
        int num = 0;
        try {
            // 通过connection的createStatement()方法获取statement链接
            statement = connection.createStatement();
            // 通过statement的executeUpdate()方法执行SQL语句
            num =  statement.executeUpdate(sql);
        } catch (SQLException e) {
            // 从连接中获取Statement异常
            e.printStackTrace();
        } finally {
            // 关闭statement和connection连接 
            closeCon();
        }
        return num;
    }
    /**
     * 获取数据库连接
     * @return
     */
    public static void getConnection(String path){
        // 获取数据库连接信息
        List<String> list = new ArrayList<String>();
        list.add("databaseDriver");
        list.add("databaseUrl");
        list.add("user");
        list.add("password");
        // 读取jdbc.properties文件中的信息,这里的PropertiesUtils.readProperties()方法调用请参考上面的链接的博客，或者可以自己写读取properties文件的方法
        Map<String, String> map = PropertiesUtils.readProperties(path, list);
        String databaseDriver = map.get("databaseDriver");
        String databaseUrl = map.get("databaseUrl");
        String user = map.get("user");
        String password = map.get("password");
        // 获取数据库的连接
        try {
            Class.forName(databaseDriver);
            connection = DriverManager.getConnection(databaseUrl, user, password);
        } catch (ClassNotFoundException e) {
            // 数据库驱动没找到异常
            e.printStackTrace();
        } catch (SQLException e){
            // 数据库连接失败异常
            e.printStackTrace();
        }
    }
    /**
     * 关闭连接的实例
     */
    private static void closeCon(){
        try {
            // 如果statement实例不是空，则关闭statement连接
            if(statement != null) {
                statement.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            // 如果connection实例不是空，则关闭connection连接
            try {
                if(connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

测试调用程序

```java
package com.tqazy.statementutils;
import org.junit.Test;
public class TestStateMentUtils {
    @Test
    public void TestStateMent(){
        // 因为user表的id字段是自增的，所以这里不赋值
        String sql = "INSERT INTO user(name, age, remark) values ('樟道',21,'这是一个活泼的男孩')";
        // 数据库配置文件的地址
        String path = "jdbc.properties";
        // 执行数据库的操作语句，并返回改变的行数
        int num = StateMentUtil.stateMentUtils(sql, path);
        System.out.println("改变行数：" + num);
    }
}
```

执行结果：`改变行数：1`

数据库改变：

id
name
age
remark

1
樟道
21
这是一个活泼的男孩

程序中执行的是INSERT(增加)语句，此外StateMent还可以执行DELETE(删除)语句、UPDATE(修改)语句，但是不能执行SELECT(查询)语句
