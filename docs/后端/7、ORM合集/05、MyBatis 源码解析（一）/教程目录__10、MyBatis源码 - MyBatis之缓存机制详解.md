# 10、MyBatis源码 - MyBatis之缓存机制详解
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/10.html
- 分类：ORM框架
- 分组：教程目录
### 缓存机制

频繁地查询必然会给数据库带来巨大的压力，为此 MyBatis 提供了丰富的缓存功能。缓存可以有效的提升查询效率、缓解数据库压力，提高应用的稳健性。

MyBatis 的缓存有两层，默认情况下会开启一级缓存，并提供了开启二级缓存的配置。为了提高扩展性。MyBatis定义了缓存接口Cache。我们可以通过实现Cache接口来自定义缓存。

#### 一级缓存

一级缓存(local cache), 即本地缓存, 作用域默认为sqlSession。

MyBatis 一级缓存是默认开启的，缓存的有效范围是一个会话内。一个会话内的 select 查询语句的结果会被缓存起来，当在该会话内调用 update、delete 和 insert 时，会话缓存会被刷新，以前的缓存会失效。

##### 验证一级缓存

动态查询案例：

```java
public class DynamicTest005 {
    public static void main(String[] args) throws IOException {
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession sqlSession = sqlSessionFactory.openSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        // 动态查询
        UserQuery userQuery = new UserQuery();
        userQuery.setLoginName("zhangwei");
        List<User> dynamicUserList = userMapper.selectDynamicUserList(userQuery);
        System.out.println(dynamicUserList);
        // 再次查询
        List<User> dynamicUserList2 = userMapper.selectDynamicUserList(userQuery);
        System.out.println(dynamicUserList2);
        // 判断是否同一对象
        System.out.println("判断是否同一对象" + (dynamicUserList == dynamicUserList2));
        sqlSession.commit();
        sqlSession.close();
    }
}
```

执行结果：连续两次调用了 userMapper 的 selectDynamicUserList方法，但是在程序输出中，SQL语句只执行了一次，而且两次调用返回对象为同一内存区域，这就是 MyBatis 缓存的作用，当第二次调用查询时，MyBatis 没有查询数据库而是直接从缓存中拿到了数据。

```java
==>  Preparing: SELECT * FROM base_user WHERE base_user.login_name = ?
==> Parameters: zhangwei(String)
<==    Columns: user_id, user_name, login_name, gender, phone, address, organization_id, state, email, create_user_id, modify_date, create_date, password, remark
<==        Row: 2, 张巍, zhangwei, 1, 1383838438, 牛逼大街，幸福路213号, 1, 1, sbsbsb@sb.com, null, 2018-07-12 06:27:36, 2018-07-12 06:27:36, $2a$12$tTyHsWKR4c8YujMQ6BrcleQkyGlbmUt8OE8tdXFoIsJ.YyMVbC7oq, 死三八！
Unknown column is detected on 'org.pearl.mybatis.demo.dao.UserMapper.selectDynamicUserList' auto-mapping. Mapping parameters are [columnName=remark,propertyName=remark,propertyType=null]
<==      Total: 1
[User(userId=2, userName=张巍, loginName=zhangwei, gender=1, phone=1383838438, address=牛逼大街，幸福路213号, organizationId=1, state=true, email=sbsbsb@sb.com, createUserId=null, modifyDate=Thu Jul 12 06:27:36 CST 2018, createDate=Thu Jul 12 06:27:36 CST 2018, password=$2a$12$tTyHsWKR4c8YujMQ6BrcleQkyGlbmUt8OE8tdXFoIsJ.YyMVbC7oq)]
[User(userId=2, userName=张巍, loginName=zhangwei, gender=1, phone=1383838438, address=牛逼大街，幸福路213号, organizationId=1, state=true, email=sbsbsb@sb.com, createUserId=null, modifyDate=Thu Jul 12 06:27:36 CST 2018, createDate=Thu Jul 12 06:27:36 CST 2018, password=$2a$12$tTyHsWKR4c8YujMQ6BrcleQkyGlbmUt8OE8tdXFoIsJ.YyMVbC7oq)]
判断是否同一对象true
```

##### 一级缓存失效的几种情况

###### （1）select 配置关闭缓存#

select 默认会启用一级缓存，可以通过 flushCache 属性来关闭 select 查询的缓存。

```java
 <select flushCache="true" id="selectDynamicUserList" resultType="org.pearl.mybatis.demo.pojo.entity.User">
```

###### （2）不同的SqlSession#

一级缓存的作用域为当前sesssion，当不同的SqlSession对象执行查询时，不会去读取缓存。

###### （3）同一个SqlSession但是查询条件不同#

同一个SqlSession但是查询条件不同时，由于参数不同，也不会去查询另外参数查询的一级缓存。

###### （4）调用 insert、update、delete 刷新缓存#

同一个SqlSession两次查询期间执行了任何一次增删改操作时，会话中的缓存也会被刷新。

###### （5）同一个SqlSession两次查询期间手动清空了缓存#

手动清空了缓存，缓存会被刷新。

#### 二级缓存

二级缓存(second level cache)，全局作用域缓存，二级缓存默认不开启，需要手动配置， MyBatis提供二级缓存的接口以及实现，缓存实现要求结果集映射POJO类实现Serializable接口，二级缓存在 SqlSession 关闭或提交之后才会生效。

