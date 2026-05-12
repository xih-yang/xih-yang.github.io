# 16、Zookeeper 源码解析 - Watcher监听实现原理及关键源码解析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/16.html
- 分类：注册中心
- 分组：教程目录
## 1. 基于树形结构的触发事件

前面两篇已经分析过了`ZK`的数据结构及日志归档问题，在前面两篇的基础上，再分析一下基于`ZK`树形结构实现的监听通知机制。在`ZK`的数据结构对象`DataTree`中，有两个`WatchManager`类型的对象，分别是`dataWatches`和`childWatches`，那么这两个不同的对象具体有什么不同呢？

要回答这个问题，先看一下两张表格：

客户端向服务器主动注册监听器操作表

名称
客户端方法
服务端方法
额外操作

查询节点是否存在
exists()
statNode()
服务端添加监听到dataWatches，客户端添加监听到existWatches

获取节点数据
getData()
getData()
服务端添加监听到dataWatches，客户端添加监听到dataWatches

获取子节点信息
getChildren()
getChildren()
服务端添加监听到childWatches，客户端添加监听到childWatches

传输客户端本地所有监听器
连接服务端后调用
setWatches()
将客户端的existWatches、到dataWatches和childWatches监听路径发送给服务端

服务端主动发布事件表

名称
客户端方法
服务端方法
事件类型(EventType)
触发对象

创建节点
create()
createNode()
触发NodeCreated
dataWatches、childWatches

删除节点
delete()
deleteNode()
触发NodeDeleted
dataWatches、childWatches

更新节点数据
setData()
setData()
触发NodeDataChanged
dataWatches

先对上面两个表的数据做个总结：

**1、** 客户端调用`exists()`和`getData()`方法，服务器端接收到需要监听的请求后将会把路径和监听对象交给`dataWatches`管理；

**2、** 客户端调用`getChildren()`方法，服务器端接收到需要监听的请求后会把路径和监听对象交给`childWatches`管理；

**3、** 当服务端的`A`路径节点触发了`NodeCreated`、`NodeDeleted`、`NodeDataChanged`三种操作的任意一种，`dataWatches`将会删除`A`路径节点，并执行监听器；而`childWatches`只会响应`NodeCreated`、`NodeDeleted`两种操作，如果是`A`节点新增或删除，则`childWatches`会将`A`节点的父节点删除，并执行监听器；

将第三点化简，如果`DataTree`的节点发生如下操作时，将会触发事件如下：

- 新增节点NodeCreated：如果有父节点，则会收到子节点操作通知，且本节点如果监听的话将会收到通知；
- 节点删除NodeDeleted：如果有父节点，则会收到子节点操作通知，且本节点如果监听的话将会收到通知；
- 更新节点数据NodeDataChanged：如果本节点监听了，本节点才会收到操作通知。

简而言之，`dataWatches`管理的是触发节点本身，而`childWatches`管理的则是触发节点的父节点。

**注：** 触发的事件`KeeperState`一定是`SyncConnected`已连接状态，要区分清`KeeperState`和`EventType`

## 2. 监听实现原理

### 2.1 监听流程

`ZK`的完成监听流程分四步：

**1、**`ZK`客户端在调用`exists()`、`getData()`和`getChildren()`三个方法的时候，如果传了`Watcher`对象，客户端将会把这个对象和对应的路径保存在本地；

**2、**`ZK`服务端接收到了客户端的监听请求后，在`dataWatches`或`childWatches`中添加路径和对应的监听器；

**3、** 服务端数据结构树发生了新增节点、删除节点和更新数据节点三种操作后，将会在对应的节点触发相应的事件类型，再将监听对象删除最后再给监听本节点的客户端发送`tag=notification`的响应；

**4、** 客户端接收到服务端发送过来的`notification`响应后，将会从客户端本地缓存的`路径-监听对象`映射关系`map`中把监听对象取出来，再调用`Watcher`对象的`process()`方法，完成回调；

接下来主要分析一下这四个流程中隐藏的一些细节。

#### 2.1.1 客户端发起监听操作

假设客户端调用了`exists()`方法，并传入了监听对象，流程如下：

在流程中需要注意以下几点：

**1、** 如果监听对象不为空，则会直接创建对应的监听注册对象`WatchRegistration`，这个对象将会决定把监听器`Watcher`存放在哪个映射表中；

**2、** 看过`ZK`源码的就能知道，`ZK`客户端发送给服务端的数据包对象则是`Packet`，里面会保存监听注册对象；

**3、** 第`3`步和第`4`步与`ZK`服务端交互是异步的，当客户端接收到服务端处理成功的响应后，将会调用`Packet`数据包中监听注册对象`WatchRegistration`的注册方法，把监听器`Watcher`注册到对应的映射表中；

不同操作所对应的实际监听注册对象表

操作方法
监听注册对象
存放的监听映射表

exists()
ExistsWatchRegistration
正常返回存放在dataWatches，有错误存放在existWatches

getData()
DataWatchRegistration
dataWatches

getChildren()
ChildWatchRegistration
childWatches

#### 2.1.2 服务端接收到监听请求

