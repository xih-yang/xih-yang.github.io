# 06、JDBC 教程 - DDL
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/6.html
- 分类：缓存数据库
- 分组：教程目录
我们在前面介绍**Statement**类的时候介绍过`int executeUpdate(String sql)`方法不仅可以操作**DML**语句，还可以操作**DDL**语句，下面我们简单介绍一下怎么用**JDBC**操作**DDL**语句

## 创建表单

```java
//2. 定义sql
String sql = "create table student(id int,name varchar(20))";
```

注意**DDL**是**没有返回值**的，即数据库**被影响的行数为0**

所以返回0并**不代表**执行失败

但是我们很少会使用DDL，因为表单通常不需要动态地创建
