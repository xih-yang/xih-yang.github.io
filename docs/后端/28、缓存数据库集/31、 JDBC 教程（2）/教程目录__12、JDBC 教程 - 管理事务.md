# 12、JDBC 教程 - 管理事务
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/12.html
- 分类：缓存数据库
- 分组：教程目录
## (一)回顾事务概念

**事务**：

一个包含**多个步骤**的业务操作

如果这个业务操作被**事务管理**，则这个步骤要么同时成功，要么同时失败

**操作**：

**1、** 开启事务；

**2、** 提交事务；

**3、** 回滚事务；

## (二)Connection对象管理事务

**方法**：

**1、** 开启事务：`setAutoCommit(booleanautoCommit)`；

调用该方法设置参数为**false**，即开启事务

**注意**：在执行sql之前开启事务
**2、** 提交事务：`commit()`；

**注意**：当所有sql都执行完提交事务
**3、** 回滚事务：`rollback()`；

**注意**：在catch中回滚事务

## (三)案例

我们用**account**表写一个转账的案例

代码：

```java
package com.zzq;
import util.JDBCUtils;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
/**
 * 事务操作
 */
public class JDBCDemo12 {
    public static void main(String[] args) {
        Connection conn = null;
        PreparedStatement pstmt1 = null;
        PreparedStatement pstmt2 = null;
        try {
            //1.获取连接
            conn = JDBCUtils.getConnection();
            //2.定义sql
            //2.1 张三 - 500
            String sql1 = "update account set balance = balance - ? where id = ?";
            //2.2 李四 + 500
            String sql2 = "update account set balance = balance + ? where id = ?";
            //3.获取执行sql对象
            pstmt1 = conn.prepareStatement(sql1);
            pstmt2 = conn.prepareStatement(sql2);
            //4.设置参数
            pstmt1.setDouble(1, 500);
            pstmt1.setInt(2, 1);
            pstmt2.setDouble(1, 500);
            pstmt2.setInt(2, 2);
            //5.执行sql
            pstmt1.executeUpdate();
            pstmt2.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            JDBCUtils.close(pstmt1, conn);
            JDBCUtils.close(pstmt2, null);
        }
    }
}
```

运行结果：

我们先把它改回1000

然后手动制造异常

可以看到报错了

再看看数据库，500块钱不翼而飞

## (四)加入事务管理

关闭自动提交事务

```java
//开启事务
conn.setAutoCommit(false);
```

手动提交事务

回滚

**注意**：我们捉一只大一点的异常

这样子不管出现什么异常都会回滚，保证安全性

加入限定条件

我们把数据还原回1000

执行代码后依然报错

但是数据没有被修改
