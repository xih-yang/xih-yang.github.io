# 21、MyBatis速成 - 缓存原理下
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/21.html
- 分类：ORM框架
- 分组：教程目录
MyBatis的二级缓存是Application级别的缓存，它可以提高对数据库查询的效率，以提高应用的性能。本文将全面分析MyBatis的二级缓存的设计原理。

## 1.MyBatis的缓存机制整体设计以及二级缓存的工作模式

如上图所示，当开一个会话时，一个SqlSession对象会使用一个Executor对象来完成会话操作，MyBatis的二级缓存机制的关键就是对这个Executor对象做文章。如果用户配置了”cacheEnabled=true”，那么MyBatis在为SqlSession对象创建Executor对象时，会对Executor对象加上一个装饰者：CachingExecutor，这时SqlSession使用CachingExecutor对象来完成操作请求。

CachingExecutor对于查询请求，会先判断该查询请求在Application级别的二级缓存中是否有缓存结果，如果有查询结果，则直接返回缓存结果；如果缓存中没有，再交给真正的Executor对象来完成查询操作，之后CachingExecutor会将真正Executor返回的查询结果放置到缓存中，然后在返回给用户。

CachingExecutor是Executor的装饰者，以增强Executor的功能，使其具有缓存查询的功能，这里用到了设计模式中的装饰者模式，CachingExecutor和Executor的接口的关系如下类图所示：

## 2. MyBatis二级缓存的划分

MyBatis并不是简单地对整个Application就只有一个Cache缓存对象，它将缓存划分的更细，即是Mapper级别的，即每一个Mapper都可以拥有一个Cache对象，具体如下：

```java
1.为每一个Mapper分配一个Cache缓存对象（使用`<cache>`节点配置）；
2.多个Mapper共用一个Cache缓存对象（使用`<cache-ref>`节点配置）；
```

**1、** 为每一个Mapper分配一个Cache缓存对象（使用``节点配置）；

MyBatis将Application级别的二级缓存细分到Mapper级别，即对于每一个Mapper.xml,如果在其中使用了`` 节点，则MyBatis会为这个Mapper创建一个Cache缓存对象，如下图所示：

注：上述的每一个Cache对象，都会有一个自己所属的namespace命名空间，并且会将Mapper的 namespace作为它们的ID；

**2、** 多个Mapper共用一个Cache缓存对象（使用``节点配置）；

如果你想让多个Mapper公用一个Cache的话，你可以使用``节点，来指定你的这个Mapper使用到了哪一个Mapper的Cache缓存。

## 3.使用二级缓存，必须要具备的条件

MyBatis对二级缓存的支持粒度很细，它会指定某一条查询语句是否使用二级缓存。

虽然在Mapper中配置了``,并且为此Mapper分配了Cache对象，这并不表示我们使用Mapper中定义的查询语句查到的结果都会放置到Cache对象之中，我们必须指定Mapper中的某条选择语句是否支持缓存，即如下所示，在`` 节点中配置useCache=”true”，Mapper才会对此Select的查询支持缓存特性，否则，不会对此Select查询，不会经过Cache缓存。如下所示，Select语句配置了useCache=”true”，则表明这条Select语句的查询会使用二级缓存。

```xml
<select id="selectByMinSalary" resultMap="BaseResultMap" parameterType="java.util.Map" useCache="true">  
```

总之，要想使某条Select查询支持二级缓存，你需要保证：

```java
1.MyBatis支持二级缓存的总开关：全局配置变量参数   cacheEnabled=true
2.该select语句所在的Mapper，配置了`<cache>` 或`<cached-ref>`节点，并且有效
3.该select语句的参数 useCache=true
```

## 4.一级缓存和二级缓存的使用顺序

请注意，如果你的MyBatis使用了二级缓存，并且你的Mapper和select语句也配置使用了二级缓存，那么在执行select查询的时候，MyBatis会先从二级缓存中取输入，其次才是一级缓存，即MyBatis查询数据的顺序是：

**二级缓存 ———> 一级缓存——> 数据库**

## 5.二级缓存实现的选择

MyBatis对二级缓存的设计非常灵活，它自己内部实现了一系列的Cache缓存实现类，并提供了各种缓存刷新策略如LRU，FIFO等等；另外，MyBatis还允许用户自定义Cache接口实现，用户是需要实现org.apache.ibatis.cache.Cache接口，然后将Cache实现类配置在``节点的type属性上即可；除此之外，MyBatis还支持跟第三方内存缓存库如Memecached的集成，总之，使用MyBatis的二级缓存有三个选择:

```java
1.MyBatis自身提供的缓存实现；
2.用户自定义的Cache接口实现；
3.跟第三方内存缓存库的集成；
```

## 6.MyBatis自身提供的二级缓存的实现

MyBatis自身提供了丰富的，并且功能强大的二级缓存的实现，它拥有一系列的Cache接口装饰者，可以满足各种对缓存操作和更新的策略。

MyBatis定义了大量的Cache的装饰器来增强Cache缓存的功能，如下类图所示。

对于每个Cache而言，都有一个容量限制，MyBatis各供了各种策略来对Cache缓存的容量进行控制，以及对Cache中的数据进行刷新和置换。MyBatis主要提供了以下几个刷新和置换策略：

LRU：（Least Recently Used）,最近最少使用算法，即如果缓存中容量已经满了，会将缓存中最近做少被使用的缓存记录清除掉，然后添加新的记录；

FIFO：（First in first out）,先进先出算法，如果缓存中的容量已经满了，那么会将最先进入缓存中的数据清除掉；

Scheduled：指定时间间隔清空算法，该算法会以指定的某一个时间间隔将Cache缓存中的数据清空；

## 7.写在后面（关于涉及到的设计模式）

在二级缓存的设计上，MyBatis大量地运用了装饰者模式，如CachingExecutor, 以及各种Cache接口的装饰器。关于装饰者模式，读者可以阅读相关资料参考。

本文转自：[《深入理解mybatis原理》 MyBatis的二级缓存的设计原理](http://blog.csdn.net/luanlouis/article/details/41408341)
