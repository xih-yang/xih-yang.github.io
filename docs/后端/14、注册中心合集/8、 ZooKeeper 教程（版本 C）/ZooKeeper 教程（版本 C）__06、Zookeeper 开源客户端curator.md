# 06、Zookeeper 开源客户端curator
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-3/6.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 C）
## zookeeper原生api的不足

zookeeper原生api存在以下不足之处：

- 连接的创建是异步的，需要开发人员自行编码实现等待；
- 连接没有自动的超时重连机制；
- Zk本身不提供序列化机制，需要开发人员自行指定，从而实现数据的序列化和反序列化；
- Watcher注册一次只会生效一次，需要不断的重复注册；
- Watcher本身的使用方式不符合java本身的术语，如果采用监听器的方式，更容易理解；
- 不支持递归创建树形节点；

## zookeeper第三方开源客户端

zookeeper的第三方开源客户端主要有[zkClient](https://github.com/sgroschupf/zkclient)和[Curator](https://curator.apache.org/)。其中zkClient解决了session会话超时重连、Watcher反复注册等问题，提供了更加简洁的api，但zkClient社区不活跃，文档不够完善。而Curator是Apache基金会的顶级项目之一，它解决了session会话超时重连、Watcher反复注册、NodeExitsException异常等问题，Curator具有更加完善的文档，因此我们这里只学习Curator的使用。

## Curator客户端api介绍

Curator包含了如下几个包：

- **curator-framework**：对zookeeper底层api的一些封装；
- **curator-client**：提供一些客户端的操作，如重试策略等；
- **curator-recipes**：封装了一些高级特性，如Cache事件监听、选举、分布式锁、分布式计数器、分布式Barrier等

首先我们在gradle中引入curator：

```java
dependencies {
    compile ('org.apache.zookeeper:zookeeper:3.4.13')
    compile ('org.apache.curator:curator-framework:4.0.1') {
        exclude group: 'org.apache.zookeeper', module: 'zookeeper'
    }
    compile ('org.apache.curator:curator-recipes:4.0.1') {
        exclude group: 'org.apache.zookeeper', module: 'zookeeper'
    }
    compile ('org.apache.curator:curator-client:4.0.1') {
        exclude group: 'org.apache.zookeeper', module: 'zookeeper'
    }
}
```

> Note: 为什么要exclude zookeeper模块请参考文档ZooKeeper Version Compatibility

curator提供了一种类似jdk8中stream一样的流式操作。

### 创建zookeeper会话

`Curator`中`org.apache.curator.framework.CuratorFrameworkFactory`类提供了如下两个创建zookeeper会话的方法：

```java
public static CuratorFramework newClient(String connectString, RetryPolicy retryPolicy)
public static CuratorFramework newClient(String connectString, int sessionTimeoutMs, int connectionTimeoutMs, RetryPolicy retryPolicy)
```

该方法返回一个`org.apache.curator.framework.CuratorFramework`类型的对象，参数说明如下：

- **connectString**：逗号分开的ip:port对；
- **sessionTimeoutMs**：会话超时时间，单位为毫秒，默认是60000ms，指连接建立完后多久没有收到心跳检测，超过该时间即为会话超时；
- **connectionTimeoutMs**：连接创建超时时间，单位为毫秒，默认是15000ms，指客户端与服务端建立连接时多长时间没连接上就算超时；
- **retryPolicy**：重试策略，retryPolicy的类型定义如下

```java
   /**
    * Abstracts the policy to use when retrying connections
    */
    public interface RetryPolicy
    {
         /**
         * Called when an operation has failed for some reason. This method should return
         * true to make another attempt.
         *
           *
          * @param retryCount the number of times retried so far (0 the first time)，第几次重试
          * @param elapsedTimeMs the elapsed time in ms since the operation was attempted，到当前重试时刻总的重试时间
          * @param sleeper use this to sleep - DO NOT call Thread.sleep，重试策略
          * @return true/false
          */
          public boolean      allowRetry(int retryCount, long elapsedTimeMs, RetrySleeper sleeper);
}
```

`allowRetry`返回true继续重试，返回false不再重试

可以通过实现该接口来自定义策略，curator已经为我们提供了若干重试策略：

- **ExponentialBackoffRetry**：该重试策略随着重试次数的增加，sleep的时间呈指数增长，该提供了两个构造方法

```java
public ExponentialBackoffRetry(int baseSleepTimeMs, int maxRetries)
public ExponentialBackoffRetry(int baseSleepTimeMs, int maxRetries, int maxSleepMs)
```

第`retryCount`次重试的sleep时间计算方式为：`baseSleepTimeMs * Math.max(1, random.nextInt(1  Note: NodeCache只会缓存节点本身的数据和状态，并不会缓存节点下的子节点信息，所以如果我们在节点下创建子节点，NodeCache中的Listener是不会得到通知的*

### curator中的PathChildrenCache

`PathChildrenCache`会将指定路径节点下的所有子节点缓存在本地，但不会缓存节点本身的信息，当执行新增(*CHILD_ADDED*)、删除(*CHILD_REMOVED*)、更新(*CHILD_UPDATED*)指定节点下的子节点等操作时，`PathChildrenCache`中的Listener将会得到通知，`PathChildrenCache`提供了如下几个构造函数：

```java
public PathChildrenCache(CuratorFramework client, String path, boolean cacheData)
public PathChildrenCache(CuratorFramework client, String path, boolean cacheData, ThreadFactory threadFactory)
public PathChildrenCache(CuratorFramework client, String path, boolean cacheData, boolean dataIsCompressed, ThreadFactory threadFactory)
public PathChildrenCache(CuratorFramework client, String path, boolean cacheData, boolean dataIsCompressed, final ExecutorService executorService)
public PathChildrenCache(CuratorFramework client, String path, boolean cacheData, boolean dataIsCompressed, final CloseableExecutorService executorService)
```

参数说明：

- **client**：curator客户端；
- **path**：缓存的节点路径；
- **cacheData**：除了缓存节点状态外是否缓存节点数据，如果为true，那么客户端在接收到节点列表变更的同时，也能够获取到节点的数据内容，如果为false，则无法获取到数据内容；
- **threadFactory**：线程池工厂，当内部需要开启新的线程执行时，使用该线程池工厂来创建线程；
- **dataIsCompressed**：是否压缩节点数据；
- **executorService**：线程池；

`PathChildrenCache`通过`start`方法可以传入三种启动模式，这三种启动模式定义在`org.apache.curator.framework.recipes.cache.PathChildrenCache.StartMode`中：

- **NORMAL**：异步初始化cache；
- **BUILD_INITIAL_CACHE**：同步初始化cache，以及创建cache后，就从服务器拉取对应的数据；
- **POST_INITIALIZED_EVENT**：异步初始化cache，初始化完成触发PathChildrenCacheEvent.Type#INITIALIZED事件，cache中Listener会收到该事件的通知；

`PathChildrenCache`示例代码如下：

```java
PathChildrenCache pathChildrenCache = new PathChildrenCache(client, "/curatorTest", true);
// startMode为BUILD_INITIAL_CACHE，cache是初始化完成会发送INITIALIZED事件
pathChildrenCache.start(PathChildrenCache.StartMode.BUILD_INITIAL_CACHE);
System.out.println(pathChildrenCache.getCurrentData().size());
pathChildrenCache.getListenable().addListener(((client1, event) -> {
    ChildData data = event.getData();
    switch (event.getType()) {
        case INITIALIZED:
            System.out.println("子节点cache初始化完成(StartMode为POST_INITIALIZED_EVENT的情况)");
            System.out.println("INITIALIZED: " + pathChildrenCache.getCurrentData().size());
            break;
        case CHILD_ADDED:
            System.out.println("添加子节点，path=" + data.getPath() + ", data=" + new String(data.getData()));
            break;
        case CHILD_UPDATED:
            System.out.println("更新子节点，path=" + data.getPath() + ", data=" + new String(data.getData()));
            break;
        case CHILD_REMOVED:
            System.out.println("删除子节点，path=" + data.getPath());
            break;
        default:
            System.out.println(event.getType());
    }
}));
```

## curator完整示例代码

如下所示为演示curator使用的完整示例代码：

```java
package com.ctrip.flight.test.zookeeper;
import org.apache.curator.RetryPolicy;
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.framework.recipes.cache.ChildData;
import org.apache.curator.framework.recipes.cache.NodeCache;
import org.apache.curator.framework.recipes.cache.PathChildrenCache;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.ZooDefs;
import org.apache.zookeeper.data.Stat;
import java.util.List;
public class CuratorTest {
    public static void main(String[] args) throws Exception {
        RetryPolicy retryPolicy = new ExponentialBackoffRetry(3000, 5);
        CuratorFramework client =  CuratorFrameworkFactory.builder()
                .connectString("192.168.0.104:2181,192.168.0.104:2182,192.168.0.104:2183")
                .sessionTimeoutMs(30000).connectionTimeoutMs(15000)
                .retryPolicy(retryPolicy)
                //.namespace("curatorTest")
                .build();
        client.start();
        // 判断节点是否存在，存在则先删除节点
        Stat test1Stat = client.checkExists().forPath("/curatorTest/test1");
        if (null != test1Stat) {
            client.delete().guaranteed().deletingChildrenIfNeeded().withVersion(-1).forPath("/curatorTest/test1");
        }
        // 创建节点
        String test1Data = client.create()
                .creatingParentsIfNeeded()
                .withMode(CreateMode.PERSISTENT)
                .withACL(ZooDefs.Ids.OPEN_ACL_UNSAFE)
                .forPath("/curatorTest/test1", "test1DataV1".getBytes());
        // 获取节点信息
        test1Stat = new Stat();
        byte[] test1DataBytes = client.getData().storingStatIn(test1Stat).forPath("/curatorTest/test1");
        System.out.println("test1 stat: " + test1Stat);
        System.out.println("test1 data: " + new String(test1DataBytes));
        // 更新节点数据
        test1Stat = client.setData()
                .withVersion(-1)
                .forPath("/curatorTest/test1", "test1DataV2".getBytes());
        System.out.println("test1 stat: " + test1Stat);
        // 获取所有子节点
        Stat childStat = new Stat();
        List<String> childs = client.getChildren().storingStatIn(childStat).forPath("/curatorTest");
        System.out.println("curatorTest childs: " + childs);
//        client.delete()
//                .guaranteed()
//                .withVersion(-1)
//                .inBackground(((client1, event) -> {
//                    System.out.println(event.getPath() + ", data=" + event.getData());
//                    System.out.println("event type=" + event.getType());
//                    System.out.println("event code=" + event.getResultCode());
//                }))
//                .forPath("/curatorTest/test1");
        // 缓存节点
        NodeCache nodeCache = new NodeCache(client, "/curatorTest/test1");
        nodeCache.start(true);
        nodeCache.getListenable().addListener(() -> {
            System.out.println("NodeCache:");
            ChildData childData = nodeCache.getCurrentData();
            if (null != childData) {
                System.out.println("path=" + childData.getPath() + ", data=" + new String(childData.getData()) + ";");
            }
        });
        // 缓存子节点
        PathChildrenCache pathChildrenCache = new PathChildrenCache(client, "/curatorTest", true);
        // startMode为BUILD_INITIAL_CACHE，cache是初始化完成会发送INITIALIZED事件
        pathChildrenCache.start(PathChildrenCache.StartMode.BUILD_INITIAL_CACHE);
        System.out.println(pathChildrenCache.getCurrentData().size());
        pathChildrenCache.getListenable().addListener(((client1, event) -> {
            ChildData data = event.getData();
            switch (event.getType()) {
                case INITIALIZED:
                    System.out.println("子节点cache初始化完成(StartMode为POST_INITIALIZED_EVENT的情况)");
                    System.out.println("INITIALIZED: " + pathChildrenCache.getCurrentData().size());
                    break;
                case CHILD_ADDED:
                    System.out.println("添加子节点，path=" + data.getPath() + ", data=" + new String(data.getData()));
                    break;
                case CHILD_UPDATED:
                    System.out.println("更新子节点，path=" + data.getPath() + ", data=" + new String(data.getData()));
                    break;
                case CHILD_REMOVED:
                    System.out.println("删除子节点，path=" + data.getPath());
                    break;
                default:
                    System.out.println(event.getType());
            }
        }));
        Thread.sleep(20000000);
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
