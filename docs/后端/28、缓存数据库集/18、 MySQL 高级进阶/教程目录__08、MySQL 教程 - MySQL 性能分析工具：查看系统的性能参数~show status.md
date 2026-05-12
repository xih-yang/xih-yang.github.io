# 08、MySQL 教程 - MySQL 性能分析工具：查看系统的性能参数~show status
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/8.html
- 分类：缓存数据库
- 分组：教程目录
在MySQL中，可以使用show status语句查询一些MySQL数据库服务器的性能参数、执行频率 。

show status语句语法如下：

```java
show [global|session] status like '参数';
```

一些常用的性能参数如下：

- connections：连接mysql服务器的次数。
- uptime：mysql服务器的上线时间。
- slow_queries：慢查询的次数。
- innodb_rows_read：select查询返回的行数
- innodb_rows_inserted：执行insert操作插入的行数
- innodb_rows_updated：执行update操作更新的行数
- innodb_rows_deleted：执行delete操作删除的行数
- com_select：查询操作的次数。
- com_insert：插入操作的次数。对于批量插入的insert操作，只累加一次。
- com_update：更新操作 的次数。
- com_delete：删除操作的次数。

若查询mysql服务器的连接次数，则可以执行如下语句：

```java
show status like 'connections';
```

若查询服务器的工作时间，则可以执行如下语句：

```java
show status like 'uptime';
```

若查询mysql服务器的慢查询次数，则可以执行如下语句：

```java
show status like 'slow_queries';
```

慢查询次数参数可以结合慢查询日志找出慢查询语句，然后针对慢查询语句进行表结构优化或者查询语句优化。

再比如，如下的指令可以查看相关的指令情况：

```java
show status like 'innodb_rows_%';
```
