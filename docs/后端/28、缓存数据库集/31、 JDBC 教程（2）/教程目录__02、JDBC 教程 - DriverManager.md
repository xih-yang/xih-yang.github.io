# 02、JDBC 教程 - DriverManager
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/2.html
- 分类：缓存数据库
- 分组：教程目录
## 概念

驱动管理对象

## 功能

**1、****注册驱动**；

`static void registerDriver(Driver driver)`：注册于给定的驱动程序 **DriverManger**

写代码使用：`Class.forName("com.mysql.cj.jdbc.Driver");`

这行代码的意思是加载**Driver**类进内存，但是我们后期并没有对**Driver**类进行任何的操作，其实是为了加载**Driver**类时执行它的**静态代码块**

通过**查看源码**发现：在**com.mysql.jdbc.Driver**类中存在**静态代码块**

```java
static {
    try{
     java.sql.DriverManager.registerDriver(new Driver());
    }  catch (SQLException E) {
     throw new RuntimeException("can't register driver!")
    }
}
```

其实**MySQL5**之后可以不注册驱动，如下：

```java
//Class.forName("com.mysql.cj.jdbc.Driver");
```

**原理**如下：

里面有如下代码：

`com.mysql.cj.jdbc.Driver`

即如果没有检测到使用者注册驱动，则自动注册Driver驱动

但是为了省下跟别人解释为什么可以不写这行代码的时间，还是建议写上

**2、****获取数据库连接**；

`static Connection getConnection(String url,String user,String password)`

**参数**：

- **url**：指定连接的路径

语法：`jdbc:mysql://ip地址(域名):端口号/数据库名称`

例子：

```java
Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test03", "root", "123456");
```

细节：如果连接的是**本机**的MySQL服务器，并且MySQL服务**默认端口是3306**，则**url**可以简写为：`jdbc:mysql:///数据库名称`

**user**：用户名

**password**：密码
