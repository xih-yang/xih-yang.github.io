# 02、JDBC 教程 - JDBC 接口、类介绍
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/2.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC接口、类介绍

### JDBC 中的主要类（接口）

#### 在JDBC 中常用的类

**1、** DriverManager–类，用来获取Connection；

**2、** Connection–接口；

**3、** Statement–接口；

**4、** ResultSet–接口；

##### DriverManager

**1、** 其实我们今后只需要会用DriverManager的getConnection()方法即可：；

```java
Class.forName("oracle.jdbc.OracleDriver");//注册驱动
String url = "jdbc:oracle:thin:@127.0.0.1:1521:orcl";
String username = "scott";
String password = "tiger";
Connection con = DriverManager.getConnection(url, username, password);
```

注意，上面代码可能出现的两种异常：

`ClassNotFoundException`：这个异常是在第 1 句上出现的，出现这个异常有两个可能：

① 你没有给出 oracle 的 jar 包；

② 你把类名称打错了，查看类名是不是 oracle.jdbc.OracleDriver。

`SQLException`：这个异常出现在第 5 句，出现这个异常就是三个参数的问题，往往 username 和 password 一般不是出错，所以需要认真查看 url 是否打错。
**2、** 对于DriverManager.registerDriver()方法了解即可，因为我们今后注册驱动只会Class.forName()，而不会使用这个方法；

##### Connection

**1、** Connection最为重要的方法就是获取Statement：；

```java
Statement stmt = con.createStatement(); 
```

**2、** 后面在学习ResultSet方法时，还要学习一下下面的方法：；

```java
Statement stmt = con.createStatement(int,int);
```

##### Statement

Statement 最为重要的方法是：

**1、** intexecuteUpdate(Stringsql)：执行更新操作，即执行insert、update、delete语句，其实这个方法也可以执行createtable、altertable，以及droptable等语句，但我们很少会使用JDBC来执行这些语句；

**2、** ResultSetexecuteQuery(Stringsql)：执行查询操作，执行查询操作会返回ResultSet，即结果集；

**3、** booleanexecute()：这个方法可以用来执行增、删、改、查所有SQL语句该方法返回的是boolean类型，表示SQL语句是否执行成功如果使用execute()方法执行的是更新语句，那么还要调用intgetUpdateCount()来获取insert、update、delete语句所影响的行数如果使用execute()方法执行的是查询语句，那么还要调用ResultSetgetResultSet()来获取select语句的查询结果；

##### ResultSet 之获取列数据

**1、** 可以通过next()方法使ResultSet的游标向下移动，当游标移动到你需要的行时，就需要来获取该行的数据了，ResultSet提供了一系列的获取列数据的方法：；

```java
String getString(int columnIndex)	获取指定列的 String 类型数据
int getInt(int columnIndex)			获取指定列的 int 类型数据
double getDouble(int columnIndex)	获取指定列的 double 类型数据
Object getObject(int columnIndex)	获取指定列的 Object 类型的数据
```

**2、** 上面方法中，参数columnIndex表示列的索引，列索引从1开始，而不是0，这第一点与数组不同如果你清楚当前列的数据类型，那么可以使用getInt()之类的方法来获取，如果你不清楚列的类型，那么你应该使用getObject()方法来获取；

**3、** ResultSet还提供了一套通过列名称来获取列数据的方法：；

```java
String getString(String columnName)	获取名称为 columnName 的列的 String 数据；
int getInt(String columnName)		获取名称为 columnName 的列的 int 数据；
double getDouble(String columnName)	获取名称为 columnName 的列的 double 数据；
Object getObject(String columnName)	获取名称为 columnName 的列的 Object 数据；
```

**4、** 结果集的列数；

```java
ResultSet rs = stm.executeQuery(sql);
ResultSetMetaData rsmd = rs.getMetaData();
int count = rsmd.getColumnCount();
```

**5、** 获取行数只能通过滚动resultset；

```java
ResultSet rs = stm.executeQuery(sql);
rs.last();
int row = rs.getRow();
```
