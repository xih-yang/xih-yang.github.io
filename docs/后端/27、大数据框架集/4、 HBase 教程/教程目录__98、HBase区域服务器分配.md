# 98、HBase区域服务器分配
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/98.html
- 分类：大数据框架
- 分组：教程目录
## HBase区域 – 区域服务器分配

本节介绍HBase区域如何分配给区域服务器。

### HBase区域分配启动

当HBase启动区域分配如下（简短版本）时：

**1、** 主机在启动时调用AssignmentManager；

**2、** AssignmentManager查看hbase:meta中现有的区域分配；

**3、** 如果区域分配仍然有效（即，如果RegionServer仍处于联机状态），则将保留分配；

**4、** 如果分配无效，则调用LoadBalancerFactory来分配区域负载均衡器（在HBase1.0中默认StochasticLoadBalancer）将该区域分配给RegionServer；

**5、** hbase:meta使用RegionServer分配（如果需要）和RegionServer启动代码（RegionServer进程的开始时间）在RegionServer打开区域时进行更新；

### 故障转移

当RegionServer失败时：

**1、** 区域立即变得不可用，因为RegionServer已关闭；

**2、** 主机将检测到RegionServer失败；

**3、** 区域分配将被视为无效，并将像启动序列一样被重新分配；

**4、** 飞行中的查询被重新尝试，并且不会丢失；

**5、** 操作在以下时间段内切换到新的RegionServer：

```java
    ZooKeeper session timeout + split time + assignment/replay time
```

### 区域负载平衡

区域可以由LoadBalancer定期移动。

### 区域状态转变

HBase维持每个区域的状态并在hbase:meta中保持状态。该hbase:meta地区本身的状态在ZooKeeper中保存。您可以在Master Web UI中查看转换中的区域状态。以下是可能的区域状态。

可能的区域状态：

- OFFLINE：该区域处于离线状态，无法打开
- OPENING：该区域正在被打开
- OPEN：该区域已打开并且RegionServer已通知主机
- FAILED_OPEN：RegionServer无法打开该区域
- CLOSING：该区域正在关闭
- CLOSED：RegionServer关闭了该区域并通知了主机
- FAILED_CLOSE：RegionServer无法关闭该区域
- SPLITTING：RegionServer通知主机该地区正在拆分
- SPLIT：RegionServer通知主机该区域已完成拆分
- SPLITTING_NEW：该区域正在建设中，正在进行中的拆分
- MERGING：RegionServer通知主机这个区域正在与另一个区域合并
- MERGED：RegionServer通知主机该区域已被合并
- MERGING_NEW：这个区域是由两个区域合并创建的

区域状态转换图：

图表图例注释：

- Brown：离线状态，一种特殊状态，可以是暂时的（打开之前关闭后），终端（已禁用表的区域）或初始（新创建表的区域）
- Palegreen：区域可以满足请求的在线状态
- Lightblue：瞬态状态
- Red：需要OPS注意的失败状态
- Gold：区域的终端国家拆分/合并
- Grey：通过拆分/合并创建的区域的初始状态

过渡状态描述：

**1、** 主机将区域从OFFLINE状态移动到OPENING状态并尝试将区域分配给RegionServerRegionServer可能或可能未收到开放区域请求主机会重试将开放区域请求发送到RegionServer，直到RPC通过或主机用尽重试在RegionServer收到开放区域请求后，RegionServer开始打开该区域；

**2、** 如果主服务器的重试耗尽，则即使RegionServer正在开始打开区域，主服务器也会通过将区域移至CLOSING状态并尝试关闭它来阻止RegionServer打开该区域；

**3、** RegionServer打开该区域后，它将继续尝试通知主服务器，直到主服务器将区域移至OPEN状态并通知RegionServer该地区现在开放；

**4、** 如果RegionServer无法打开区域，它会通知主人主服务器将该区域移至CLOSED状态并尝试在不同的RegionServer上打开该区域；

**5、** 如果主机无法在某个区域的任何区域打开该区域，则会将该区域移至FAILED_OPEN状态，并且在操作员从HBaseshell进行干预或服务器死机之前不会采取进一步的行动；

**6、** 主机将区域从OPEN状态移动到CLOSING状态持有区域的RegionServer可能已经或可能未收到关闭区域请求主服务器重试向服务器发送关闭请求，直到RPC通过或主服务器用尽重试；

**7、** 如果RegionServer未联机或抛出NotServingRegionException，则主服务器将该区域移至OFFLINE状态并将其重新分配给不同的RegionServer；

**8、** 如果RegionServer处于联机状态，但在主服务器用完重试之后无法访问，则主服务器会将该区域移至FAILED_CLOSE状态，并且不会采取进一步的操作，直到操作员从HBaseshell进行干预或服务器已死亡；

**9、** 如果RegionServer获得关闭区域请求，它会关闭该区域并通知主机主机将区域移至CLOSED状态并将其重新分配给不同的RegionServer；

**10、** 在分配区域之前，如果主区域处于OFFLINE状态，主区域会自动将区域移至CLOSED状态；

**11、** 当一个RegionServer即将分割一个区域时，它通知主机主机将要分割的区域从OPEN状态移动到SPLITTING状态，并将要创建的两个新区域添加到RegionServer这两个区域最初都处于SPLITTING_NEW状态；

**12、** 通知主机后，RegionServer开始拆分区域一旦经过了不返回的点，RegionServer会再次通知主服务器，以便主服务器可以更新该hbase:meta表但是，在服务器通知拆分完成之前，主服务器不会更新区域状态如果拆分成功，拆分区域从SPLITTING状态移动到SPLIT状态，并且将两个新的区域从SPLITTING_NEW状态移动到OPEN状态；

**13、** 如果拆分失败，则拆分区域从SPLITTING状态移动回OPEN状态，其中创建的两个新的区域将从SPLITTING_NEW状态移动到OFFLINE状态；

**14、** 当一个RegionServer即将合并两个区域时，它首先通知主机主机将两个区域合并为OPEN到MERGING状态，并将新的区域添加到RegionServer中，该区域将合并区域的内容保存起来新区域最初处于MERGING_NEW状态；

**15、** 通知主机后，RegionServer开始合并这两个区域一旦经过不返回的点方，RegionServer再次通知主机，以便主机可以更新META但是，主服务器不会更新区域状态，直到RegionServer通知合并已完成如果合并成功，则两个合并的区域是从MERGING状态移动到MERGED状态，并且新的区域是从MERGING_NEW状态移动到OPEN状态；

**16、** 如果合并失败，两个合并区域从MERGING状态返回到OPEN状态，这是为了保存合并的区域的内容的新的区域是从MERGING_NEW状态移动到OFFLINE状态；

**17、** 对于处于FAILED_OPEN或FAILED_CLOSE状态的区域，当主机通过HBaseShell重新分配主区域时，主区域会尝试再次关闭它们；
