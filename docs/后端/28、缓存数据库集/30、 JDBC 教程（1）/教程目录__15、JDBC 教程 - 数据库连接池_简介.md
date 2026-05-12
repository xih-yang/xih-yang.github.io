# 15、JDBC 教程 - 数据库连接池_简介
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/15.html
- 分类：缓存数据库
- 分组：教程目录
## 数据库连接池的概念

用池来管理 C onnection，这可以重复使用 Connection。有了池，所以我们就不用自己来创建Connection，而是通过池来获取 Connection 对象。当使用完 Connection 后，调用 Connection 的close() 方法也不会真的关闭 Connection，而是把 Connection “归还” 给池。池就可以再利用这个Connection 对象了。

## JDBC数据库连接池接口（DataSource）

Java为数据库连接池提供了公共的接口：javax.sql.DataSource，各个厂商可以让自己的连接池实现这个接口。这样应用程序可以方便的切换不同厂商的连接池！
