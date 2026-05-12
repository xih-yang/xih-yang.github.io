# 24、MyBatis - 缓存——一级缓存
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/24.html
- 分类：ORM框架
- 分组：教程目录
MyBatis的缓存分为一级缓存和二级缓存。

先看一下MyBatis官方文档给出的说明：

**MyBatis 内置了一个强大的事务性查询缓存机制，它可以非常方便地配置和定制。 为了使它更加强大而且易于配置，我们对 MyBatis 3 中的缓存实现进行了许多改进。**

**默认情况下，只启用了本地的会话缓存，它仅仅对一个会话中的数据进行缓存。 要启用全局的二级缓存，只需要在你的 SQL 映射文件中添加一行：**

```xml
<cache/>
```

**基本上就是这样。这个简单语句的效果如下:**

- **映射语句文件中的所有 select 语句的结果将会被缓存。**
- **映射语句文件中的所有 insert、update 和 delete 语句会刷新缓存。**
- **缓存会使用最近最少使用算法（LRU, Least Recently Used）算法来清除不需要的缓存。**
- **缓存不会定时进行刷新（也就是说，没有刷新间隔）。**
- **缓存会保存列表或对象（无论查询方法返回哪种）的 1024 个引用。**
- **缓存会被视为读/写缓存，这意味着获取到的对象并不是共享的，可以安全地被调用者修改，而不干扰其他调用者或线程所做的潜在修改。**

这里我们来学习一级缓存。

一级缓存也叫本地缓存，是在一次SqlSession会话中产生的缓存，在一次SqlSession会话中查询到的数据存入缓存中，再次执行相同的查询就不需要再从数据库获取数据，而是直接从本地获取。

下面我们用一个实例来说明：

UserMapper接口：

```java
package com.jms.dao;
import com.jms.pojo.User;
public interface UserMapper {
    User getUserById(int id);
}
```

UserMapper.xml：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.jms.dao.UserMapper">
    <select id="getUserById" parameterType="_int" resultType="User">
        select * from mybaties.user where id=#{id}
    </select>
</mapper>
```

测试：

```java
@Test
public void getUserById() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    User user = userMapper.getUserById(10001);
    System.out.println(user);
    System.out.println("=========================================");
    User user2 = userMapper.getUserById(10001);
    System.out.println(user2);
    sqlSession.close();
}
```

测试结果：

可以看见只有第一次查询进入了数据库进行查询，第二次获取相同数据则没有进入数据库查询，是因为它直接从缓存中获取了数据。

明白了一级缓存的使用，那么什么情况下一级缓存会失效呢？

**1、** 不同的SqlSession一级缓存只在一次SqlSession中生效，不同的SqlSession中相同的查询也无法从缓存中获取；

**2、** 执行增删改语句后，会刷新缓存增删改有改变数据的可能，缓存的刷新是必然的；

**3、** 使用清除缓存的命令；

```java
SqlSession.clearCache();
```

```java
@Test
public void getUserById() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    User user = userMapper.getUserById(10001);
    System.out.println(user);
    sqlSession.clearCache();
    System.out.println("=========================================");
    User user2 = userMapper.getUserById(10001);
    System.out.println(user2);
    sqlSession.close();
}
```

使用清除缓存的语句后，即便查询相同数据也需要再次查询数据库。

（本人仅作个人学习记录用，如有纰漏敬请指正）
