# 04、Zookeeper 的监听器原理
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-2/4.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 B）
## 1. 监听器原理概述

客户端注册监听它关心的目录节点，当目录节点发生变化（数据改变、节点删除、子目录节点增加删除）时，ZooKeeper 会通知客户端。监听机制保证 ZooKeeper 保存的任何的数据的任何改变都能快速的响应到监听了该节点的应用程序。

## 2. 节点的值变化监听

```java
（1） 在 bigdata1 主机上注册监听/sanguo 节点数据变化
get -w /sanguo
（2）在 bigdata2 主机上修改/sanguo 节点的数据
set /sanguo "xisi"
（3）观察 bigdata1 主机收到数据变化的监听
[zk: localhost:2181(CONNECTED) 4] 
WATCHER::
WatchedEvent state:SyncConnected type:NodeDataChanged path:/sanguo
```

注意：因为只安装了1台机器，所以上述是在单节点上测试

注意：在 bigdata1 再多次修改/sanguo的值， bigdata2 上不会再收到监听。因为注册一次，只能监听一次。想再次监听，需要再次注册。

## 3. 节点的子节点变化监听（路径变化）

```java
（1）在 bigdata2 主机上注册监听/sanguo 节点的子节点变化
ls -w /sanguo
（2） 在 bigdata1 主机/sanguo 节点上创建子节点
create /sanguo/jin "simayi"
（3） 观察 bigdata2 主机收到子节点变化的监听
WATCHER::
WatchedEvent state:SyncConnected type:NodeChildrenChanged
path:/sanguo
```

注意：节点的路径变化，也是注册一次，生效一次。想多次生效，就需要多次注册。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
