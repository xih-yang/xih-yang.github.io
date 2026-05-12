# 05、JDBC 教程 - 以面向对象的思想编写JDBC程序
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/5.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 以面向对象的思想编写JDBC程序

其实本章也没什么技术性的知识点，只是使用面向对象的方式去举例添加一条数据

前面的几章都是我们写好的SQL语句直接执行的，但是现实中我们不可能指望用户去编写SQL，我们可能需要从控制台或者前端获取一个对象，一个实体类对象，我们需要程序能直接添加实体类，而不是我们去手写SQL

所以我们需要写一个灵活的SQL，可以根据传输进来的对象实例进行自匹配，生成完整的可执行的SQL语句，再调用执行方法就可以了

### 一、数据库的准备

执行以下SQL，生成数据库和数据表并注入数据

```java
/*
MySQL - 5.6.12 : Database - test
*/
/*创建test数据库*/
CREATE DATABASE test;
/*使用test数据库*/
USE test;
/*创建user表*/
CREATE TABLE user (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  name varchar(10) COLLATE utf8_bin NOT NULL COMMENT '姓名',
  password varchar(150) COLLATE utf8_bin DEFAULT NULL COMMENT '密码',
  age int(10) NOT NULL COMMENT '年龄',
  remark varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*添加数据到user表*/
insert  into user(id,name,password,age,remark) values (1,'樟道','admin',21,'这是一个活泼的男孩'),(2,'浅夏','admin',19,'这是一个乐观的女孩');
```

数据表的结构如下：

数据表的内容如下：

### 二、JAVA项目

#### 项目结构

- pom.xml：本项目采用maven管理依赖
- database.properties：存放数据库连接信息
- PropertiesUtils：读取properties文件的工具类
- User：用户实体类
- JDBCUtils：JDBC的工具类
- JdbcObjectService：业务层接口
- JdbcObjectServiceImpl：业务层接口实现类
- TestJdbcObjectDemo：测试类，测试工具类的功能效果

#### 1. pom.xml

首先注入第三方依赖

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.tqazy</groupId>
    <artifactId>jdbc-demo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <description>使用JDBC操作数据库</description>
    <properties>
        <java.version>1.8</java.version>
        <build.sourceEncoding>UTF-8</build.sourceEncoding>
        <mysql.version>5.1.26</mysql.version>
        <spring.version>5.2.0.RELEASE</spring.version>
    </properties>
    <dependencies>
        <!-- Spring start -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-beans</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jdbc</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <!-- Spring end -->
        <!-- database start -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        <!-- database end -->
        <!-- 测试 start -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>
        <!-- 测试 end -->
    </dependencies>
</project>
```

#### 2. database.properties(数据库连接信息文件)

一般连接数据库需要以下四个信息：驱动、url、用户名、密码

其中url在test后的一串`?useUnicode=true&characterEncoding=UTF-8`是设置编码格式为UTF-8

```java
driver=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8
username=root
password=admin123
```

#### 3. PropertiesUtils(读取配置文件的工具类)

只需要调用readProperties()静态方法并传入相关参数，即可得到文件内容

参数1：文件的全路径名

参数2：需要读取的key值list集合

返回的结果：由key值和对应读取到的value值组成的map集合

```java
package com.tqazy.utils;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
/**
 * @author 散场前的温柔
 */
public class PropertiesUtils {
    /**
     * 传入properties文件地址和要读取的key值list集合，返回由key值和读取数据组成的map集合
     *
     * @param path
     * @param list
     * @return Map<key, value>
     */
    public static Map<String, String> readProperties(String path, List<String> list) {
        if (list == null || list.isEmpty() || path == null || path.isEmpty()) {
            return new HashMap<String, String>(0);
        }
        Map<String, String> map = new HashMap<String, String>(10);
        PropertiesUtils propertiesUtils = new PropertiesUtils();
        Properties properties = propertiesUtils.readProperties(path);
        if (properties == null) {
            return new HashMap<String, String>(0);
        }
        for (String str : list) {
            map.put(str, properties.getProperty(str));
        }
        return map;
    }
    /**
     * 根据地址读取Properties文件并生成实例
     *
     * @param path 文件地址
     * @return Properties
     * @throws IOException
     */
    private Properties readProperties(String path) {
        Properties properties = null;
        try {
            InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path);
            InputStreamReader reader = new InputStreamReader(inputStream);
            // 此处需要使用JDK1.6以上的版本
            properties = new Properties();
            properties.load(reader);
        } catch (NullPointerException e) {
            // 读取文件异常
            e.printStackTrace();
            System.err.println("读取Properties文件异常，请检查文件路径和文件名:" + path);
        } catch (IOException e) {
            // 字符流写入异常
            e.printStackTrace();
            System.err.println("字符流写入Properties实例异常");
        }
        return properties;
    }
}
```

#### 4. User(用户)实体类

实体类保持和数据库表是对应的

```java
package com.tqazy.entity;
/**
 * @author 散场前的温柔
 */
