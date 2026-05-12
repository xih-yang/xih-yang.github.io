# 15、MyBatis 实战 - 之MyBatis二级缓存
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/15.html
- 分类：ORM框架
- 分组：教程目录
## MyBatis二级缓存

### 1、二级缓存的范围

Mybatis的一级缓存的范围是SqlSession，而二级缓存的范围是SqlSessionFactory，二级缓存的范围更大，相当于是数据库级别，一级缓存相当于表级别。

### 2、使用二级缓存需要具备的条件

```java
（1）<setting name="cacheEnabled" value="true">
全局性地开启或关闭所有映射器配置文件中已配置的任何缓存。默认就是true，
无需设置,
（2）在需要使用二级缓存的SqlMapperxml文件中添加配置:<cache/>
（3）使用二级缓存的实体类对象必须是可序列化的，
也就是必须实现iava.io.Serializable接口
（4）SqlSession对象关闭或提交之后，一级缓存中的数据才会被写入到二级缓存当中。
此时二级缓存才可用。
```

### 3、二级缓存代码演示

pojo类Clazz ，记住要实现序列化接口Serializable

```java
public class Clazz implements Serializable {
    private Integer cid;
    private String name;
    ......此处省略get、set方法
```

ClazzMapper 接口

```java
public interface ClazzMapper {
    public Clazz selectByCidStep2(Integer cid);
}
```

ClazzMapper.xml ，记得加上 cache 标签

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <cache/>
    <select id="selectByCidStep2" resultType="Clazz">
        select * from t_clazz where cid ={cid}
    </select>
</mapper>
```

我们通过测试类来趴一下

```java
 @Test
    public void testSecondCache() throws Exception {
        SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        SqlSession sqlSession1 = factory.openSession();
        ClazzMapper mapper = sqlSession1.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectByCidStep2(1000);
        System.out.println(clazz);
        sqlSession1.close();
        SqlSession sqlSession2 = factory.openSession();
        ClazzMapper mapper1 = sqlSession2.getMapper(ClazzMapper.class);
        Clazz clazz1 = mapper1.selectByCidStep2(1000);
        System.out.println(clazz1);
        sqlSession2.close();
    }
```

运行结果如下，第一次查询，没有缓存，所以我们看到：

Cache Hit Ratio [com.powernode.mybatis.mapper.ClazzMapper]: 0.0

表示缓存命中率为0.0，第二次查询，因为开启了二级缓存，所以命中率变成了Cache Hit Ratio [com.powernode.mybatis.mapper.ClazzMapper]: 0.5

，此时直接走了缓存取数据，并没有查sql语句

我们发现上面的测试类，使用的是两个不同的SqlSession 执行对象，如果没有开启二级缓存，那么肯定每一次都会去查询sql语句，但是现在加了二级缓存的配置，所以就走了缓存。

需要注意的一点是：如果SqlSession 对象没有关闭，那么就不会走二级缓存，

我们可以通过代码来演示一下，代码有一点变化，就是去掉了 sqlSession1.close();

```java
@Test
    public void testSecondCache() throws Exception {
        SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        SqlSession sqlSession1 = factory.openSession();
        ClazzMapper mapper = sqlSession1.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectByCidStep2(1000);
        System.out.println(clazz);
        SqlSession sqlSession2 = factory.openSession();
        ClazzMapper mapper1 = sqlSession2.getMapper(ClazzMapper.class);
        Clazz clazz1 = mapper1.selectByCidStep2(1000);
        System.out.println(clazz1);
        sqlSession2.close();
    }
```

运行结果如下，我们发现两次的查询缓存命中率都为0.0，都没有走缓存，原因就是因为没有关闭SqlSession 对象。所以要开启二级缓存，除了必要的文件配置，还需要在使用的时候，一定要关闭SqlSession 对象，这样二级缓存才会生效

### 4、二级缓存的失效

二级缓存的失效:只要两次查询之间出现了增删改操作。二级缓存就会失效。【一级缓存也会失效】
