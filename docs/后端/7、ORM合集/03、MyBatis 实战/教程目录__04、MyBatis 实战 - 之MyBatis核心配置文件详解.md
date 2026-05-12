# 04、MyBatis 实战 - 之MyBatis核心配置文件详解
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/4.html
- 分类：ORM框架
- 分组：教程目录
## 一、核心配置文件之多环境配置

```java
使用environment 标签，进行多环境的配置 ，具体配置如下：
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/powernode?useUnicode=true&characterEncoding=utf-8"/>
                <property name="username" value="root"/>
                <property name="password" value="root"/>
            </dataSource>
        </environment>
        <environment id="mybatisDB">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/mybatisDB?useUnicode=true&characterEncoding=utf-8"/>
                <property name="username" value="root"/>
                <property name="password" value="root"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="com/CarMapper.xml"/>
        <mapper resource="com/UserMapper.xml"/>
    </mappers>
</configuration>
```

```java
配置说明：
1、<environments default="development"> 表示默认的环境配置，通过id来指定
2、一个环境下对应一个SqlSessionFactory 对象
```

核心测试代码演示

```java
1、使用默认的环境
```

```java
SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
 SqlSessionFactory factory = sqlSessionFactoryBuilder.build(Resources.getResourceAsStream("mybatis-config.xml"));
```

```java
指定mybatis的环境
```

```java
SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
SqlSessionFactory factory = sqlSessionFactoryBuilder.build(Resources.getResourceAsStream("mybatis-config.xml"),"development");
```

## 二、核心配置文件之事务管理器

**transactionManager标签:**

```java
作用:配置事务管理器。指定mybatis具体使用什么方式去管理事务。
```

**type属性有两个值:**

```java
第一个:JDBC:使用原生的JDBC代码来管理事务。
conn.setAutoCommit(false);
·...
conn.commit();
第二个:MANAGED:mybatis不再负责事务的管理，将事务管理交给其它的JEE(JavaEE)容器来管理。例如:spring了.大小写无所谓。不缺分大小写。但是不能写其他值。只能是二选一:
```

jdbc、managed

**在mybatis中提供了一个事务管理器接口:Transaction**

```java
该接口下有两个实现类:
JdbcTransdction ManagedTransaction
如果type="JDBC"，那么底层会实例化JdbcTransaction对象。
如果type="MANAGED"，那么底层会实例化ManagedTransaction
```

## 三、核心配置文件之数据源配置

**dataSource配置:**

**1.dataSource被称为数据源。**

**2.dataSource作用是什么?**

为程序提供Connection对象。(但凡是给程序提供Connection对象的，都叫做数据源。)

**3.数据源实际上是一套规范。**JDK中有这套规范:javax.sql.DataSource(这个数据源的规范，这套接口实际上是JDK规定的。)

**4.我们自己也可以编写数据源组件，只要实现javax.sql.DataSource接口就行了**。

实现接口当中所有的方法。

这样就有了自己的数据源比如你可以写一个属于自己的数据库连接池(数据库连接池是提供连接对象的，所以数据库连接池就是一个数据源)。

**5.常见的数据源组件有哪些呢【常见的数据库连接池有哪些呢】?**

阿里巴巴的德鲁伊连接池:druid、с3pθ 、dbcp

**6.type属性用来指定数据源的类型**，

就是指定具体使用什么方式来获取Connection对象:

type属性有三个值:必须是三选一。

**type=“[UNPOOLED|POOLED|JNDI]”**

UNPOOLED:不使用数据库连接池技术。每一次请求过来之后，都是创建新的Connection对象。

POOLED:使用mybatis自己实现的数据库连接池。

JNDI:集成其它第三方的数据库连接池。

```java
测试UNPOOLED和POOLED的区别
1、如果配置了UNPOOLED,表示不使用连接池
```

```xml
<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="UNPOOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                ......
</configuration>
```

```java
@Test
    public void testMybatis1() throws IOException {
        SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
        //使用默认的环境
        SqlSessionFactory factory = sqlSessionFactoryBuilder.build(Resources.getResourceAsStream("mybatis-config.xml"));
        //指定mybatis的环境
        SqlSession sqlSession = factory.openSession();
        Car car = sqlSession.selectOne("jskdlf.selectById",12);
        System.out.println(car.toString());
        sqlSession.commit();
        sqlSession.close();
        SqlSession sqlSession2 = factory.openSession();
        Car car1 = sqlSession2.selectOne("aaaaaddd.selectById",12);
        System.out.println(car1.toString());
        sqlSession2.commit();
        sqlSession2.close();
    }
```

```java
获得的连接对象，是不一样的，每次都获取到一个新创建的连接对象，
这样会很消耗资源
```

```java
2、如果配置了POOLED,表示使用mybatis默认的连接池
```

```xml
<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                ......
</configuration>
```

```java
运行结果如下，我们发现都是同一个连接对象
```

**总结连接池优点:**

```java
1.每一次获取连接都从池中拿，效率高。
2.因为每一次只能从池中拿，所以连接对象的创建数量是可控的。
假设最多的连接数量是:10个最多空闲的数量是:5个。
假设目前已经空闲5个了。马上第6个要空闲了。
假设第6个空闲下来了。此时连接池为了保证最多空闲的数量5个，
会真正关闭多余的空闲的连接对象。
```
