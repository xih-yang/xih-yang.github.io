# 5.16 调用存储过程
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/56.html
- 分类：ORM框架
- 分组：5 ActiveRecord
使用工具类 Db 可以很方便调用存储过程，以下是代码示例：

```java
Db.execute((connection) -> {
    CallableStatement cs = connection.prepareCall(...);
    cs.setObject(1, ...);
    cs.setObject(2, ...);
    cs.execute();
    cs.close();
    return cs.getObject(1);
});
```

如上所示，使用 Db.execute(...) 可以很方便去调用存储过程，其中的 connection 是一个 Connection 类型的对象，该对象在使用完以后，不必 close()，因为 jfinal 在上层会默认帮你 close() 掉。

此外，MySQL 之下还可以使用更简单的方式调用存储过程：

```java
// 调用存储过程，查询 salary 表
Record first = Db.findFirst("CALL FindSalary (1,\"201901\")");
// 调用存储过程，插入 salary 表
int update2 = Db.update("CALL InsertSalary (3, 123)");
// 调用存储过程，更新 salary 表
int update = Db.update("CALL UpdateSalary (3, 99999)");
// 调用存储过程，删除 salary 表
int delete = Db.delete("CALL DeleteSalary(3)");
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