二级缓存与一级缓存区别在于二级缓存的范围更大，多个sqlSession可以共享一个mapper中的二级缓存区域。mybatis是如何区分不同mapper的二级缓存区域呢？它是按照不同mapper有不同的namespace来区分的，也就是说，如果两个mapper的namespace相同，即使是两个mapper，那么这两个mapper中执行sql查询到的数据也将存在相同的二级缓存区域中。

##### 开启二级缓存

**POJO类实现Serializable接口**：

**全局配置文件**：settings中的cacheEnabled可以开启二级缓存，当前3.5.7默认开启。

```java
    <settings>
        <!--开启二级缓存-->
        <setting name="cacheEnabled" value="true"/>
        <!--驼峰命名 自动将数据库字段下划线转为驼峰-->
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
```

**mapper映射文件配置cache标签**:

```java
    <cache/>
```

cache标签属性列表

属性
说明

blocking
是否使用阻塞缓存；默认为false，当指定为true时将采用BlockingCache进行封装，blocking，阻塞的意思，使用BlockingCache会在查询缓存时锁住对应的Key，如果缓存命中了则会释放对应的锁，否则会在查询数据库以后再释放锁这样可以阻止并发情况下多个线程同时查询数据。

eviction
缓存的回收策略； LRU - 最近最少使用，移除最长时间不被使用的对象；FIFO - 先进先出，按对象进入缓存的顺序来移除它们； SOFT - 软引用，移除基于垃圾回收器状态和软引用规则的对象； WEAK - 弱引用，更积极地移除基于垃圾收集器和弱引用规则的对象； 默认的是LRU 。

readOnly
是否只读；true：只读：mybatis认为所有从缓存中获取数据的操作都是只读操作，不会修改数据。 mybatis为了加快获取数据，直接就会将数据在缓存中的引用交给用户 。不安全，速度快；false：读写(默认)：mybatis觉得获取的数据可能会被修改，mybatis会利用序列化&反序列化的技术克隆一份新的数据给你。安全，速度相对慢。

flushInterval
缓存刷新间隔；缓存多长时间清空一次，默认不清空，设置一个毫秒值。

size
缓存存放多少个元素。

type
指定自定义缓存的全类名(实现Cache接口即可) 。

##### 二级缓存相关配置

**1、** 全局setting的cacheEnable：配置二级缓存的开关，一级缓存一直是打开的；

**2、** select标签的useCache属性：配置这个select是否使用二级缓存，一级缓存一直是使用的；

**3、** sql标签的flushCache属性：增删改默认flushCache=truesql执行以后，会同时清空一级和二级缓存，查询默认flushCache=false；

**4、** sqlSession.clearCache()：只是用来清除一级缓存；

**5、** 当在某一个作用域(一级缓存Session/二级缓存Namespaces)进行了C/U/D操作后，默认该作用域下所有select中的缓存将被clear；

##### 测试

创建两个Session，第一个会话查询后关闭，第二个会话查询时，命中缓存。

#### 第三方缓存

二级缓存不足：

- 加大了内存的使用空间，如果二级缓存空间占有量过多势必会导致程序运行空间的不足
- 无法实现分布式缓存缓存的数据在自己的服务器上，假设现在有两个服务器A和B，用户访问的时候访问了A服务器，查询后的缓存就会放在A服务器上，假设现在有个用户访问的是B服务器，那么他在B服务器上就无法获取刚刚那个缓存

针对上述问题，mybatis支持和其它分布式缓存框架进行整合，例如redis、Memcached等。

**案例演示**：

**1、** 添加redis依赖，mybatis开发了mybatis-redis模块，扩展了对redis的支持，但是这个很久没更新了，一般都采用spring整合缓存这里这是简单演示，所有使用EhCache内缓存框架；

```java
        <!-- https://mvnrepository.com/artifact/net.sf.ehcache/ehcache-core -->
        <dependency>
            <groupId>net.sf.ehcache</groupId>
            <artifactId>ehcache-core</artifactId>
            <version>2.6.11</version>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.mybatis.caches/mybatis-ehcache -->
        <dependency>
            <groupId>org.mybatis.caches</groupId>
            <artifactId>mybatis-ehcache</artifactId>
            <version>1.2.1</version>
        </dependency>
```

**1、** 在src/main/resources目录下新增ehcache.xml文件；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="ehcache.xsd" updateCheck="true"
         monitoring="autodetect" dynamicConfig="true">
    <!-- 指定数据在磁盘中的存储位置 -->
    <diskStore path="D:\ehcache" />
    <!-- 缓存策略  -->
    <defaultCache
            maxElementsInMemory="1000"
            maxElementsOnDisk="10000000"
            eternal="false"
            overflowToDisk="false"
            timeToIdleSeconds="120"
            timeToLiveSeconds="120"
            diskExpiryThreadIntervalSeconds="120"
            memoryStoreEvictionPolicy="LRU">
    </defaultCache>
</ehcache>
```

**1、** mapper.xml中添加配置；

```java
    <!--配置使用二级缓存-->
    <cache type="org.mybatis.caches.ehcache.EhcacheCache"></cache>
```

**1、** 执行测试，发现SQL查询后，EhCache中已加载入当前查询数据；
