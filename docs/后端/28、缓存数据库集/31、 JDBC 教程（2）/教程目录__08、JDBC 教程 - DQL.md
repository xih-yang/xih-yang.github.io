# 08、JDBC 教程 - DQL
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/8.html
- 分类：缓存数据库
- 分组：教程目录
## 需求

我们试着查询**emp**表的数据并且将其**封装为对象**，然后打印

我们先来看看**emp**表，如下：

我们可以把每**一条数据**看作**一个对象**，然后用**集合**去装载它们

**步骤**：

**1、** 定义Emp类；

**2、** 定义方法`publicListfindAll(){}`；

**3、** 实现方法`select*fromemp;`；

## 实现

我们先来根据**emp**表去建一个**Emp**类，如下：

```java
public class Emp {
    private int id;
    private String ename;
    private int job_id;
    private int mgr;
    private Date joindate;
    private double salary;
    private double bonus;
    private int dept_id;
}
```

然后用**ALT+INS**去快速生成**set**、**get**和**toString**方法

获取数据算法如下：

```java
Emp emp = null;
list = new ArrayList<Emp>();
while (rs.next()) {
    //获取数据
    int id = rs.getInt("id");
    String ename = rs.getString("ename");
    int job_id = rs.getInt("job_id");
    int mgr = rs.getInt("mgr");
    Date joindate = rs.getDate("joindate");
    double salary = rs.getDouble("salary");
    double bonus = rs.getDouble("bonus");
    int dept_id = rs.getInt("dept_id");
    // 创建emp对象，并赋值
    emp = new Emp();
    emp.setId(id);
    emp.setEname(ename);
    emp.setJob_id(job_id);
    emp.setMgr(mgr);
    emp.setJoindate(joindate);
    emp.setSalary(salary);
    emp.setBonus(bonus);
    emp.setDept_id(dept_id);
    //装载集合
    list.add(emp);
}
```

原理是给每一个**Emp**对象赋值并且把每一个**Emp**对象都放在**list集合**中

当然类在方法的最前面声明，以便于**释放资源**，如下：

```java
Connection conn = null;
Statement stmt = null;
ResultSet rs = null;
List<Emp> list = null;
```

其中**list**在前面声明以便于**返回**

整体代码：

**Emp.java**：

```java
package domain;
import java.util.Date;
/**
 * 封装Emp表数据的JavaBean
 */
public class Emp {
    private int id;
    private String ename;
    private int job_id;
    private int mgr;
    private Date joindate;
    private double salary;
    private double bonus;
    private int dept_id;
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getEname() {
        return ename;
    }
    public void setEname(String ename) {
        this.ename = ename;
    }
    public int getJob_id() {
        return job_id;
    }
    public void setJob_id(int job_id) {
        this.job_id = job_id;
    }
    public int getMgr() {
        return mgr;
    }
    public void setMgr(int mgr) {
        this.mgr = mgr;
    }
    public Date getJoindate() {
        return joindate;
    }
    public void setJoindate(Date joindate) {
        this.joindate = joindate;
    }
    public double getSalary() {
        return salary;
    }
    public void setSalary(double salary) {
        this.salary = salary;
    }
    public double getBonus() {
        return bonus;
    }
    public void setBonus(double bonus) {
        this.bonus = bonus;
    }
    public int getDept_id() {
        return dept_id;
    }
    public void setDept_id(int dept_id) {
        this.dept_id = dept_id;
    }
    @Override
    public String toString() {
        return "Emp{" +
                "id=" + id +
                ", ename='" + ename + '\'' +
                ", job_id=" + job_id +
                ", mgr=" + mgr +
                ", joindate=" + joindate +
                ", salary=" + salary +
                ", bonus=" + bonus +
                ", dept_id=" + dept_id +
                '}';
    }
}
```

**JDBCDemo08.java**：

```java
package com.zzq;
import domain.Emp;
/**
 * 定义一个方法，查询emp表的数据并奖其封装为对象，然后装载集合，返回
 */
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
public class JDBCDemo08 {
    public static void main(String[] args) {
        List<Emp> list = new JDBCDemo08().findAll();
        System.out.println(list);
        System.out.println(list.size());
    }
    /**
     * 查询所有emp对象
     *
     * @return
     */
    public List<Emp> findAll() {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        List<Emp> list = null;
        //1.注册驱动
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            //2.获取连接
            conn = DriverManager.getConnection("jdbc:mysql:///test03", "root", "root");
            //3.定义sql
            String sql = "select * from emp";
            //4.获取执行sql的对象
            stmt = conn.createStatement();
            //5.执行sql
            rs = stmt.executeQuery(sql);
            //6.遍历结果集
            Emp emp = null;
            list = new ArrayList<Emp>();
            while (rs.next()) {
                //获取数据
                int id = rs.getInt("id");
                String ename = rs.getString("ename");
                int job_id = rs.getInt("job_id");
                int mgr = rs.getInt("mgr");
                Date joindate = rs.getDate("joindate");
                double salary = rs.getDouble("salary");
                double bonus = rs.getDouble("bonus");
                int dept_id = rs.getInt("dept_id");
                // 创建emp对象，并赋值
                emp = new Emp();
                emp.setId(id);
                emp.setEname(ename);
                emp.setJob_id(job_id);
                emp.setMgr(mgr);
                emp.setJoindate(joindate);
                emp.setSalary(salary);
                emp.setBonus(bonus);
                emp.setDept_id(dept_id);
                //装载集合
                list.add(emp);
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
            if (stmt != null) {
                try {
                    stmt.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
            if (rs != null) {
                try {
                    rs.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return list;
    }
}
```