public class User {
    private Integer id;
    private String name;
    private String password;
    private Integer age;
    private String remark;
    public User() {}
    public User(String name, String password, Integer age, String remark) {
        this.name = name;
        this.password = password;
        this.age = age;
        this.remark = remark;
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public String getRemark() {
        return remark;
    }
    public void setRemark(String remark) {
        this.remark = remark;
    }
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", password='" + password + '\'' +
                ", age=" + age +
                ", remark='" + remark + '\'' +
                '}';
    }
}
```

#### 5. JDBCUtils(JDBC工具类)

在执行update()方法和select()方法时自动获取数据库连接，但是update()方法可以最后自动关闭连接，查询无法关闭且需要外部解析结果。

这里的耦合度做的还不是很好，可以改进。

```java
package com.tqazy.jdbc;
import com.tqazy.utils.PropertiesUtils;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
/**
 * @author 散场前的温柔
 */
public class JDBCUtils {
    private static Connection con;
    private static Statement sm;
    private static ResultSet rs;
    private static Map<String, String>  map;
    /**
     * 获取数据库连接信息
     */
    private static void getProperties(String path){
        List<String> list = new ArrayList<String>();
        list.add("driver");
        list.add("url");
        list.add("username");
        list.add("password");
        map = PropertiesUtils.readProperties(path, list);
    }
    /**
     * 获取数据库连接
     */
    public static void getConnection(String path){
        try {
            if(map == null){
                getProperties(path);
            }
            Class.forName(map.get("driver"));
            con = DriverManager.getConnection(map.get("url"), map.get("username"), map.get("password"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    /**
     * 执行新增/修改/删除操作的方法
     * @param sql
     * @param path
     * @return
     */
    public static int update(String sql, String path){
        int num = 0;
        getConnection(path);
        // 如果创建连接失败，返回0行
        if(con == null){
            System.out.println("创建数据库连接失败");
            return 0;
        }
        try {
            // 通过connection的createStatement()方法获取statement链接
            sm = con.createStatement();
            // 通过statement的executeUpdate()方法执行SQL语句
            num =  sm.executeUpdate(sql);
        } catch (SQLException e) {
            // 从连接中获取Statement异常
            e.printStackTrace();
        } finally {
            // 关闭statement和connection连接
            close();
        }
        return num;
    }
    /**
     * 执行查询操作的方法
     * @param sql
     * @param path
     * @return
     */
    public static ResultSet select(String sql, String path){
        getConnection(path);
        // 如果创建连接失败，返回0行
        if(con == null){
            System.out.println("创建数据库连接失败");
            return null;
        }
        try {
            // 通过connection的createStatement()方法获取statement链接
            sm = con.createStatement();
            // 通过statement的executeQuery(sql)方法获取resultSet的实例
            rs = sm.executeQuery(sql);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return rs;
    }
    /**
     * 关闭数据库相关连接
     */
    public static void close(){
        if(rs != null){
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if(sm != null){
            try {
                sm.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if(con != null){
            try {
                con.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

#### 6. JdbcObjectService(接口)

本章，读写数据的方式和代码不变，主要是在服务层体现出面向对象的思想

本章只以新增方法为例，查询、修改、删除方法均适用。

但是本文的操作数据库方式仍旧不是常用方式，同样过于繁琐难用，本章目的主要是用来体会一下面向对象的概念是什么样的实现

```java
package com.tqazy.service;
import com.tqazy.entity.User;
/**
 * @author 散场前的温柔
 */
public interface JdbcObjectService {
    /**
     * 添加用户
     * @param user
     * @return
     */
    boolean addUser(User user);
}
```

#### 7. JdbcObjectServiceImpl(接口实现类)

下面来实现刚才那个接口

我们可以看到，针对于传输进来的对象，sql进行了组装，最后

形成完整的sql，再调用相应的操作方法完成操作数据库的目的。

此时我们就初步的实现了传入对象操作数据库的目的，虽然仍旧缺陷很多

```java
package com.tqazy.service.impl;
import com.tqazy.entity.User;
import com.tqazy.jdbc.JDBCUtils;
import com.tqazy.service.JdbcObjectService;
import org.springframework.stereotype.Service;
/**
 * @author 散场前的温柔
 */
@Service
public class JdbcObjectServiceImpl implements JdbcObjectService {
    public boolean addUser(User user) {
        if (user == null) {
            return false;
        }
        String sql = "INSERT INTO user (name, password, age, remark) VALUES ('" + user.getName() + "', '" + user.getPassword() + "', " + user.getAge() + ", '" + user.getRemark() + "')";
        int num = JDBCUtils.update(sql, "database.properties");
        if(num > 0){
            return true;
        }
        return false;
    }
}
```

#### 8. TestJdbcObjectDemo(测试类)

测试类，需要提供一个用户的实体类，我们就假设这个实体类的数据是从前端传回来的或者控制台输入的，那么我们就完成了向数据库"添加对象实例"的操作效果。

```java
package com.tqazy.test;
import com.tqazy.entity.User;
import com.tqazy.service.JdbcObjectService;
import com.tqazy.service.impl.JdbcObjectServiceImpl;
import org.junit.Test;
public class TestJdbcObjectDemo {
    @Test
    public void addUser(){
        User user = new User("苏熙", "admin123", 19, "这是一个可爱的美少女");
        JdbcObjectService jdbcObjectService = new JdbcObjectServiceImpl();
        boolean flag = jdbcObjectService.addUser(user);
        System.out.println("添加结果：" + flag);
    }
}
```

结果就是成功的插入一条数据，控制台输出：添加结果：true

**此时我们只需要关注的输入的对象数据即可，不用再去关注SQL的组成，达到面向对象的目的。**
