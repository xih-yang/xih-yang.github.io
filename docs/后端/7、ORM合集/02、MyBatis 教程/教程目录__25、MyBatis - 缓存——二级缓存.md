# 25、MyBatis - 缓存——二级缓存
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/25.html
- 分类：ORM框架
- 分组：教程目录
上一篇我们学习了一级缓存，这次我们来学习二级缓存。

## 一、什么是二级缓存

二级缓存也叫全局缓存，是namespace级别的缓存，每一个命名空间对应一个二级缓存。

## 二、二级缓存的工作机制

**1、** 每个SqlSession对应一个一级缓存；

**2、** 当SqlSession关闭时，对应的一级缓存就会消失，但是如果我们开启了二级缓存，一级缓存的内容就会在会话关闭时存入对应的二级缓存中；

**3、** 此时新的SqlSession会话就可以从二级缓存中获取内容；

## 三、二级缓存的具体应用

**1、** mybatis-config.xml核心文件配置；

```xml
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>
```

这个配置不是必要的，因为官方文档中说明这个配置是默认开启的。

设置名
描述
有效值
默认值

cacheEnabled
全局性地开启或关闭所有映射器配置文件中已配置的任何缓存。
true | false
true

**2、** Mapper.xml配置；

```xml
<cache eviction="FIFO"
        flushInterval="60000"
        size="512"
        readOnly="true"/>
```

这是官方给出的一个二级缓存的例子，这个更高级的配置创建了一个 FIFO 缓存，每隔 60 秒刷新，最多可以存储结果对象或列表的 512 个引用，而且返回的对象被认为是只读的，因此对它们进行修改可能会在不同线程中的调用者产生冲突。

可用的清除策略有：

- LRU – 最近最少使用：移除最长时间不被使用的对象。
- FIFO – 先进先出：按对象进入缓存的顺序来移除它们。
- SOFT – 软引用：基于垃圾回收器状态和软引用规则移除对象。
- WEAK – 弱引用：更积极地基于垃圾收集器状态和弱引用规则移除对象。

默认的清除策略是 LRU。

flushInterval（刷新间隔）属性可以被设置为任意的正整数，设置的值应该是一个以毫秒为单位的合理时间量。 默认情况是不设置，也就是没有刷新间隔，缓存仅仅会在调用语句时刷新。

size（引用数目）属性可以被设置为任意正整数，要注意欲缓存对象的大小和运行环境中可用的内存资源。默认值是 1024。

readOnly（只读）属性可以被设置为 true 或 false。只读的缓存会给所有调用者返回缓存对象的相同实例。 因此这些对象不能被修改。这就提供了可观的性能提升。而可读写的缓存会（通过序列化）返回缓存对象的拷贝。 速度上会慢一些，但是更安全，因此默认值是 false。

**3、** 测试；

```java
@Test
public void getUserById() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    User user = userMapper.getUserById(10001);
    System.out.println(user);
    sqlSession.close();
    System.out.println("=========================================");
    SqlSession sqlSession2 = MyBatisUtil.getSqlSession();
    UserMapper userMapper2 = sqlSession2.getMapper(UserMapper.class);
    User user2 = userMapper2.getUserById(10001);
    System.out.println(user2);
    sqlSession2.close();
}
```

测试结果如下：

可以看见第二次查询并没有操作数据库。

当然我们也可以直接使用最简单的二级缓存配置：

```xml
<cache/>
```

此时我们去测试，结果报错：

报的错误是User类没有序列化，那么为什么会出现这个问题呢?

官方文档有这样一句说明：

**readOnly（只读）属性可以被设置为 true 或 false。只读的缓存会给所有调用者返回缓存对象的相同实例。 因此这些对象不能被修改。这就提供了可观的性能提升。而可读写的缓存会（通过序列化）返回缓存对象的拷贝。 速度上会慢一些，但是更安全，因此默认值是 false。**

所以我们需要让JavaBean序列化，也就是实现Serializable接口。

我们去实现Serializable接口：

```java
public class User implements Serializable {}
```

此时再次测试：

没有问题。
