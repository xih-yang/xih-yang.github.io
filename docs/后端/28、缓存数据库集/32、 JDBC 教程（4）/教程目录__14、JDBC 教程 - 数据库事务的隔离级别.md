# 14、JDBC 教程 - 数据库事务的隔离级别
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/14.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC进阶

### 数据库事务的隔离级别

#### 一、概念说明

对于同时运行的多个事务，当这些事务访问数据库中相同的数据时，如果没有采取必要的隔离机制，就会导致各种并发问题：

- 脏读：对于两个事务T1、T2，T1读取了已经被T2更新但还没有被提交的字段之后，若T2回滚，T1读取的内容就是临时且无效的；
- 不可重复读：对于两个事务T1、T2，T1读取了一个字段，然后T2更新了该字段之后，T1再次读取同一个字段，值就不同了；
- 幻读：对于两个事务T1、T2，T1从一个表中读取了一个字段，然后T2在该表中插入了一些新的行之后，如果T1再次读取同一个表，就会多出几行

数据库事务的隔离性：数据库系统必须据有隔离并发运行各事务的能力，使它们不会互相影响，避免各种并发问题

一个事务与其他事务隔离的程度称为隔离级别。数据库规定了多种事务隔离级别，不同隔离级别对应不同的干扰程度，隔离级别越高，数据一致性就越好，但并发行越弱

#### 二、隔离级别

数据库提供的4种事务隔离级别：

隔离级别
描述

READ UNCOMMITED(读未提交数据)
允许事务读取未被其他事务提交的变更，脏读、不可重复读、幻读的问题都会出现

READ COMMITED(读已提交数据)
只允许事务读取已经被其它事务提交的变更，可以避免脏读，但不可重复读和幻读问题仍然可能出现

REPEATABLE READ(可重复读)
确保事务可以多次从一个字段中读取相同的值，在这个事务持续期间，禁止其他事务对这个字段进行更新，可以避免脏读和不可重复读，但幻读的问题仍然存在

SERIALIZABLE(串行化)
确保事务可以从一个表中读取相同行，在这个事务持续期间，禁止其他事务对该表执行插入、更新和删除操作，所有并发问题都可以避免，但是性能十分低下

**Oracle**：支持2种事务隔离级别：READ COMMITED、SERIALIZABLE。Oracle默认的事务隔离级别为：READ COMMITED

**MySQL**：支持4种事务隔离级别。MySQL默认的事务隔离级别为：REPEATABLE READ(可重复读)

**举例(MySQL事务隔离)**：

```java
package com.tqazy.test;
import com.tqazy.entity.Student;
import com.tqazy.jdbc.JDBCUtils;
import org.junit.Test;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
public class TestQuarantine {
    @Test
    public void testQuarantine(){
        String sql = "UPDATE student SET student_number = ? WHERE student_name = ?";
        Connection con = null;
        PreparedStatement ps = null;
        try {
            // 1. 获取数据的Connection连接
            con = JDBCUtils.getConnection("database.properties");
            ps = con.prepareStatement(sql);
            // 2. 事务采用读未提交的级别，即最低级别
            con.setTransactionIsolation(JDBCUtils.con.TRANSACTION_READ_UNCOMMITTED);
            // 3. 设置Connection的提交方式为不自动提交
            con.setAutoCommit(false);
            System.out.println("初始查询，第一次查询");
            // 查询当前数据库表的全部数据并打印
            selectList(con);
            // 4. 修改数据
            JDBCUtils.update(con, ps, sql, "1002", "苏熙");
            System.out.println("\n在更新但未提交时查询：");
            selectList(con);
            // 5. 回滚数据
            con.rollback();
            System.out.println("\n回滚之后的查询：");
            selectList(con);
        } catch (Exception e) {
            try {
                con.rollback();
                System.out.println("执行了回滚操作");
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            JDBCUtils.close(con, null, ps);
        }
    }
    public void selectList(Connection con) {
        String sql = "SELECT * FROM student";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = con.prepareStatement(sql);
            // 通过statement的executeQuery(sql)方法获取resultSet的实例
            rs = ps.executeQuery();
            while(rs.next()){
                Student stu = new Student();
                stu.setId(rs.getInt(1));
                stu.setStudentName(rs.getString(2));
                stu.setStudentSex(rs.getString(3));
                stu.setStudentNumber(rs.getInt(4));
                stu.setSchool(rs.getString(5));
                System.out.println(stu.toString());
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            JDBCUtils.close(null, rs, null);
        }
    }
}
```

**结果**：
