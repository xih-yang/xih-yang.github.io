# 09、Zookeeper 源码解析 - Watcher机制
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/9.html
- 分类：注册中心
- 分组：教程目录
### 一、什么是Watcher

Watcher是观察员的意思，ZooKeeper中Watcher就是观察节点状态变化的观察员，也就是说ZooKeeper通过在节点上添加一个Watcher来感知节点的变化，我们先来看一个简单样例：

先通过命令创建一个/wathcer节点：

通过get命令注册一个watcher通知在该节点上：

再起一个客户端去修改当前的节点值：

此时，原来的客户端就会接收到一条通知：

当我们再去修改节点值的时候，就会发现客户端不在收到节点变化通知，说明watcher是一次性的。

以上大致处理流程就是，客户端在某个节点上注册一个watcher，当节点发送变化时，服务端回调当前的变化通知给客户端，所以ZooKeeper中的watcher就相当于事件，客户端向服务端注册一个事件，服务端监听事件，然后回调事件通知。

### 二、源码分析

watcher的发起是从客户端向服务端注册，所以服务端源码的入口在于处理客户端的请求，之前的分析可知，客户端与服务端建立连接关系会被封装成一个NIOServerCnxn对象，这个对象接收到客户端的请求后会封装成一个Request，然后交给RequestProcessor来处理。由之前分析可知，RequestProcessor是链式处理过程，分别是预处理、同步处理以及最终的处理过程，所以watcher源码分析的入口在预处理PrepRequestProcessor的run方法中。

run方法中的调用链是run->pRequest->pRequestHelper(pRequestHelper执行完成提交给SyncRequestProcessor处理)。pRequestHelper方法对增删改操作只是进行一些记录，针对查询操作只检测当前的session状态，针对SyncRequestProcessor中的处理逻辑是对增删改进行日志同步记录，最后的请求处理都在FinalRequestProcessor中，所以我们重点看看FinalRequestProcessor中的processRequest方法。

之前分析可知processRequest方法就是处理请求的最终方法，也就是说watcher机制的实现逻辑也在这个方法中。我们先通过帮助命令查看指令信息如下：

可以发现，只有stat、ls、ls2、get这几个命令才可以注册watcher，我们以get为例：

```java
zks.getZKDatabase().getData(path, stat, getDataRequest.getWatch() ? cnxn : null)
```

当客户端发起读取节点数据时，并注册了watcher，此时会调用ZKDatabase的getData方法，此时如果注册了watcher就会把当前的NIOServerCnxn传递到方法中（实现了Watcher接口）。

getData方法最后会调用到DataTree中的getData方法，如下所示：

```java
public byte[] getData(String path, Stat stat, Watcher watcher) throws KeeperException.NoNodeException {
    DataNode n = nodes.get(path);
    byte[] data = null;
    if (n == null) {
        throw new KeeperException.NoNodeException();
    }
    synchronized (n) {
        n.copyStat(stat);
        //判断当前是否注册了watcher
        if (watcher != null) {
           //添加当前的watcher
            dataWatches.addWatch(path, watcher);
        }
        data = n.data;
    }
    updateReadStat(path, data == null ? 0 : data.length);
    return data;
}
```

从上方法可知，DataTree对象中，维护了存放Watcher的数据集合，分别有dataWatches和childWatches，他们都是IWatchManager的实例。也就是说watcher的管理都是通过IWatchManager来实现的。

IWatchManager接口的默认实现是WatchManager，可以通过参数zookeeper.watchManagerName来配置，也就是说可以实现自定义的watcher管理对象。

```java
public synchronized boolean addWatch(String path, Watcher watcher, WatcherMode watcherMode) {
    //根据当前的watchTable集合中取出对应的watcher集合，一个节点可以对应多个会话注册的watcher
    Set<Watcher> list = watchTable.get(path);
    if (list == null) {
        list = new HashSet<>(4);
        watchTable.put(path, list);
    }
    list.add(watcher);
    //watcher和节点路径的对应关系
    Set<String> paths = watch2Paths.get(watcher);
    if (paths == null) {
        paths = new HashSet<>();
        watch2Paths.put(watcher, paths);
    }
    //设置对应的watcher模式
    watcherModeManager.setWatcherMode(watcher, path, watcherMode);
    return paths.add(path);
}
```

此时客户端就算完成了watcher的注册，并且我们知道客户端传递的只是一个是否需要注册watcher的状态值，接下来就是watcher的触发过程。

watcher的触发在于当前节点的变化，也就是节点的修改、删除以及子节点的增删改操作，以修改节点为例，processRequest方法中处理增删改的操作都是在applyRequest(request)–>zks.processTxn(request)–>getZKDatabase().processTxn(hdr, txn, digest)–>dataTree.processTxn(hdr, txn, digest)–>processTxn(header, txn, false),我们摘取其中修改数据的代码：

```java
case OpCode.setData:
SetDataTxn setDataTxn = (SetDataTxn) txn;
rc.path = setDataTxn.getPath();
rc.stat = setData(
    setDataTxn.getPath(),
    setDataTxn.getData(),
    setDataTxn.getVersion(),
    header.getZxid(),
    header.getTime());
break;
```

此时在setData方法中就会有这么一段调用：

```java
dataWatches.triggerWatch(path, EventType.NodeDataChanged)
```

这里就是出发watcher的地方，此时事件的名称是NodeDataChanged。

