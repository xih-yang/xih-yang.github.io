# 13、JDBC 教程 - 数据库事务
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/13.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC进阶

### 数据库事务

#### 一、事务的概念和操作

在数据库中，所谓事务是指一组逻辑操作单元

，是数据从一种状态变换到另一种状态。

为确保数据库中数据的一致性，数据的操作应当是离散的成组的逻辑单元；当它全部完成时，数据的一致性可以保持，而当这个单元中的一部分操作失败，整个事务应全部视为错误，所有从起始点以后的操作应全部回退到开始状态。**也就是，这一组操作要么全部成功，要么全部不成功**。

事务的操作：先定义开始一个事务，然后对数据作修改操作，这时如果提交(COMMIT)，这些修改就永久地保存下来，如果回退(ROLLBACK)，数据库管理系统将放弃所做的所有修改而回到开始事务时的状态。

#### 二、事务的ACID属性

**1、****原子性(Atomicity)**：原子性是指事务是一个不可分割的工作单位，事务中的操作要么都发生，要么都不发生；

**2、****一致性(Consistency)**：事务必须使数据库从一个一致性状态变换到另一个一致性状态；

**3、****隔离性(Isolation)**：事务的隔离性是指一个事务的执行不能被其他事务干扰，即一个事务内部的操作及使用的数据对并发的其它事务是隔离的，并发执行的各个事务之间不能互相干扰；

**4、****持久性(Durability)**：持久性是指一个事务一旦被提交，它对数据库中数据的改变就是永久性的，接下来的其他操作和数据库故障不应该对其有任何影响；

#### 三、JDBC事务处理

事务：指构成单个逻辑工作单元的操作集合

事务处理：保证所有事务都能作为一个工作单元来执行，即使出现了故障，都不能改变这种执行方式。当在一个事务中执行多个操作时，要么所有的事务都被提交(COMMIT)，要么整个事务回滚(ROLLBACK)到最初状态

当一个连接对象被创建时，默认情况下是自动提交事务(MySQL就是如此)：每次执行有一个SQL语句时，如果执行成功，就会向数据库自动提交，而不能回滚

为了让多个SQL语句作为一个事务执行：

- 调用Connection对象的setAutoCommit(false);以取消自动提交事务
- 在所有的SQL语句都成功执行后，调用commit();方法提交事务
- 在出现异常时，调用rollback();方法回滚事务
- 若此时Connection没有被关闭，则需要恢复其自动提交状态

**注意：**

如果多个操作都是独立的连接`Connection`，那么是无法完成事务的。所以我们需要在同一个连接上完成多个操作步骤的执行

下面的代码操作是基于同一个`Connection`连接下执行的

**异常回滚效果示范**

```java
package com.tqazy.test;
import com.tqazy.jdbc.JDBCUtils;
import org.junit.Test;
import java.sql.SQLException;
public class TestAffair {
    @Test
    public void testAffair(){
        String sql = "UPDATE student SET student_number = ? WHERE student_name = ?";
        try {
            // 1. 获取数据的Connection连接
            JDBCUtils.getConnection("database.properties");
            // 2. 事务操作开始前，开始事务：取消Connection的默认提交行为
            JDBCUtils.con.setAutoCommit(false);
            // 3. 操作事务：修改数据(此处将原来在update()方法里获取connection连接的方法调用去掉)
            JDBCUtils.update(sql, "12138", "苏熙");
            // 产生异常
            int i = 100/0;
            System.out.println(i);
            JDBCUtils.update(sql, "10086", "浅夏");
            // 4. 在事务操作都成功情况下提交事务
            JDBCUtils.con.commit();
            System.out.println("执行了提交操作");
        } catch (Exception e) {
            try {
                // 如果出现异常，则在catch块中回滚事务
                JDBCUtils.con.rollback();
                System.out.println("执行了回滚操作");
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            JDBCUtils.close();
        }
    }
}
```

结果：

**1、** 执行前的数据表：；

**2、** 当异常存在时执行之后的数据表(没有变化，执行被回滚了)：；

**3、** 当异常部分被注释后再执行，得到的数据表(数据表变化，操作被提交了)：；

如果没有事务存在，那么在出现异常时，执行的第一个sql已经在数据库生效保存了
