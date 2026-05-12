# 14、JDBC 教程 - JDBC 隔离级别
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/14.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 隔离级别

```java
con. setTransactionIsolation(int level)
```

参数可选值如下：

- Connection.TRANSACTION_READ_UNCOMMITTED；
- Connection.TRANSACTION_READ_COMMITTED；
- Connection.TRANSACTION_REPEATABLE_READ；
- Connection.TRANSACTION_SERIALIZABLE。

## 事务总结

- 事务的特性：ACID；
- 事务开始边界与结束边界：开始边界（con.setAutoCommit(false)），结束边界（con.commit() 或con.rollback()）；
- 事务的隔离级别： READ_UNCOMMITTED、READ_COMMITTED、REPEATABLE_READ、SERIALIZABLE。多个事务并发执行时才需要考虑并发事务。
