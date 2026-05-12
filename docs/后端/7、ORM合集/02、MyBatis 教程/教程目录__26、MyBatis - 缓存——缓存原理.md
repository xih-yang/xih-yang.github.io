# 26、MyBatis - 缓存——缓存原理
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/26.html
- 分类：ORM框架
- 分组：教程目录
首先来思考一下，在开启了二级缓存的情况下，一个用户查询数据经历的过程是什么样的。

我们看一下，下面这张图：

用户先去二级缓存中去寻找数据，如果找不到再去一级缓存寻找数据，如果还是找不到那么去数据库中进行查询。

我么具体来看一下：

```java
@Test
public void getUserById() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    User user = userMapper.getUserById(10001);
    System.out.println(user);
    sqlSession.close();
    System.out.println("=========================================");
    SqlSession sqlSession1 = MyBatisUtil.getSqlSession();
    UserMapper userMapper1 = sqlSession1.getMapper(UserMapper.class);
    User user1 = userMapper1.getUserById(10001);
    System.out.println(user1);
    sqlSession1.close();
    System.out.println("=========================================");
    SqlSession sqlSession2 = MyBatisUtil.getSqlSession();
    UserMapper userMapper2 = sqlSession2.getMapper(UserMapper.class);
    User user2 = userMapper2.getUserById(10003);
    System.out.println(user2);
    System.out.println("=========================================");
    User user3 = userMapper2.getUserById(10003);
    System.out.println(user3);
    sqlSession2.close();
}
```

第一次查询由于二级缓存和一级缓存中都没有，所以要进数据库查询；第二次查询与第一次查询的数据相同，但不在同一个SqlSession中，并且第一次的SqlSession已经关闭，所以这次查询直接从二级缓存中找到数据；第三次查询与前两次查询都不同，所以二级缓存一级缓存都找不到数据，需要进数据库查询；第四次查询与第三次查询相同，并且在同一个SqlSession中，所以二级缓存没有需要的数据，在一级缓存中找到数据。

所以以上测试应该是只需要第一第三访问两次数据库，第二次是从二级缓存获取，第四次是从一级缓存获取。

测试结果：

没有问题。
