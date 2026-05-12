# 04、JDBC 教程 - Statement
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/4.html
- 分类：缓存数据库
- 分组：教程目录
## 概念

执行sql对象

## 功能

**1、** 执行sql；

**方法**：

`boolean execute(String sql)`：可以执行任意的sql (了解)

`int executeUpdate(String sql)`：执行**DML**(insert、update、delete)语句、**DDL**(create、alter、drop)语句

**注意**：此处的**int返回值的数值**是指MySQL数据库表单**被影响的行数**，我们可以通过这个影响的行数判断DML语句是否执行成功，如果返回值＞0则执行成功，反之则失败

`ResultSet executeQuery(String sql)`：执行**DDL**(select)语句

其中**ResultSet**是结果集对象，详情在之后再讲
