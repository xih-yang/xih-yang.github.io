# 15、JDBC 教程 - Druid
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/15.html
- 分类：缓存数据库
- 分组：教程目录
## 步骤

**1、** 导入**druid-1.0.9.jar**包；

**2、** 定义**配置文件**

是**properties**形式的

可以叫任意名称，可以放在任意目录下

```java
driverClassName=com.mysql.cj.jdbc.Driver
url=jdbc:mysql://127.0.0.1:3306/test04
username=root
password=root
# 初始化链接数
initialSize=5
# 最大连接数
maxActive=10
# 超时时间
maxWait=3000
```

**1、** 加载配置文件**properties**；

```java
//3.加载配置文件
Properties pro = new Properties();
InputStream is = DruidDemo01.class.getClassLoader().getResourceAsStream("druid.properties");
pro.load(is);
```

**1、** 获取数据库连接池对象：通过工厂类来获取**DruidDataSourceFactory**；

```java
//4.获取连接池对象
DataSource ds = DruidDataSourceFactory.createDataSource(pro);
```

**1、** 获取连接：`getConnection`；

```java
//5.获取连接
Connection conn = ds.getConnection();
System.out.println(conn);
```

整体代码：

```java
package com.zzq.Druid;
import com.alibaba.druid.pool.DruidDataSourceFactory;
import javax.sql.DataSource;
import java.io.InputStream;
import java.sql.Connection;
import java.util.Properties;
/**
 * Druid演示
 */
public class DruidDemo01 {
    public static void main(String[] args) throws Exception {
        //1.导入jar包
        //2.定义配置文件
        //3.加载配置文件
        Properties pro = new Properties();
        InputStream is = DruidDemo01.class.getClassLoader().getResourceAsStream("druid.properties");
        pro.load(is);
        //4.获取连接池对象
        DataSource ds = DruidDataSourceFactory.createDataSource(pro);
        //5.获取连接
        Connection conn = ds.getConnection();
        System.out.println(conn);
    }
}
```

运行效果：

## Druid工具类

**1、** 定义一个类**JDBCUtils**；

**2、** 提供静态代码块加载配置文件，初始化连接池对象；

**3、** 提供**方法**：；

获取连接方法：通过数据库连接池获取连接

释放资源

获取连接池方法

代码如下：

```java
package com.zzq.Druid.util;
import com.alibaba.druid.pool.DruidDataSourceFactory;
import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;
/**
 * Druid连接池的工具类
 */
public class JDBCUtils {
    //1.定义成员变量 DataSource
    private static DataSource ds;
    static {
        try {
            //2.加载配置文件
            Properties pro = new Properties();
            pro.load(JDBCUtils.class.getClassLoader().getResourceAsStream("druid.properties"));
            //3.获取DataSource
            ds = DruidDataSourceFactory.createDataSource(pro);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    /**
     * 获取连接
     */
    public static Connection getConnection() throws SQLException {
        return ds.getConnection();
    }
    /**
     * 释放资源(归还资源)
     */
    public static void close(Statement stmt, Connection conn) {
        close(null, stmt, conn);
    }
    public static void close(ResultSet rs, Statement stmt, Connection conn) {
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
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     * 获取连接池方法
     */
    public static DataSource getDataSource() {
        return ds;
    }
}
```

## 工具类测试

```java
package com.zzq.Druid;
import com.zzq.Druid.util.JDBCUtils;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
/**
 * 使用新的工具类
 */
public class DruidDemo02 {
    public static void main(String[] args) {
        /**
         * 完成添加操作，给account表添加一条记录
         */
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            //1.获取连接
            conn = JDBCUtils.getConnection();
            //2.定义sql
            String sql = "insert into account values(null,?,?)";
            //3.获取pstmt对象
            pstmt = conn.prepareStatement(sql);
            //4.给?赋值
            pstmt.setString(1, "王五");
            pstmt.setDouble(2, 3000);
            //5.执行sql
            int count = pstmt.executeUpdate();
            //6.打印count
            System.out.println(count);
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            //7.释放资源
            JDBCUtils.close(pstmt, conn);
        }
    }
}
```

执行效果：