当客户端发送请求数据包`Packet`被服务端接收到后，流程如下：

- 在服务端处理客户端的请求时，会有一系列的RequestProcessor对请求进行处理，上一篇说过的日志归档便是由SyncRequestProcessor处理的，而添加监听器则是由FinalRequestProcessor进行处理的；
- 其中具体把监听器添加到哪个WatchManager可参照上面的表；
- 在DataTree中添加监听器，其实际对象类型是ServerCnxn，即在服务端产生的客户端对象，其实现了Watcher接口；
- 当添加完监听器后，将会回复客户端该操作已经处理成功。

#### 2.1.3 服务端触发监听

假设服务端接收到了某个客户端修改已经监听的路径，则会触发监听流程，如下：

- 触发监听时会传入监听路径，服务端会根据监听类型从dataWatches或childWatches表中获取对应的监听器，并将其从表中删除，因此监听器每次触发监听后需要重新监听；
- 具体操作类型触发监听时所操作的WatchManager对应表可翻看上面；
- 当取出具体的监听对象时，在服务端即为ServerCnxn对象， 回调方法中会往对应的客户端发送一个notification响应消息，客户端将会根据这个消息类型判断此消息为回调消息。

#### 2.1.4 客户端接收服务端监听回调

当客户端接收到服务端的`notification`通知后，将会从监听映射表中获取开发者开发的监听器对象，调用`process()`方法完成监听回调，流程如如下：

- notification通知的xid比较特别，值为-1，客户端便是使用响应对应的xid值来判断属于回调通知；
- 当判断为notification通知后，会根据响应内容生成WatchedEvent监听事件对象，在这里面包含了响应路径和类型等信息；随后会将其封装为WatcherSetEventPair对象，此对象会追加路径对应的监听器集合Set``，最后会将此对象添加到事件处理线程EventThread的waitingEvents阻塞队列中；
- EventThread线程会一直轮询waitingEvents阻塞队列，当有值且类型为WatcherSetEventPair后，则会遍历里面的Set``集合，调用其process()方法完成回调。

上面四步已经是非常简化的`Watcher`交互流程图，其中还有许多的细节，如果有兴趣可自行去阅读源码感受感受。

### 2.2 关键源码

还是以调用一次`exists()`方法监听流程来距离，以关键源码的流程角度来还原一次`Watcher`回调的流程。

#### 2.2.1 客户端调用方法监听

客户端调用`exists()`方法并传入自己实现的`Watcher`对象

```java
public class ZooKeeper {
    public Stat exists(final String path, Watcher watcher)
        throws KeeperException, InterruptedException {
        ...
        // 在每个方法的代码中便写死了注册器WatchRegistration的类型
        WatchRegistration wcb = null;
        if (watcher != null) {
            wcb = new ExistsWatchRegistration(watcher, clientPath);
        }
        ...
        ExistsRequest request = new ExistsRequest();
        request.setPath(serverPath);
        // 这是关键，客户端会根据此值来判断请求是否需要添加到监听表中
        request.setWatch(watcher != null);
        ...
        // 使用ClientCnxn对象发送请求，具体的发送细节不再赘述
        ReplyHeader r = cnxn.submitRequest(h, request, response, wcb);
    }
}
```

#### 2.2.2 服务端接收请求并添加到监听表

`ZK`服务器接收请求并做一系列的处理便直接略过，直接快进到`FinalRequestProcessor`类进行监听操作，监听后将会给客户端发送本次请求响应：

```java
public class FinalRequestProcessor implements RequestProcessor {
    ZooKeeperServer zks;
    public void processRequest(Request request) {
        ...
        // 此为通信客户端在服务端的连接对象
        ServerCnxn cnxn = request.cnxn;
        ...
        switch (request.type) {
            case OpCode.exists: {
                ...
                // 如果一切顺利，最终一定会调用到这里来，existsRequest.getWatch()
                // 属性便决定了是否进行监听，如果监听则会把cnxn客户端对象
                // 当成服务端的监听器放到DataTree的监听表中，对象类型ServerCnxn
                Stat stat = zks.getZKDatabase().statNode(path, 
                    existsRequest.getWatch() ? cnxn : null);
                rsp = new ExistsResponse(stat);
                break;
            }
        }
        ...
    }
}
```

#### 2.2.3 客户端接收响应

此过程是异步的，当客户端调用了`exits()`方法后便是异步流程了，当上面的服务端处理完`exists()`方法的请求后将会回复响应，流程如下：

```java
public class ClientCnxn {
    class SendThread extends ZooKeeperThread {
        void readResponse(ByteBuffer incomingBuffer) throws IOException {
            ...
            // 正常的服务端响应都会执行到这个方法
            finishPacket(packet);
        }
        private void finishPacket(Packet p) {
            // Packet对象中如果要监听，watchRegistration一定不为空
            // 因此在这里会使用刚开始初始化的watchRegistration对象
            // 进行注册，将其添加到ZK客户端的监听表中
            if (p.watchRegistration != null) {
                p.watchRegistration.register(p.replyHeader.getErr());
            }
            ...
        }
    }
}
```

#### 2.2.4 服务端节点数据发生改动

