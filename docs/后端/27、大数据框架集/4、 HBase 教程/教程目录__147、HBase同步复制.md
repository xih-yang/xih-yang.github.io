# 147、HBase同步复制
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/147.html
- 分类：大数据框架
- 分组：教程目录
## HBase同步复制背景

HBase中的当前的异步复制。因此，如果主集群崩溃，则从属集群可能没有最新数据。如果用户想要强一致性，那么他们就无法切换到从属集群。

## 设计

请参阅HBASE-19064上的设计文档

## 运行和维护

Case.1设置两个同步复制集群

- 在源集群和对等集群中添加同步对等体。

对于源集群：

```java
hbase> add_peer  '1', CLUSTER_KEY => 'lg-hadoop-tst-st01.bj:10010,lg-hadoop-tst-st02.bj:10010,lg-hadoop-tst-st03.bj:10010:/hbase/test-hbase-slave', REMOTE_WAL_DIR=>'hdfs://lg-hadoop-tst-st01.bj:20100/hbase/test-hbase-slave/remoteWALs', TABLE_CFS => {"ycsb-test"=>[]}
```

对于对等集群：

```java
hbase> add_peer  '1', CLUSTER_KEY => 'lg-hadoop-tst-st01.bj:10010,lg-hadoop-tst-st02.bj:10010,lg-hadoop-tst-st03.bj:10010:/hbase/test-hbase', REMOTE_WAL_DIR=>'hdfs://lg-hadoop-tst-st01.bj:20100/hbase/test-hbase/remoteWALs', TABLE_CFS => {"ycsb-test"=>[]}
```

对于同步复制，当前实现要求源和对等集群具有相同的对等ID。另一件需要注意的事情是：对等体不支持集群级，命名空间级或cf级复制，现在只支持表级复制。

- 将对等集群转换为STANDBY状态

```java
    hbase> transit_peer_sync_replication_state '1', 'STANDBY'
```

- 将源群集转换为ACTIVE状态

```java
    hbase> transit_peer_sync_replication_state '1', 'ACTIVE'
```

现在，已成功设置同步复制。HBase客户端只能请求源集群，如果请求到对等集群，则现在处于STANDBY状态的对等集群将拒绝读/写请求。

Case.2备用集群崩溃时的操作方法

如果备用群集已崩溃，则无法为活动群集写入远程WAL。所以我们需要将源集群转移到DOWNGRANDE_ACTIVE状态，这意味着源集群将不再写任何远程WAL，但正常复制（异步复制）仍然可以正常工作，它会对新写入的WAL进行排队，但是复制块直到对等集群返回。

```java
hbase> transit_peer_sync_replication_state '1', 'DOWNGRADE_ACTIVE'
```

一旦对等集群返回，我们就可以将源集群转移到ACTIVE，以确保复制是同步的。

```java
hbase> transit_peer_sync_replication_state '1', 'ACTIVE'
```

Case.3活动集群崩溃时的操作方法

如果活动集群已崩溃（现在可能无法访问），那么让我们将备用集群转移到DOWNGRANDE_ACTIVE状态，之后，我们应该将所有请求从客户端重定向到DOWNGRADE_ACTIVE集群。

```java
hbase> transit_peer_sync_replication_state '1', 'DOWNGRADE_ACTIVE'
```

如果崩溃的集群再次返回，我们只需要将其直接转移到STANDBY。否则，如果将集群传输到DOWNGRADE_ACTIVE，则原始ACTIVE群集可能具有与当前ACTIVE集群相比的冗余数据。因为我们设计的是同时编写源集群WAL和远程集群WAL，所以源集群WALs可能比远程集群具有更多数据，这导致数据不一致。将ACTIVE转换为STANDBY的过程没有问题，因为我们将跳过重放原始的WAL。

```java
hbase> transit_peer_sync_replication_state '1', 'STANDBY'
```

然后，我们现在可以将DOWNGRADE_ACTIVE集群提升为ACTIVE，以确保复制是同步的。

```java
hbase> transit_peer_sync_replication_state '1', 'ACTIVE'
```
