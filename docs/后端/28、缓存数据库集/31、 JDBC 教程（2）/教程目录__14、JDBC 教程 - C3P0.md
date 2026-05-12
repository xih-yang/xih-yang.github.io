# 14、JDBC 教程 - C3P0
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/14.html
- 分类：缓存数据库
- 分组：教程目录
## 步骤

**1、** 导入jar包；

导入**c3p0-0.9.5.2.jar**和**mchange-commons-java-0.2.12.jar**两个包

**2、** 定义配置文件；

**名称**：c3p0.properties或者c3p0-config.xml

**路径**：直接将文件放在**src目录**下即可

```java
<c3p0-config>
  <!-- 使用默认的配置读取连接池对象 -->
  <default-config>
  	<!--  连接参数 -->
    <property name="driverClass">com.mysql.cj.jdbc.Driver</property>
    <property name="jdbcUrl">jdbc:mysql://localhost:3306/test04</property>
    <property name="user">root</property>
    <property name="password">root</property>
    <!-- 连接池参数 -->
    <!--初始化申请的连接数-->
    <property name="initialPoolSize">5</property>
    <!--最大的连接数-->
    <property name="maxPoolSize">10</property>
    <!--超时时间-->
    <property name="checkoutTimeout">3000</property>
  </default-config>
  <named-config name="otherc3p0"> 
    <!--  连接参数 -->
    <property name="driverClass">com.mysql.cj.jdbc.Driver</property>
    <property name="jdbcUrl">jdbc:mysql://localhost:3306/test04</property>
    <property name="user">root</property>
    <property name="password">root</property>
    <!-- 连接池参数 -->
    <property name="initialPoolSize">5</property>
    <property name="maxPoolSize">8</property>
    <property name="checkoutTimeout">1000</property>
  </named-config>
</c3p0-config>
```

我们目前暂时不需要使用到``后面的代码，而之前的代码意义可以看注释

**3、** 创建核心对象数据库连接池对象**ComboPooledDataSource**；

```java
//1.创建数据库连接池对象
DataSource ds = new ComboPooledDataSource();
```

**1、** 获取连接：`getConnection`；

```java
//2.获取连接对象
Connection conn = ds.getConnection();
```

**1、** 打印**conn**对象；

```java
//3.打印
System.out.println(conn);
```

整体代码：

```java
package com.zzq.c3p0;
import com.mchange.v2.c3p0.ComboPooledDataSource;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
/**
 * c3p0的演示
 */
public class C3P0Demo01 {
    public static void main(String[] args) {
        //1.创建数据库连接池对象
        DataSource ds = new ComboPooledDataSource();
        try {
            //2.获取连接对象
            Connection conn = ds.getConnection();
            //3.打印
            System.out.println(conn);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

运行效果：

**注意**：红色部分的不是报错而是**日志信息**，红色框框的才是conn

## C3P0进阶

我们来验证一下**数据库连接池**的最大连接数量

我们先获取**10个**试试

```java
for (int i = 1; i <= 10; i++) {
    try {
        Connection conn = ds.getConnection();
        System.out.println(i + ":" + conn);
    } catch (SQLException e) {
        e.printStackTrace();
    }
}
```

可以看到我们获取了10个**哈希值**不一样的conn对象

那么如果我们获取11个呢？

它会成功获取10个后等待3秒然后报错

如果我依然获取10个，但是我们获取到第5个之后把它归还

```java
for (int i = 1; i <= 11; i++) {
    try {
    Connection conn = ds.getConnection();
    System.out.println(i + ":" + conn);
    if (i == 5) {
    conn.close(); //归还连接到连接池
    }
    } catch (SQLException e) {
    e.printStackTrace();
    }
}
```

可以看到，是不会报错的

我们来看看**xml文件**，可以看到除了刚才使用到的代码之外，还有剩下的一部分没有讲过：

其实第一个是**默认**xml配置文件，如果不指定使用哪个的话，就会默认使用第一个，如下：

如果我们**指定使用**哪一个，就会使用哪一个，如下：

```java
 DataSource ds = new ComboPooledDataSource("otherc3p0");
```
