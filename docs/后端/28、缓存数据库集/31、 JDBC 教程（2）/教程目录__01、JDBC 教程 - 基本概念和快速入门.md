# 01、JDBC 教程 - 基本概念和快速入门
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/1.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC的概念

**概念**：Java DataBase Connectivity

中文意思为Java数据库连接 即使用 **Java语言操作数据库**

**作用**：可以使用统一的一套Java代码可以操作所有的关系型数据库

JDBC定义了操作所有关系型数据库的规则（接口），而不同数据库的实现类由不同的数据库厂家自己提供。

不同的实现类叫做**数据库驱动**

**本质**：其实是官方（sun公司）定义的一套操作所有关系型数据库的规则，即接口。各个数据库厂商去实现这套接口，提供数据库驱动jar包，我们可以使用这套接口（JDBC）编程，真正执行的代码是驱动jar包中的实现类

## JDBC快速入门

**步骤**：

(一)导入驱动jar包，下载jar包详情点击：如何下载mysql驱动jar包

a：新建一个管理jar包的文件夹**libs**，并且右键 --> **Add As Library**

b：复制**mysql-connector-java-8.0.17.jar**到项目的**libs**目录下

(二)注册驱动

```java
Class.forName("com.mysql.cj.jdbc.Driver");
```

(三)获取数据库连接对象 Connection

```java
Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/数据库名称", "用户", "密码");
```

(四)定义sql

```java
String sql = "update account set balance = 500 where id = 1";
```

(五)获取执行sql语句的对象 Statement

```java
Statement stmt = conn.createStatement();
```

(六)执行sql，接收返回结果

```java
long count = stmt.executeLargeUpdate(sql);
```

(七)处理结果

```java
 System.out.println(count);
```

(八)释放资源

```java
stmt.close();
conn.close();
```

执行前：

执行后：

最后贴上完整代码：

```java
package com.zzq;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
/**
 * JDBC快速入门
 * libs文件夹里存放jar包，方便管理。
 */
public class JDBCDemo01 {
    public static void main(String[] args) throws Exception {
        //1.导入驱动jar包
        //2.注册驱动
        Class.forName("com.mysql.cj.jdbc.Driver");
        //3.获取数据库连接对象
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test03", "root", "root");
        //4.定义sql语句
        String sql = "update account set balance = 500 where id = 1";
        //5.获取执行sql的对象 Statement
        Statement stmt = conn.createStatement();
        //6.执行sql
        long count = stmt.executeLargeUpdate(sql);
        //7.处理结果
        System.out.println(count);
        //8.释放资源
        stmt.close();
        conn.close();
    }
}
```

## 可能会遇到的报错

The server time zone value ‘ÖÐ¹ú±ê×¼Ê±¼ä’ is unrecognized or represents more than one time zone

**解决方法(一)**：

登录mysql输入`SET GLOBAL time_zone = '+8:00';`即可

**解决方法(二)**：

在自己编写的java代码连接mysql语句的url后面添加`?useSSL=true&serverTimezone=UTC`

（注意如果是在mybatis的xml标签中要用`&`代替`&`）

即可解决该代码报错问题，如下图：
