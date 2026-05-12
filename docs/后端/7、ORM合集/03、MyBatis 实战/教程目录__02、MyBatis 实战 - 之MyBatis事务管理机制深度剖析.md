# 02、MyBatis 实战 - 之MyBatis事务管理机制深度剖析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/2.html
- 分类：ORM框架
- 分组：教程目录
## 关于mybatis的事务管理机制。(深度剖析)

**1、** 在mybatis-config.xml文件中，可以通过以下的配置进行mybatis的事务管理；

```xml
<transactionManager type="JDBC"/>
```

**2、** type属性的值包括两个:；

```java
JDBC(jdbc)
MANAGED(managed)
type后面的值，只有以上两个值可选，不区分大小写。
```

**3、** 在mybatis中提供了两种事务管理机制:；

```java
第一种:JDBC事务管理器
第二种:MANAGED事务管理器
```

**4、** JDBC事务管理器:；

```java
mybatis框架自己管理事务，自己采用原生的JDBC代码去管理事务:
conn.setAutoCommit(false);开启事务。
....业务处理...
conn.commit);手动提交事务
使用JDBC事务管理器的话，底层创建的事务管理器对象:JdbcTransaction对象。
如果你编写的代码是下面的代码:
SqlSession sqlSession=sqlSessionFactory.openSession(true);
表示没有开启事务。因为这种方式压根不会执行:conn.setAutoCommit(false):
在JDBC事务中，没有执行conn.setAutoCommit(false);那么autoCommit就是true
如果autoCommit是true，就表示没有开启事务。
只要执行任意一条DML语句就提交一次。
```

**5、** MANAGED事务管理器:；

```java
 （1）mybatis不再负责事务的管理了。事务管理交给其它容器来负责。例如:spring 
我不管事务了，你来负责吧。
 对于我们当前的单纯的只有mybatis的情况下，如果配置为:MANAGED 
 那么事务这块是没人管的。没有人管理事务表示事务压根没有开启。 
 没有人管理事务就是没有事务。 
（2） JDBC中的事务: 
如果你没有在JDBC代码中执行:conn.setAutoCommit(false);的话，
默认的autoCommit是true。
```

**重点:**

```java
以后注意了，只要你的autoCommit是true，就表示没有开启事务。
只有你的autoCommit是false的时候，就表示开启了事务。
```

**6、** 代码案例；

```java
package com.ba01.dao;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.InputStream;
public class Test2 {
        public static void main(String[] args) throws Exception {
            //获取SqlSessionFactoryBuilder对象
            SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
            //获取SqlSessionFactory对象
            InputStream ins = Resources.getResourceAsStream("mybatis-config.xml");
            //InputStream is =ClassLoader.getSystemClassLoader().getResourceAsStream("mybatis-config.xml");
            SqlSessionFactory sqlSessionFactory=sqlSessionFactoryBuilder.build(ins);//一般情况下都是一个数据库对应一个SqlSessionFactory对象。
            // 获取SqlSession对象
            SqlSession sqlSession =sqlSessionFactory.openSession();//如果使用的事务管理器是JDBC的话，底层实际上会执行:conn.setAutoCommit(false);// 这种方式实际上是不建议的，因为没有开启事务。
            //SqlSession sqlSession=sqlSessionFactory.openSession(true);
            //执行SQL语句
            int count =sqlSession.insert( "insertCar");// 返回值是影响数据库表当中的记录条数。
            System.out.println("插入了几条记录:"+ count);
            // 手动提交
            sqlSession.commit();// 如果使用的事务管理器是JDBC的话，底层实际上还是会执行conn.commit();
}
    }
```

**7、** 引用官网对事务的描述；

事务管理器（transactionManager）

在MyBatis 中有两种类型的事务管理器（也就是 type=“[JDBC|MANAGED]”）：

JDBC – 这个配置直接使用了 JDBC 的提交和回滚设施，它依赖从数据源获得的连接来管理事务作用域。

MANAGED – 这个配置几乎没做什么。它从不提交或回滚一个连接，而是让容器来管理事务的整个生命周期（比如 JEE 应用服务器的上下文）。 默认情况下它会关闭连接。然而一些容器并不希望连接被关闭，因此需要将 closeConnection 属性设置为 false 来阻止默认的关闭行为。例如:

```xml
<transactionManager type="MANAGED">
  <property name="closeConnection" value="false"/>
</transactionManager>
```

提示如果你正在使用 Spring + MyBatis，则没有必要配置事务管理器，因为 Spring 模块会使用自带的管理器来覆盖前面的配置。

这两种事务管理器类型都不需要设置任何属性。它们其实是类型别名，换句话说，你可以用 TransactionFactory 接口实现类的全限定名或类型别名代替它们。

```java
public interface TransactionFactory {
  default void setProperties(Properties props) {
      // 从 3.5.2 开始，该方法为默认方法
    // 空实现
  }
  Transaction newTransaction(Connection conn);
  Transaction newTransaction(DataSource dataSource, TransactionIsolationLevel level, boolean autoCommit);
}
```

在事务管理器实例化后，所有在 XML 中配置的属性将会被传递给 setProperties() 方法。你的实现还需要创建一个 Transaction 接口的实现类，这个接口也很简单：

```java
public interface Transaction {
  Connection getConnection() throws SQLException;
  void commit() throws SQLException;
  void rollback() throws SQLException;
  void close() throws SQLException;
  Integer getTimeout() throws SQLException;
}
```

使用这两个接口，你可以完全自定义 MyBatis 对事务的处理。
