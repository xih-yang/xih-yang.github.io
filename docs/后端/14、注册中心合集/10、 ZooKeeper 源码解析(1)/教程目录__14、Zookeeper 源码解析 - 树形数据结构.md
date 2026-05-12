# 14、Zookeeper 源码解析 - 树形数据结构
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/14.html
- 分类：注册中心
- 分组：教程目录
## 1. 前话

一提到`ZK`的数据结构，对`ZK`稍微有点了解的人，都会立马说`ZK`的内部实际上就是一个树形结构，每创建一个节点，就相当于在树形结构中添加一个节点。实际上，这样说确实没毛病，但有点过于表面了，没有回答全面，例如下面两个问题：

- 树形结构是如何构成的？更偏向于什么树？
- ZK对于这个树形结构有没有做其它的优化让树的查找更加快速？

本篇将会从上述的两个疑问出发，来进一步探究`ZK`的数据结构细节。

## 2. 树结构总览

`ZK`的树形结构类为`DataTree`，成员属性为`dataTree`的形式保存在数据库对象类`ZKDatabase`中，若要操作树形结构对象，则必须通过`ZKDatabase`类的方法才行。类的简要关系图如下：

`DataTree`类中包含了图中七个重要的成员属性，稍微介绍下这七个主要成员属性作用：

**1、**`Mapnodes`：实际类型是`ConcurrentHashMap`，这个集合将会保存树形结构的**所有路径-节点对象**映射关系，也就是说树形结构中存在多少个节点，集合中就会有多少个元素；

**2、**`DataNoderoot`：树形结构的根节点，树进行序列化和反序列化时会操作该对象；

**3、**`DataNodeprocDataNode`：在初始化时创建`/zookeeper`路径节点，如果后面有节点的前缀是`/zookeeper`将会挂在该节点下，`ZK`官方的作用定义为**用作管理或表现状态的路径节点**；

**4、**`DataNodequotaDataNode`：实现节点**配额**的父节点，所有树节点的配额都会挂在该节点下，路径为`/zookeeper/quota`；

**5、**`WatchManagerdataWatches`：用于监听传入的当前节点事件，详细如何处理的等第三节监听再细说；

**6、**`WatchManagerchildWatches`：用于监听该节点的子节点事件，详细如何同上；

**7、**`PathTriepTrie`：保存`quota`**配额**节点的路径树信息；

上面有两个成员属性的介绍是专门为`quota`配额信息来服务的，简单的介绍一下什么是配额信息：

`ZK`的数据结构是树形结构，且节点是没有相关的统计字段的，那这就导致一个问题，如果要统计某个节点下的 **节点数量** 及 **数据大小**，在不修改原有节点数据结构的情况下只能在别处增加相关信息。`ZK`的解决方式就是在树结构中增加`/zookeeper/quota`节点路径（节点对象为`quotaDataNode`），并且会将路径信息以`单词字典树`的形式存放在`PathTrie`中。

在配额路径中，**zookeeper_limits存放的是节点数量和节点数据大小限制信息，zookeeper_stats存放的是当前路径的节点数量和节点数据统计信息**

## 3. 树结构变化演示

### 3.1 树初始状态

ZK服务器启动后`Map nodes`对象的初始状态图如下：

其中第一、二个元素，都是`root`根节点路径，另外两个节点路径则是`ZK`用于管理树信息的节点。

`DataNode root`对象的初始状态如下图：

图中椭圆形的代表`DataNode`类型，下面的圆角长方形则是类型`Set`的集合，且树结构中只有`子节点->父节点`的关系，没有`父节点->子节点`的关系。

那问题来了，要获取对应的子节点怎么办呢？很简单，前面的`Map nodes`对象包含了所有的路径和节点对应关系，`ZK`来获取节点信息一定是根据`path`路径来获取的，因此可以直接从`nodes`中获取到对应的节点，只要`path`是子节点的路径即可，时间复杂度O(1)。

那`ZK`为什么还要在`DataNode`中保留`Set children`集合呢？个人猜测只是为了更容易判断节点下面是否已经存在该节点，当使用路径找到了父节点，用`Set`集合的`contains()`方法简单判断一下即可知道该节点是否已经存在，时间复杂度即为O(1)。

所以`ZK`维护`Map nodes`全部节点和路径的映射关系，和`DataNode`中使用`Set children`集合，都是以空间换时间，来实现`ZK`的高性能。

### 3.2 添加节点树的变化

假设在初始状态下，按照以下顺序依次添加删除节点：

**1、**`create`节点`/custom_parentA`；

**2、**`create`节点`/custom_parentB`；

**3、**`create`节点`/custom_parentC/child1`；

**4、**`create`节点`/custom_parentA/child1`；

**5、**`create`节点`/custom_parentB/child1`；

**6、**`create`节点`/custom_parentB/child2`；

**7、**`delete`节点`/custom_parentB/child2`；

**8、**`create`节点`/custom_parentA/child1/c_child1`；

以下是树结构发生的变化：

1. `create`节点`/custom_parentA`：

1. `create`节点`/custom_parentB`：

1. `create`节点`/custom_parentC/child1`：由于`child1`的父节点`custom_parentC`并不存在，因此会报`KeeperException.NoNodeException()`异常；同理，假如父节点不存在，则会报`KeeperException.NodeExistsException()`异常。
2. `create`节点`/custom_parentA/child1`：

1. `create`节点`/custom_parentB/child1`：

1. `create`节点`/custom_parentB/child2`：

1. `delete`节点`/custom_parentB/child2`：

1. `create`节点`/custom_parentA/child1/c_child1`：

至于`Map nodes`集合中的值，则是以对应的`path`为`key`，`DataNode`对象为`value`存放在`Map`集合中的，就不用一一表明了。经过上面八个步骤演示，相信各位对`ZK`数据节点变化对应的数据结构改变流程应该有了十分直观的理解了。

本篇只是对`ZK`的数据结构做了一个简单的归纳，为后续解析`Watcher`的实现原理做个铺垫。
