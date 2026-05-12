# 16、MyBatis 实战 - 之MyBatis集成EhCache
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/16.html
- 分类：ORM框架
- 分组：教程目录
## 一、MyBatis集成EhCache

- 集成EhCache是为了代替mybatis自带的二级缓存。一级缓存是无法替代的。
- mybatis对外提供了接口，也可以集成第三方的缓存组件。比如EhCache、Memcache等。都可以。
- EhCache是Java写的。Memcache是C语言写的。所以mybatis集成EhCache较为常见，按照以下步骤操作，就可以完成集成

### 1、引入mybatis整合ehcache的依赖

```xml
<dependency>
      <groupId>org.mybatis.caches</groupId>
      <artifactId>mybatis-ehcache</artifactId>
      <version>1.2.2</version>
    </dependency>
```

### 2、类根路径下新建ehcache.xml,并配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="http://ehcache.org/ehcache.xsd"
         updateCheck="false">
        <!--磁盘存储:将缓存中暂时不使用的对象,转移到硬盘,类似于Windows系统的虚拟内存-->
        <diskStore path="d:/ehcache"/>
        <!--defaultCache:默认的管理策略-->
        <defaultCache eternal="false" maxElementsInMemory="1000" overflowToDisk="false" diskPersistent="false"
        timeToIdleSeconds="0" timeToLiveSeconds="600" memoryStoreEvictionPolicy="LRU"/>
</ehcache>
```

### 3、POJO类 Clazz

注意：Clazz类可以实现序列化接口Serializable ，也可以不实现

```java
public class Clazz implements Serializable {
    private Integer cid;
    private String name;
    ......此处省略get、set方法
```

### 4、ClazzMapper类

```java
public interface ClazzMapper {
    public Clazz selectByCidStep2(Integer cid);
}
```

### 5、ClazzMapper.xml文件

注意：此处要使用集成的第三方缓存配置

cache type=“org.mybatis.caches.ehcache.EhcacheCache”

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <!--<cache/>-->
    <cache type="org.mybatis.caches.ehcache.EhcacheCache"/>
    <select id="selectByCidStep2" resultType="Clazz">
        select * from t_clazz where cid ={cid}
    </select>
```

### 6、编写测试类及使用

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

运行结果如下：

从结果可以发现，第一次查询了sql语句，第二次直接走了缓存，需要注意的一点是，必须要将SqlSession对象关闭掉，才会将一级缓存结果写入到二级缓存中。

因为虽然集成了第三方的缓存组件，但是一级缓存是mybatis默认开启的，无法替代。