```java
public WatcherOrBitSet triggerWatch(String path, EventType type, WatcherOrBitSet supress) {
       //封装watcher事件类型
        WatchedEvent e = new WatchedEvent(type, KeeperState.SyncConnected, path);
        Set<Watcher> watchers = new HashSet<>();
        //得到路径解析器，此时会判断是否需要解析父节点
        PathParentIterator pathParentIterator = getPathParentIterator(path);
        synchronized (this) {
            //自底向上依次解析父节点（如果需要）
            for (String localPath : pathParentIterator.asIterable()) {
                Set<Watcher> thisWatchers = watchTable.get(localPath);
                if (thisWatchers == null || thisWatchers.isEmpty()) {
                    continue;
                }
                Iterator<Watcher> iterator = thisWatchers.iterator();
                while (iterator.hasNext()) {
                    Watcher watcher = iterator.next();
                    WatcherMode watcherMode = watcherModeManager.getWatcherMode(watcher, localPath);
                    if (watcherMode.isRecursive()) {
                        if (type != EventType.NodeChildrenChanged) {
                            watchers.add(watcher);
                        }
                    } else if (!pathParentIterator.atParentPath()) {
                      //得到path上的watcher
                        watchers.add(watcher);
                      //事件不是持久化事件
                        if (!watcherMode.isPersistent()) {
                        //移除当前事件
                            iterator.remove();
                            Set<String> paths = watch2Paths.get(watcher);
                            if (paths != null) {
                                paths.remove(localPath);
                            }
                        }
                    }
                }
                if (thisWatchers.isEmpty()) {
                //从watchTable集合中移除当前的watcher，所以watcher是一次性的
                    watchTable.remove(localPath);
                }
            }
        }
       //循环处理所有注册在当前节点上的事件
        for (Watcher w : watchers) {
            if (supress != null && supress.contains(w)) {
                continue;
            }
            //调用process方法进行处理
            w.process(e);
        }
        return new WatcherOrBitSet(watchers);
    }
```

process方法在NIOServerCnxn中实现的：

```java
public void process(WatchedEvent event) {
   //此时的响应头表示一个通知类型
    ReplyHeader h = new ReplyHeader(ClientCnxn.NOTIFICATION_XID, -1L, 0);
    //获取事件类型
    WatcherEvent e = event.getWrapper();
    //写入响应信息，此时对应的客户端就会收到当前的事件通知，当客户端收到具体事件通知之后就会执行对应的事件类型
    int responseSize = sendResponse(h, e, "notification", null, null, ZooDefs.OpCode.error);
    ServerMetrics.getMetrics().WATCH_BYTES.add(responseSize);
}
```

ZooKeeper中通过IWatchManager来管理客户端注册的watcher，客户端注册的watcher在IWatchManager中通过一个map集合来保存，key表示注册的节点路径，value是事件的集合。当对应节点发生变化的时候，会取出当前节点的对应的事件集合，依次执行process方法，响应客户端，当客户端收到这个响应后就会执行对应的事件，也就是客户端的process方法，每个事件都是一次性的，所以如果需要执行下一个事件需要继续注册当前的节点事件。

### 三、Watcher事件类型

如下所示：

```java
enum EventType {
    None(-1),//无
    NodeCreated(1),//节点创建
    NodeDeleted(2),//节点删除
    NodeDataChanged(3),//节点变化
    NodeChildrenChanged(4),//子节点改变
    DataWatchRemoved(5),//事件移除
    ChildWatchRemoved(6),//子事件移除
    PersistentWatchRemoved (7);//持久性事件移除
}
```

此时，我们还是需要从源码来看，客户端向服务端注册的事件类型，还是回到processRequest方法中，从源码中找到注册事件的代码：

```java
 OpCode.exists:
 Stat stat = zks.getZKDatabase().statNode(path, existsRequest.getWatch() ? cnxn : null);
 OpCode.getData:
 zks.getZKDatabase().getData(path, stat, getDataRequest.getWatch() ? cnxn : null);
 OpCode.getChildren:
 zks.getZKDatabase().getChildren(path, null, getChildrenRequest.getWatch() ? cnxn : null);
 OpCode.getChildren2:
 zks.getZKDatabase().getChildren(path, stat, getChildren2Request.getWatch() ? cnxn : null)
```

可以看出当客户端是这些请求的时候，就会注册对应的事件类型：

当是exists和getData是会往dataWatches中注册事件，当是getChildren和getChildren2时就会往childWatches中注册事件。如果客户端是修改节点数据，那么此时是从dataWatches中处理事件，事件类型是NodeDataChanged，如果是增加或删除节点，将从dataWatches和childWatches中取事件，增加时dataWatches中响应的是NodeCreated，child中响应的是NodeChildrenChanged，删除时，会先从dataWatches中响应NodeDeleted，如果dataWatches中没有注册事件，就会从childWatches中响应NodeDeleted，如果dataWatches中存在对应事件，childWatches就会响应NodeChildrenChanged，如果要监听NodeCreated事件，客户端可以执行exists操作，此时当服务端创建了当前节点的时候就执行NodeCreated事件。

### 四、总结

服务端使用IWatchManager接口进行watcher管理，DataTree中维护两个实例dataWatches和childWatches，dataWatches针对的是当前节点，childWatches针对的是子节点的状态变化。客户端发起注册watcher需求，服务端保存当前注册的watcher，当节点变化时响应对应的事件给客户端，客户端执行对应的事件。

以上，有任何不对的地方，请留言指正，敬请谅解。