假设由于不知名操作，导致刚刚监听的路径节点数据发生了改动，此时此时触发了`NodeDataChanged`事件，源码表现如下：

```java
public class DataTree {
    private final WatchManager dataWatches = new WatchManager();
    public Stat setData(String path, byte data[], int version, long zxid,
        long time) throws KeeperException.NoNodeException {
        ...
        // 将会从监听表中根据路径
        dataWatches.triggerWatch(path, EventType.NodeDataChanged);
        return s;
    }
}
public class WatchManager {
    private final HashMap<String, HashSet<Watcher>> watchTable =
        new HashMap<String, HashSet<Watcher>>();
    private final HashMap<Watcher, HashSet<String>> watch2Paths =
        new HashMap<Watcher, HashSet<String>>();
    public Set<Watcher> triggerWatch(String path, EventType type) {
        return triggerWatch(path, type, null);
    }
    public Set<Watcher> triggerWatch(String path, EventType type, 
        Set<Watcher> supress) {
        ...
        // 先会将实际的路径监听表中将路径下的所有监听器删除并拿出来
        watchers = watchTable.remove(path);
        ...
        // 再将监听器所监听的路径给删除，因为监听器实际是ServerCnxn对象
        // watch2Paths表中的key对于某一客户端是唯一的，只需要删除其中
        // 的某一个路径即可
        for (Watcher w : watchers) {
            HashSet<String> paths = watch2Paths.get(w);
            if (paths != null) {
                paths.remove(path);
            }
        }
        ...
        // 遍历监听器集合watchers，一一调用其process()方法
        for (Watcher w : watchers) {
            if (supress != null && supress.contains(w)) {
                continue;
            }
            w.process(e);
        }
    }
}
```

#### 2.2.5 服务端像客户端发送事件响应

当在服务端这边的树节点触发了事件响应，则会调用监听器（实为`ServerCnxn`对象）的`process()`方法，流程如下：

```java
public class NIOServerCnxn extends ServerCnxn {
    @Override
    synchronized public void process(WatchedEvent event) {
        // 响应头值为固定的，客户端便是使用xid=-1来判断属于事件触发通知
        ReplyHeader h = new ReplyHeader(-1, -1L, 0);
        WatcherEvent e = event.getWrapper();
        sendResponse(h, e, "notification");
    }
}
```

#### 2.2.6 客户端接收通知并回调监听

此流程类似于客户端接收正常操作响应流程，唯一不同在于会根据`xid`的值判断触发事件，流程如下：

```java
public class ClientCnxn {
    class SendThread extends ZooKeeperThread {
        final EventThread eventThread;
        void readResponse(ByteBuffer incomingBuffer) throws IOException {
            ...
            if (replyHdr.getXid() == -1) {
                // 实例化对象并反序列化服务端回复的消息内容，主要是触发的事件类型
                // 需注意这里和后面的WatchedEvent不一样， 这个是事件通信对象
                // 后面的是客户端的事件对象
                WatcherEvent event = new WatcherEvent();
                event.deserialize(bbia, "response");
                ...
                // 实例化事件对象，并交给事件线程处理
                WatchedEvent we = new WatchedEvent(event);
                eventThread.queueEvent( we );
                return;
            }
            // 这后面便是正常的响应处理流程，但由于是事件触发响应
            // 前面会直接返回，因此执行不到这里
            ...
        }
    }
    class EventThread extends ZooKeeperThread {
        private final LinkedBlockingQueue<Object> waitingEvents =
            new LinkedBlockingQueue<Object>();
        public void queueEvent(WatchedEvent event) {
            // 根据事件类型从客户端的监听表中获取监听器集合Set<Watcher>
            // 并统一封装成WatcherSetEventPair对象添加到阻塞队列中
            WatcherSetEventPair pair = new WatcherSetEventPair(
                    watcher.materialize(event.getState(), 
                    event.getType(), event.getPath()), event);
            // 添加到阻塞队列中，EventThread对象会一直轮询该集合
            waitingEvents.add(pair);
        }
        @Override
        public void run() {
            Object event = waitingEvents.take();
            if (event == eventOfDeath) {
                // 判断ZK是否停止事件类型
                wasKilled = true;
            } else {
                // 如果有事件类型则执行事件对象
                processEvent(event);
            }
            ...
        }
        private void processEvent(Object event) {
            if (event instanceof WatcherSetEventPair) {
              // 前面已经得知，如果是事件回调通知则类型一定进入到此代码中
              WatcherSetEventPair pair = (WatcherSetEventPair) event;
              // 拿出WatcherSetEventPair对象封装的客户端监听器，并调用其
              // process()方法最终完成回调
              for (Watcher watcher : pair.watchers) {
                  try {
                      // 调用客户端实际实现的监听器，完成回调
                      watcher.process(pair.event);
                  } catch (Throwable t) {
                      LOG.error("Error while calling watcher ", t);
                  }
              }
          }
        }
    }
}
```

最后一步的触发监听事件由于都在同一个实现类中，因此就没有分开，直接在同一个代码块中完成注释了，此代码块流程较长，但从上到下依次阅读下来对于关键代码块的作用应该能够略知一二。
