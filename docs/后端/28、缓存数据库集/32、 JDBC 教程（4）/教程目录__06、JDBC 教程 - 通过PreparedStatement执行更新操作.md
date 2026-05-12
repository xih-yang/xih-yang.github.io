# 06、JDBC 教程 - 通过PreparedStatement执行更新操作
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/6.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 通过PreparedStatement执行更新操作

#### 为什么要使用PreparedStatement？

使用Statement需要拼写SQL语句，很辛苦，而且容易出错

##### Statement：

上一章里使用Statement方式的SQL：

```java
String sql = "INSERT INTO user (name, password, age, remark) VALUES ('" + user.getName() + "', '" + user.getPassword() + "', " + user.getAge() + ", '" + user.getRemark() + "')";
```

拼接过于辛苦，且容易出错

##### PreparedStatement：

**1、** 是Statement的子接口，可以使用Statement的所有方法，Statement的SQL拼接过于辛苦，且容易出错；

**2、** 可以传入带占位符的SQL语句，并且提供了补充占位符变量的方法；

**3、** 可以有效禁止SQL注入攻击，Statement就存在不检测SQL的问题，会出现SQL注入，使用PreparedStatement无法被SQL注入；

**4、** 可以最大可能的提高性能；

**5、** 代码的可读性和可维护性；

##### 使用PreparedStatement需要3步：

**1、** 通过connection的prepareStatement(sql)方法获取PreparedStatement实例；

**2、** 调用PreparedStatement的setXxx(intindex,Objectval)设置占位符的值，index从1开始；

**3、** 执行SQL语句：executeQuery()和executeUpdate()方法，注意：执行时不需要再传入SQL语句；

**本章是基于上一章代码进行修改**

修改文件如下，其他的文件和代码保持和上一章一致，项目结构也与上一章一致。

- JDBCUtils：JDBC的工具类
- JdbcObjectServiceImpl：接口实现类

#### 1. JDBCUtils(JDBC的工具类)

主要改动的部分：

**1、** 使用PreparedStatement的全局变量替换Statement的全局变量；

**2、** update()方法；

**3、** close()方法；

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
    private static PreparedStatement ps;
    private static ResultSet rs;
    private static Map<String, String> map;
    /**
     * 获取数据库连接信息
     */
    private static void getProperties(String path) {
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
    public static void getConnection(String path) {
        try {
            if (map == null) {
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
     * 更新数据库方法
     * @param path 数据库连接信息的配置文件全路径
     * @param sql 占位符的SQL
     * @param args 可变参数
     * @return
     */
    public static int update(String path, String sql, Object... args) {
        int num = 0;
        getConnection(path);
        // 如果创建连接失败，返回0行
        if (con == null) {
            System.out.println("创建数据库连接失败");
            return 0;
        }
        try {
            // 1. 通过connection的prepareStatement(sql)方法获取PreparedStatement实例
            ps = con.prepareStatement(sql);
            // 2. 调用PreparedStatement的setXxx(int index, Object val)设置占位符的值，index从1开始
            for (int i = 0; i < args.length; i++) {
                ps.setObject(i + 1, args[i]);
            }
            // 3. 执行SQL语句:executeQuery()和executeUpdate()方法，注意：执行时不需要再传入SQL语句
            num = ps.executeUpdate();
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
     * 关闭数据库相关连接，释放数据库资源
     */
    public static void close() {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (ps != null) {
            try {
                ps.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (con != null) {
            try {
                con.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

#### 2. JdbcObjectServiceImpl(JDBC的工具类)

这里的参数就是使用的占位符[?]，占据需要填入变量的位置

可变参数的位置，需要解析成单个的占位符需要的单元，而不能直接传对象过去

这里不光是可以执行INSERT语句，还可以使用UPDATE语句、SELECT语句

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
        String sql = "INSERT INTO user (name, password, age, remark) VALUES (?, ?, ?, ?)";
        int num = JDBCUtils.update("database.properties", sql, user.getName(), user.getPassword(), user.getAge(), user.getRemark());
        if(num > 0){
            return true;
        }
        return false;
    }
}
```

#### 结果

成功添加一条数据
