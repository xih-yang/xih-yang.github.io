# 10、JDBC 教程 - 登录案例
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/10.html
- 分类：缓存数据库
- 分组：教程目录
我们继续使用上一节课封装好的**JDBC工具类**去做一个案例

## 登录案例

**需求**：

**1、** 通过键盘录入用户名和密码；

**2、** 判断用户是否登录成功；

`select * from user where username = "xxx" and password = "xxx";`

如果这个sql有查询结果，则**成功**，反之则**失败**

**步骤**：

**1、** 我们先创建一个**DB**，如下：；

```java
CREATE TABLE USER(
	id INT PRIMARY KEY AUTO_INCREMENT,
	username VARCHAR(32),
	PASSWORD VARCHAR(32)
);
INSERT INTO USER VALUES(NULL,"zzq01","123");
INSERT INTO USER VALUES(NULL,"zzq02","234");
SELECT * FROM USER;
```

效果如下：

**2、** 写一个**登录方法**，并且先做一个**最基本的判断**；

```java
/**
 * 登录方法
 */
public boolean login(String username, String password) {
    if (username == null && password == null) {
        return false;
    }
  }
```

**3、** 使用我们之前封装的**JDBC**工具类去**获取连接**；

```java
//1.获取连接
conn = JDBCUtils.getConnection();
```

**4、** 定义查询**sql**语句；

```java
//2.定义sql
String sql = "select * from user 
where username = '" + username + "' and password = '" + password + "'";
```

**5、** 判断**逻辑**；

```java
//3.获取执行sql的对象
stmt = conn.createStatement();
//4.执行查询
rs = stmt.executeQuery(sql);
```

如果有下一行即`rs.next()`就返回**true**，反之则返回**false**

所以我们直接

```java
return rs.next();
```

**6、** 使用我们封装的**JDBC**工具类去**释放资源**；

```java
finally {
    JDBCUtils.close(rs, stmt, conn);
}
```

**7、** 最后写一个main；

```java
public static void main(String[] args) {
    //1.键盘录入，接收用户名和密码
    Scanner sc = new Scanner(System.in);
    System.out.println("请输入用户名：");
    String username = sc.nextLine();
    System.out.println("请输入密码：");
    String password = sc.nextLine();
    //2.调用方法
    boolean flag = new JDBCDemo10().login(username, password);
    //3.判断结果，输出不同语句
    if (flag) {
        System.out.println("登录成功");
    } else {
        System.out.println("账号或密码错误");
    }
}
```

整体代码如下：

```java
package com.zzq;
import util.JDBCUtils;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;
/**
 * 登录案例
 */
public class JDBCDemo10 {
    public static void main(String[] args) {
        //1.键盘录入，接收用户名和密码
        Scanner sc = new Scanner(System.in);
        System.out.println("请输入用户名：");
        String username = sc.nextLine();
        System.out.println("请输入密码：");
        String password = sc.nextLine();
        //2.调用方法
        boolean flag = new JDBCDemo10().login(username, password);
        //3.判断结果，输出不同语句
        if (flag) {
            System.out.println("登录成功");
        } else {
            System.out.println("账号或密码错误");
        }
    }
    /**
     * 登录方法
     */
    public boolean login(String username, String password) {
        if (username == null && password == null) {
            return false;
        }
        //连接数据库判断是否登录成功
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        try {
            //1.获取连接
            conn = JDBCUtils.getConnection();
            //2.定义sql
            String sql = "select * from user where username = '" + username + "' and password = '" + password + "'";
            //3.获取执行sql的对象
            stmt = conn.createStatement();
            //4.执行查询
            rs = stmt.executeQuery(sql);
            //5.判断
//            if (rs.next()) {  // 如果有下一行就证明有查询结果
//                return true;
//            } else {
//                return false;
//            }
            return rs.next();
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            JDBCUtils.close(rs, stmt, conn);
        }
        return false; //如果发生了异常就返回false
    }
}
```

运行效果：
