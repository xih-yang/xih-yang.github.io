# 08、Zookeeper WATCH
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-4/8.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 D）
watchManager涉及watch机制，内容较多，又要针对watch进行展开了

本节讲解

```java
Watcher相关类简介，类图说明
Watcher的意义，通知状态(keeperState)与事件类型(EventType)
WatchedEvent 和 WatcherEvent 描述zk检测到变化的事件，以及对应用于网络传输的封装类
ClientWatchManager接口以及实现类ZKWatchManager :client端完成根据Event找到需要触发的watches
WatcherSetEventPair 将Event以及对应需要触发的watches集合进行组合绑定
```

## 2.简介

UML图如下,红色线代表内部类

watcher相关类图

主要的类简介如下:

```java
Watcher，接口类型，其定义了process方法，另外定义内部类Event，再包含内部类KeeperState和EventType来描述Event发生时zk的状态以及对应event类型
WatchedEvent,代表zk上一个Watcher能够回应的变化,包含了变化事件的类型，zk状态以及变化影响的znode的path
WatcherEvent : 是WatchedEvent用于网络传输的封装类
ClientWatchManager:接口,根据Event得到需要通知的watcher
ZKWatchManager为ClientWatchManager的实现
```

下面进行源码讲解

## 3.Watcher

Watcher是什么

```java
ZK中引入Watcher机制来实现分布式的通知功能
ZK允许客户端向服务端注册一个Watcher监听，当服务点的的指定事件触发监听时，那么服务端就会向客户端发送事件通知，以便客户端完成逻辑操作（即客户端向服务端注册监听，并将watcher对象存在客户端的Watchermanager中
服务端触发事件后，向客户端发送通知，客户端收到通知后从wacherManager中取出对象来执行回调逻辑）
```

特性

```java
一次性：一旦一个watcher被触发，ZK都会将其从相应的的存储中移除，所以watcher是需要每注册一次，才可触发一次。
客户端串行执行：客户端watcher回调过程是一个串行同步的过程
轻量：watcher数据结构中只包含：通知状态、事件类型和节点路径
```

在ZooKeeper中，接口类Watcher定义了事件通知相关的逻辑，包含了KeeperState和EventType两个枚举类，分别代表通知状态和事件类型。

类图如下

Watcher类图

简单介绍上面类图就是

```java
Watcher接口拥有process函数，用于处理回调
内部类Event又包含内部类KeeperState以及EventType
KeeperState用于记录Event发生时的zk状态（通知状态）
EventType用于记录Event的类型
```

### 3.1方法process

```java
//回调函数实现该函数，表示根据event执行的行为
abstract public void process(WatchedEvent event);
```

### 3.2内部类Event

包含KeeperState和EventType两个内部类，通过枚举类实现

方法很简单，就是int值与对应枚举类型的转换

两者的枚举类型以及两者之间的关系，触发条件可以参考《paxos到zk》中的图

KeeperState与EventType一览表

## 4.WatchedEvent 和 WatcherEvent

```java
WatchedEvent :代表zk上一个Watcher能够回应的变化,包含了变化事件的类型，zk状态以及变化影响的znode的path
WatcherEvent : 是WatchedEvent用于网络传输的封装类
```

WatchedEvent 类图如下

WatchedEvent类图

三个成员变量很好的解释了WatchedEvent的意义，即事件的类型，zk状态以及变化影响的znode的path

方法基本都好理解，涉及WatcherEvent 有一个构造方法和一个getWrapper方法

这里稍微强调一下 getWrapper方法

```java
/**
 *  Convert WatchedEvent to type that can be sent over network
 */
//转化成可供网络传输，序列化的WatcherEvent
public WatcherEvent getWrapper() {
    return new WatcherEvent(eventType.getIntValue(), 
                            keeperState.getIntValue(), 
                            path);
}
}
```

WatcherEvent实现了Record接口，可以理解为WatchedEvent用于网络传输的封装类

## 5.ClientWatchManager接口和实现类ZKWatchManager

```java
ClientWatchManager接口用户根据Event得到需要通知的watcher
ZKWatchManager为ClientWatchManager的实现
```

ClientWatchManager接口只有一个函数，源码解析如下

```java
//ClientWatchManager负责根据Event得到需要通知的watcher，该manager本身并不进行通知
public Set<Watcher> materialize(Watcher.Event.KeeperState state,
    Watcher.Event.EventType type, String path);
```

默认实现类ZKWatchManager,在Zookeeper类中，源码解析如下

