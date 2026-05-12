# 09、JDBC 教程 - JDBC工具类
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/9.html
- 分类：缓存数据库
- 分组：教程目录
## (一)问题引入

我们可以看到前面的Demo中都有非常多的**重复的代码**

我们可以写一个**JDBC工具类**去封装这些**重复的代码**

## (二)抽取JDBC工具类：JDBCUtils

目的：简化书写

分析：

**1、****抽取注册驱动**；

跟连接对象用同样的方法解决，用**配置文件**

**2、****抽取一个方法获取连接对象**；

**需求**：不想传递参数(麻烦)，还得保证工具类的通用性

**解决**：配置文件**jdbc.properties**

```java
jdbc.properties
    url=
    user=
    password=
```

**1、****抽取一个方法释放资源**；

由于释放的资源数量不定，所以使用**重载**

我们写JDBC工具类定义的方法都是**静态方法**，以便于调用

因为**动态方法**属于**示例对象**，必须创建出对象才能调用

而**静态方法**属于**类**，无需创建对象也能调用

## (三)连接对象

我们先来写**连接对象**：

```java
public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, user, password);
    }
```

**url、user、password**我们用静态代码块(**static**)去加载，因为这些信息我们不希望每次调用JDBC工具类都获取一次，没有必要；而使用静态代码块就能恰到好处地只获取一次

```java
url = pro.getProperty("url");
user = pro.getProperty("user");
password = pro.getProperty("password");
driver = pro.getProperty("driver");
```

但是这有一个问题，我们要怎么样才能把**jdbc.properties**配置文件的数据关联到**JDBC工具类**呢？解决方法有很多，这里使用**反射**，如下：

我们先创建一个**Properties工具类**

```java
 //1.创建Properties集合类
Properties pro = new Properties();
```

然后用类加载器把jdbc.properties配置文件加载成一个**对象**

```java
ClassLoader classLoader = JDBCUtils.class.getClassLoader();
URL res = classLoader.getResource("jdbc.properties");
```

再去获取对象的属性值

```java
String path = res.getPath();
```

最后使用`load()`去装载值

```java
pro.load(new FileReader(path));
```

如果不这样获取路径值，只能传入**绝对路径**，这样子对其他使用者来说适配性不好

当然我们可以顺便在static静态代码块里面注册驱动

```java
//4.注册驱动
Class.forName(driver);
```

## (四)资源释放

```java
/**
     * 释放资源(一)
     *
     * @param stmt
     * @param conn
     */
    public static void close(Statement stmt, Connection conn) {
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     * 释放资源(二)
     *
     * @param stmt
     * @param conn
     */
    public static void close(ResultSet rs, Statement stmt, Connection conn) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
```

## (五)最终代码

```java
package util;
import java.io.FileReader;
import java.io.IOException;
import java.net.URL;
import java.sql.*;
import java.util.Properties;
/**
 * JDBC工具类 方法写为静态，方便调用
 * 动态方法属于示例对象，必须创建出对象才能调用
 * 而静态方法属于类，无需创建对象也能调用
 */
public class JDBCUtils {
    private static String url;
    private static String user;
    private static String password;
    private static String driver;
    /**
     * 文件的读取，只需要读取一次即可拿到这些值，使用静态代码块
     */
    static {
        //读取资源文件，获取值
        try {
            //1.创建Properties集合类
            Properties pro = new Properties();
            //2.加载文件
            //2.1使用反射
            ClassLoader classLoader = JDBCUtils.class.getClassLoader();
            URL res = classLoader.getResource("jdbc.properties");
            String path = res.getPath();
            pro.load(new FileReader(path));
            //3.获取数据，赋值
            url = pro.getProperty("url");
            user = pro.getProperty("user");
            password = pro.getProperty("password");
            driver = pro.getProperty("driver");
            //4.注册驱动
            Class.forName(driver);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
    /**
     * 获取连接
     *
     * @return 连接对象
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, user, password);
    }
    /**
     * 释放资源(一)
     *
     * @param stmt
     * @param conn
     */
    public static void close(Statement stmt, Connection conn) {
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     * 释放资源(二)
     *
     * @param stmt
     * @param conn
     */
    public static void close(ResultSet rs, Statement stmt, Connection conn) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

## (六)应用于上一篇博客的demo

用这个类去优化上一篇博客的Demo试试

```java
package com.zzq;
import domain.Emp;
import util.JDBCUtils;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
/**
 * 演示JDBC工具类
 */
public class JDBCDemo09 {
    public static void main(String[] args) {
        List<Emp> list = new JDBCDemo09().findAll();
        System.out.println(list);
        System.out.println(list.size());
    }
    /**
     * 查询所有emp对象
     *
     * @return
     */
    public List<Emp> findAll() {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        List<Emp> list = null;
        try {
            //1.注册驱动&获取连接
            conn = JDBCUtils.getConnection();
            //2.定义sql
            String sql = "select * from emp";
            //3.获取执行sql的对象
            stmt = conn.createStatement();
            //4.执行sql
            rs = stmt.executeQuery(sql);
            //5.遍历结果集
            Emp emp = null;
            list = new ArrayList<Emp>();
            while (rs.next()) {
                //6.获取数据
                int id = rs.getInt("id");
                String ename = rs.getString("ename");
                int job_id = rs.getInt("job_id");
                int mgr = rs.getInt("mgr");
                Date joindate = rs.getDate("joindate");
                double salary = rs.getDouble("salary");
                double bonus = rs.getDouble("bonus");
                int dept_id = rs.getInt("dept_id");
                // 7.创建emp对象，并赋值
                emp = new Emp();
                emp.setId(id);
                emp.setEname(ename);
                emp.setJob_id(job_id);
                emp.setMgr(mgr);
                emp.setJoindate(joindate);
                emp.setSalary(salary);
                emp.setBonus(bonus);
                emp.setDept_id(dept_id);
                //8.装载集合
                list.add(emp);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            JDBCUtils.close(rs, stmt, conn);
        }
        return list;
    }
}
```

运行效果跟之前一样
