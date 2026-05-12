# 14、MyBatis 实战 - 之MyBatis一级缓存
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/14.html
- 分类：ORM框架
- 分组：教程目录
## 一、MyBatis的缓存

### 1、缓存的作用

通过减少10的方式，来提高程序的执行效率。

### 2、mybatis的缓存

将select语句的查询结果放到缓存(内存)当中，下一次还是这条select语句的话，直接从缓存中取，不再查数据库。

一方面是减少了IO。

另一方面不再执行繁琐的查找算法。效率大大提升。

### 3、mybatis缓存包括

- 一级缓存:将查询到的数据存储到SqlSession中。
- 二级缓存:将查询到的数据存储到SqlSessionFactory中。
- 或者集成其它第三方的缓存:比如EhCache【Java语言开发的】、Memcache【C语言开发的】等。

### 4、注意点

缓存只针对于DQL语句，也就是说缓存机制只对应select语句

## 二、一级缓存

**提醒：**

一级缓存默认是开启的，不需要做任何配置。

**原理**:

只要使用同一个SqlSession对象执行同一条SQL语句，就会走缓存。

**下面通过代码来进行演示**

pojo类 Clazz

```java
public class Clazz {
    private Integer cid;
    private String name;
    ......此处省略get、set等方法
}
```

ClazzMapper接口

```java
public interface ClazzMapper {
    public Clazz selectByCidStep2(Integer cid);
    int insertClazz(Clazz clazz);
}
```

ClazzMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <select id="selectByCidStep2" resultType="Clazz">
        select * from t_clazz where cid ={cid}
    </select>
    <insert id="insertClazz" parameterType="Clazz">
        insert into t_clazz values (#{cid},#{name})
    </insert>
</mapper>
```

测试类趴一下

```java
@Test
    public void testcache() throws ParseException {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectByCidStep2(1000);
        System.out.println(clazz);
        ClazzMapper mapper1 = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz1 = mapper1.selectByCidStep2(1000);
        System.out.println(clazz1);
        sqlSession.close();
    }
```

运行结果

```java
ClazzMapper.selectByCidStep2 - ==>  Preparing: select * from t_clazz where cid = ?
ClazzMapper.selectByCidStep2 - ==> Parameters: 1000(Integer)
ClazzMapper.selectByCidStep2 - <==      Total: 1
Clazz{
     cid=1000, name='高三一班', stus=null}
Clazz{
     cid=1000, name='高三一班', stus=null}
```

我们从运行结果发现，只执行了一次sql语句的查询，第二次查询，是直接从一级缓存中拿的数据，并没有执行sql。所以说mybatis默认是开启一级缓存的，但是前提必须是同一个Sqlsession对象。

#### 三、关于一级缓存的思考

**1、思考:什么时候不走缓存?**

SqlSession对象不是同一个，肯定不走缓存。查询条件不一样，肯定也不走缓存。

**代码演示：**

注意：接口、pojo类都是基于上面的哦

我们使用两个不同的SqlSession对象来执行sql语句，看看结果如何。

```java
@Test
    public void testcache1() throws Exception {
        SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        SqlSession sqlSession1 = factory.openSession();
        ClazzMapper mapper = sqlSession1.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectByCidStep2(1000);
        System.out.println(clazz);
        SqlSession sqlSession2 = factory.openSession();
        ClazzMapper mapper1 = sqlSession2.getMapper(ClazzMapper.class);
        Clazz clazz1 = mapper1.selectByCidStep2(1000);
        System.out.println(clazz1);
        sqlSession1.commit();
        sqlSession2.close();
    }
```

运行结果如下，执行了两次相同的sql语句，因为他们使用的是不同的SqlSession对象。

**2、思考:什么时候一级缓存失效?**

第一次DQL和第二次DQL之间你做了以下两件事中的任意一件，都会让一级缓存清空:

- 执行了sqlSession的clearCacheO)方法，这是手动清空缓存。
- 执行了INSERT或DELETE或UPDATE语句。不管你是操作哪张表的，都会清空一级缓存。

**代码演示：**

注意：接口、pojo类都是基于上面的哦

我们先演示调用了sqlSession的clearCacheO)方法，看看结果如何

```java
@Test
    public void testClearcache() throws ParseException {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectByCidStep2(1000);
        System.out.println(clazz);
        sqlSession.clearCache();
        ClazzMapper mapper1 = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz1 = mapper1.selectByCidStep2(1000);
        System.out.println(clazz1);
        sqlSession.close();
    }
```

运行结果如下，执行了两次同样的sql查询，说明调用了clearCache方法之后，一级缓存失效了

再演示一下，在两次查询之间，添加一个插入的操作，看看结果如何

```java
@Test
    public void testNocache() throws ParseException {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectByCidStep2(1000);
        System.out.println(clazz);
        mapper.insertClazz(new Clazz(1004,"高三一班"));
        sqlSession.commit();
        ClazzMapper mapper1 = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz1 = mapper1.selectByCidStep2(1000);
        System.out.println(clazz1);
        sqlSession.close();
    }
```

运行结果如下，在两次查询之间增加INSERT或DELETE或UPDATE语句，不管你是操作哪张表的，都会清空一级缓存。
