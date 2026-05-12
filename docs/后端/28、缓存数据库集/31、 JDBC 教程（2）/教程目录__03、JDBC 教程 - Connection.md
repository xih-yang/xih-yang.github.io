# 03、JDBC 教程 - Connection
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/3.html
- 分类：缓存数据库
- 分组：教程目录
## 概念

数据库连接对象

## 功能

**1、** 获取sql的执行对象；

**方法**：

`Statement createStatement()`

`PreparedStatement prepareStatement(String sql)`

其中**PreparedStatement**也是获取sql的执行对象，详情在之后再讲

**2、** 管理事务；

**方法**：

**1、****开启事务**：`setAutoCommit(booleanautoCommit)`；

调用该方法设置参数为**false**，即开启事务

**2、****提交事务**：`commit()`；

**3、****回滚事务**：`rollback()`；
