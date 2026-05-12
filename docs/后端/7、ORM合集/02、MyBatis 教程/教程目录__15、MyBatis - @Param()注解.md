# 15、MyBatis - @Param()注解
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/15.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是@Param()注解

我们来举个简单的例子，拿我们上一篇中查找的例子来说。

先看原来的代码：

```java
@Select("select * from user where id=#{id}")
User getUserByID(int id);
```

很明显，这是一句根据id来进行查找的方法，我们去具体的测试一下：

测试通过没有问题。

那么我们来加上@Param()注解，代码如下：

```java
//查
@Select("select * from user where id=#{id}")
User getUserByID(@Param("uid") int id);
```

此时，我们再去测试一下看看结果：

报错了，她说“id”没有找到，可用参数为“uid”，那么问题显而易见了，我们应该将SQL语句中的#{id}改为#{uid}，也就是注解中的名字，如下：

```java
//查
@Select("select * from user where id=#{uid}")
User getUserByID(@Param("uid") int id);
```

此时再去测试查看结果：

这次就查找成功了。

那么问题就来了，明明我们不用注解也能能够执行，为什么要注解呢？

嗯，没错，我们这里是单个基本类型的确不需要@Param()注解就能运行，那么其他更加复杂的情况呢，比如说，多个基本类型？引用类型？

下面我们就来深入探讨一下@Param()究竟该怎么用。

## 二、@Param()的使用

我们还是先开始实验。

我们将代码修改为不止一个参数：

对于传递多个参数我们前面已经提及了两种方法，一种是利用JavaBean，另一种是用Map，那么有没有考虑过不使用这两种方法直接传参可不可行呢?看下面的代码：

```java
//查
@Select("select * from user where id=#{id} and username=#{username}")
User getUserByID(int id, String username);
```

这里我们直接传递两个参数，进行测试：

很遗憾地报错了，很明显这种方法是行不通的，那么我们去加上@Param()注释试一下，代码修改为以下内容：

```java
//查
@Select("select * from user where id=#{id} and username=#{username}")
User getUserByID(@Param("id") int id, @Param("username") String username);
```

进行测试：

嗯？竟然奇迹般地跑通了。

以上都是举得直接在接口中注解SQL语句的例子，在Mapper.xml文件中@Param()同样使用，只需要注意的是，使用@Param()注解，**parameterType**属性就不用再设置了。

## 三、总结

简单总结一下：

**1、** 传入单个基本类型或String类型的时候，使用不使用@Param()注解都可以；

**2、** 需要传入多个参数时，有三种方法：JavaBean、@Param()注解、Map个人认为优先使用JavaBean，当需要传入的数据较多但又不能完全将JavaBean利用起来的时候使用@Param()注解或Map；

**3、** 单个基本类型，SQL对应的就是传入参数的名字；使用JavaBean，SQL中对应的就是JavaBean在结果集映射的属性（没有显性映射就是默认的属性）；使用@Param()，SQL中对应的就是@Param()注解中的名字；使用Map，SQL中对应的就是Map的键名；

**4、** 使用@Param()注解的时候，Mapper.xml文件无需再设置**parameterType**属性；
