# 05、Zookeeper 源码解析 - ZKDatabase
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/5.html
- 分类：注册中心
- 分组：教程目录
### 一、数据结构

ZooKeeper中数据结构是以树（DataTree）的形式保存，树中的节点对象是DataNode，主要保存节点值data、当前节点的权限acl、以及当前节点的状态stat（节点状态和权限在[第一节](/zhuanlan/registered/zookeeper/2/1.html)的时候简单分析过），DataNode中还保存了children子节点的路径。

DataTree会保存当前所有节点到nodes集合中，DataTree中还有两个属性dataWatches和childWatches，这是实现watcher机制的重要属性。dataWatches是监控当前节点的变化，childWatches监控子节点的变化。ZooKeeper中watcher机制的具体实现，会单独分析。

### 二、ZKDatabase

ZKDatabase可以是说ZooKeeper的数据库管理对象，维护这DataTree实例、session、以及实现数据的持久化，在服务启动时，就会在ZooKeeperServer实例中初始化ZKDatabase对象。

构造方法：

```java
public ZKDatabase(FileTxnSnapLog snapLog) {
    //创建DataTree对象
    dataTree = createDataTree();
    //会话过期集合
    sessionsWithTimeouts = new ConcurrentHashMap<Long, Integer>();
    //FileTxnSnapLog是管理日志文件和持久化文件的对象
    this.snapLog = snapLog;
    //剩下的就是初始化一些参数值
}
```

ZKDatabase的代码比较简单，最终的方法处理都是交给对于的DataTree对象和FileTxnSnapLog 来操作。

### 三、总结

总的来说ZKDatabase的实现原理比较简单，底层的数据结构就是一个map集合，保存着节点的信息，节点对象是一个DataNode实现，数据结构的管理对象是DataTree。ZKDatabase又管理着DataTree和FileTxnSnapLog 来实现整个数据的管理和持久化。

以上，有任何不对的地方，请留言指正，敬请谅解。