```java
private static class ZKWatchManager implements ClientWatchManager {
    private final Map<String, Set<Watcher>> dataWatches =
        new HashMap<String, Set<Watcher>>();//针对内容的watch
    private final Map<String, Set<Watcher>> existWatches =
        new HashMap<String, Set<Watcher>>();//针对exist API相关的watch
    private final Map<String, Set<Watcher>> childWatches =
        new HashMap<String, Set<Watcher>>();//针对getChildren API相关的watch
    private volatile Watcher defaultWatcher;//client传递的,默认的watcher实现
    final private void addTo(Set<Watcher> from, Set<Watcher> to) {
        if (from != null) {
            to.addAll(from);
        }
    }
    /* (non-Javadoc)
     * @see org.apache.zookeeper.ClientWatchManager#materialize(Event.KeeperState, 
     *                                                        Event.EventType, java.lang.String)
     */
    @Override
    public Set<Watcher> materialize(Watcher.Event.KeeperState state,
                                    Watcher.Event.EventType type,
                                    String clientPath)
    {
        Set<Watcher> result = new HashSet<Watcher>();
        switch (type) {
        case None://eventType是null
            // 则所有dataWatches,existWatches,childWatches都需要被通知,???为什么要这样干
            result.add(defaultWatcher);//添加默认watcher
            boolean clear = ClientCnxn.getDisableAutoResetWatch() &&
                    state != Watcher.Event.KeeperState.SyncConnected;//获取clear标记
            synchronized(dataWatches) {
                for(Set<Watcher> ws: dataWatches.values()) {
                    result.addAll(ws);
                }
                if (clear) {
                    dataWatches.clear();
                }
            }
            synchronized(existWatches) {
                for(Set<Watcher> ws: existWatches.values()) {
                    result.addAll(ws);
                }
                if (clear) {
                    existWatches.clear();
                }
            }
            synchronized(childWatches) {
                for(Set<Watcher> ws: childWatches.values()) {
                    result.addAll(ws);
                }
                if (clear) {
                    childWatches.clear();
                }
            }
            return result;
        case NodeDataChanged:
        case NodeCreated:
            //如果节点内容变化或者创建
            synchronized (dataWatches) {
                addTo(dataWatches.remove(clientPath), result);//从dataWatches中移除，并且添加到result中
            }
            synchronized (existWatches) {
                addTo(existWatches.remove(clientPath), result);//从existWatches中移除，并且添加到result中
            }
            break;
        case NodeChildrenChanged:
            synchronized (childWatches) {
                addTo(childWatches.remove(clientPath), result);
            }
            break;
        case NodeDeleted:
            synchronized (dataWatches) {
                addTo(dataWatches.remove(clientPath), result);
            }
            // XXX This shouldn't be needed, but just in case
            synchronized (existWatches) {
                Set<Watcher> list = existWatches.remove(clientPath);
                if (list != null) {
                    addTo(existWatches.remove(clientPath), result);
                    LOG.warn("We are triggering an exists watch for delete! Shouldn't happen!");
                }
            }
            synchronized (childWatches) {
                addTo(childWatches.remove(clientPath), result);
            }
            break;
        default://默认处理
            String msg = "Unhandled watch event type " + type
                + " with state " + state + " on path " + clientPath;
            LOG.error(msg);
            throw new RuntimeException(msg);
        }
        //返回结果
        return result;
    }
}
```

该方法在事件发生后，返回需要被通知的Watcher集合。

是根据已经注册的watches(分为三类,data,children,exist)，根据path找到对应的watches，得到一个result集合进行返回

这里留下个疑问

```java
watches的注册是在哪里完成，这个后面再讲
为什么碰到case None，所有watches都要被触发，这个目前不是很理解
```

## 6.WatcherSetEventPair

```java
WatcherSetEventPair 将Event以及对应需要触发的watches集合进行组合绑定
```

这个类在ClientCnxn中，代码很简单

```java
private static class WatcherSetEventPair {
    private final Set<Watcher> watchers;//事件触发需要被通知的watches集合
    private final WatchedEvent event;//事件
    public WatcherSetEventPair(Set<Watcher> watchers, WatchedEvent event) {
        this.watchers = watchers;
        this.event = event;
    }
}
```

## 7.思考

### Watcher.Event.KeeperState

这个可以叫成通知状态，也可以理解为事件发生时的zk状态

### watcher特性中，"一次性"在client端的体现

ZooKeeper.ZKWatchManager#materialize 中可以看到

被触发的watches从相应的类别(data,children,exist)中删除了，所以在client端是一次性的

### 为什么需要WatcherSetEventPair 这个类

因为watcher接口process函数需要event参数

那么在ClientWatchManager完成了根据event找到对应的watchers之后

就可以直接调用watcher.process(event)了

但是！！！由于ClientCnxn.EventThread是异步处理的，通过生产消费完成

在processEvent的函数中，要取出一个数据结构Object，既包含watchers集合，又要包含event，所以就把两者组合在一起出现了WatcherSetEventPair 这个类

### watcher特性中，"一次性"在server端的体现

在下面几讲WatchManager会讲

### ZooKeeper.ZKWatchManager#materialize 里面三个watches的注册是如何完成的

这一块的代码只有三个watches的remove操作

这个在watch机制中会讲

## 8.问题

### ZooKeeper.ZKWatchManager#materialize 为什么碰到case None，所有watches都要被触发

这个目前不是很理解,不知道为什么要这样设计

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
