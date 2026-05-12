# 04、JDBC 教程 - 通过ResultSet执行查询操作
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/4.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 通过ResultSet执行查询操作

#### ResultSet

**1、** 结果集，封装了使用JDBC查询的结果；

**2、** 通过调用Statement对象的executeQuery(sql)方法创建该对象；

**3、** ResultSet对象以逻辑表的形式封装了执行数据库操作的结果集，ResultSet接口的实现有数据库厂商提供；

**4、** ResultSet对象维护了一个指向当前数据行的游标，初始的时候，游标在第一行之前，可以通过ResultSet对象的next()方法移动到下一行，如果下一行有效则返回true，否则返回false，相当于Iterator的hasNext()和next()方法的结合体；

**5、** 当指针（游标）指向一行时，可以通过用getXXX(index)或getXXX(columnName)获取每一列的值，index从1开始，如getInt(1)，getString(“name”)；

**6、** ResultSet也需要关闭，依然遵循先开后关、后开先关原则；

我们的前提条件依然使用上一章的条件

很多地方都与上一章相同，包括获取连接数据库的connection方法。不同的开始是在执行statement的executeQuery()方法开始，和关闭连接的方法多了一个resultset

```java
/**
 * @author 散场前的温柔
 */
public class ResultSetUtil {
    private static Connection connection = null;
    private static Statement statement = null;
    private static ResultSet resultSet = null;
    public static ResultSet resultSetUtils(String sql, String path) {
        ResultSetUtil.getConnection(path);
        // 如果创建连接失败，返回0行
        if (connection == null) {
            System.out.println("创建数据库连接失败");
        }
        try {
            // 通过connection的createStatement()方法获取statement链接 
            statement = connection.createStatement();
            // 通过statement的executeQuery(sql)方法获取resultSet的实例
            resultSet = statement.executeQuery(sql);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return resultSet;
    }
    /**
     * 关闭resultSet、statement、connection连接
     */
    public static void closeCon() {
        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (statement != null) {
            try {
                statement.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     * 获取数据库连接
     *
     * @return
     */
    public static void getConnection(String path) {
        // 获取数据库连接信息
        List<String> list = new ArrayList<String>();
        list.add("databaseDriver");
        list.add("databaseUrl");
        list.add("user");
        list.add("password");
        // 读取jdbc.properties文件中的信息
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
        } catch (SQLException e) {
            // 连接失败异常
            e.printStackTrace();
        }
    }
}
```

测试调用方法，ResultSet方法如果是解耦合的话需要在调用类里进行取值，取值完毕后，最后关闭连接

```java
package com.tqazy.resultsetutils;
import org.junit.Test;
import java.sql.ResultSet;
import java.sql.SQLException;
public class TestResultSet {
    @Test
    public void testResultSet() {
        String sql = "SELECT * FROM user";
        String path = "jdbc.properties";
        ResultSet resultSet = ResultSetUtil.resultSetUtils(sql, path);
        try {
            while (resultSet.next()) {
                String id = resultSet.getString("id");
                String name = resultSet.getString("name");
                String age = resultSet.getString("age");
                String remark = resultSet.getString("remark");
                System.out.println("id:" + id);
                System.out.println("name:" + name);
                System.out.println("age:" + age);
                System.out.println("remark:" + remark + "\n");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            ResultSetUtil.closeCon();
        }
    }
}
```

运行结果：

id
name
age
remark

1
樟道
21
这是一个活泼的男孩

2
浅夏
19
这是一个乐观的女孩
