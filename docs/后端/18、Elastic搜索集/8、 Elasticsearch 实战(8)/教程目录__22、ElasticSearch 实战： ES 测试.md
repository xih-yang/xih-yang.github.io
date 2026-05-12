# 22、ElasticSearch 实战： ES 测试
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/22.html
- 分类：搜索引擎
- 分组：教程目录
Elasticsearch 还提供了一个 jar 文件，用于测试 Elasticsearch 相关的代码

我们可以将它添加到任何 Java IDE 中，接着使用 Elasticsearch 提供的框架的进行一系列的测试，例如

**1、** 单元测试；

**2、** 集成测试；

**3、** 随机测试；

开始测试前，我们需要将 Elasticsearch 测试依赖项添加到我们的程序中

如果你使用 maven 来管理项目，那么可以在 pom.xml 中添加以下内容

```java
<dependency>
    <groupId>org.elasticsearch</groupId>
    <artifactId>elasticsearch</artifactId>
    <version>6.3.0</version>
</dependency>
```

接着初始化 EsSetup，然后就可以用它来启动启动和停止 Elasticsearch 节点并创建索引

```java
EsSetup esSetup = new EsSetup();
```

最后可以调用 esSetup.execute() 方法并传递 createIndex 参数和其它配置、类型、数据等参数来创建索引

## 单元测试

可以使用 JUnit 和 Elasticsearch 测试框架来运行单元测试

使用Elasticsearch 类创建节点和索引，并且可以使用 ESTestCase和 ESTokenStreamTestCase 类来执行测试

## 集成测试

集成测试需要使用 ESIntegTestCase 类，而且可以使用集群中的多个节点

Elasticsearch 提供了大量的方法用于集成测试

方法
说明

refresh()
重新更新集群中的所有索引

ensureGreen()
确保集群处于健康的运行状态

ensureYellow()
确保集群处于亚健康的黄色运行状态

createIndex(name)
使用传递的参数 name 创建一个索引，该索引使用默认配置

flush()
更新集群中的所有索引

flushAndRefresh()
顺序调用 flush() 和 refresh() 方法

indexExists(name)
判断 name 索引是否存在

clusterService()
返回集群服务 Java 类

cluster()
返回集群测试类

### 提供的用于测试集群的方法

方法
说明

ensureAtLeastNumNodes(n)
确保集群中的节点数量的最小值大于等于参数 n

ensureAtMostNumNodes(n)
确保集群中节点数量的最大值是否小于等于参数 n

stopRandomNode()
随机停止集群中的某个节点

stopCurrentMasterNode()
停止当前主节点

stopRandomNonMaster()
随机停止集群中不是主节点的其它节点

buildNode()
创建一个新的节点

startNode(settings)
使用配置 settings 开始一个新的节点

nodeSettings()
可以重写该方法来更改节点配置

### 提供的用于访问客户端的方法

客户端用于访问群集中的不同节点并执行某些操作

可以用ESIntegTestCase.client() 方法随机获取一个客户端

Elasticsearch 还提供了访问客户端的其它方法，可以使用 ESIntegTestCase.internalCluster() 方法的返回值来调用这些方法

方法
说明

iterator()
用于迭代访问所有的可用客户端

masterClient()
返回一个可以跟主节点进行通讯的客户端

nonMasterClient()
返回一个不可以跟主节点进行通讯的客户端

clientNodeClient()
返回客户端节点中的当前客户端

## 随机测试

如果需要测试用户的代码和每个可能的数据，以便将来使用任何类型的数据都不会失败，那么随机数据是执行此测试的最佳选择

### 生成随机数据

这种测试方法中，可以使用 RandomizedTest 的实例来实例化一个Random 类的对象，然后通过该对象上的不同方法来获取不同类型的数据

方法
返回值

getRandom()
随机返回一个类的实例

randomBoolean()
随机返回一个布尔值 ( boolean )

randomByte()
随机返回一个字节数据 ( byte )

randomShort()
随机返回一个短整数 ( short )

randomInt()
随机返回一个整形 ( integer )

randomLong()
随机返回一个长整型 ( long )

randomFloat()
随机返回一个浮点数 ( float )

randomDouble()
随机返回一个双精度浮点数 ( double )

randomLocale()
随机返回一个地区 ( locale )

randomTimeZone()
随机返回一个时区 ( time zone )

randomFrom()
随机返回数组中的一个元素

## 断言 ( Assertions)

ElasticsearchAssertions 和 ElasticsearchGeoAssertions 类包含一些可以在测试时进行常见检查的断言

例如

```java
SearchResponse seearchResponse = client().prepareSearch();
assertHitCount(searchResponse, 6);
assertFirstHit(searchResponse, hasId("6"));
assertSearchHits(searchResponse, "1", "2", "3", "4",”5”,”6”);
```
