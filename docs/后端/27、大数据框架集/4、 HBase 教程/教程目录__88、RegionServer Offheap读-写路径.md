# 88、RegionServer Offheap读-写路径
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/88.html
- 分类：大数据框架
- 分组：教程目录
## RegionServer Offheap读/写路径

### Offheap读取路径

在hbase-2.0.0中，HBASE-11425更改了HBase读取路径，以便它可以保存读取数据，避免将缓存数据复制到java堆上。这减少了GC暂停，因为生产的垃圾较少，所以清理的次数也较少。堆外读取路径的性能与堆内LRU缓存相似/更好。该功能自HBase 2.0.0开始可用。如果BucketCache处于file模式下，则与原生堆LruBlockCache相比，抓取总是比较慢。

对于端到端的非堆积式读取路径，首先应该有一个堆外备份的离堆块缓存（BC）。在hbase-site.xml中将’hbase.bucketcache.ioengine’配置为off-heap 。还要指定使用hbase.bucketcache.size配置指定BC的总容量。请记住调整hbase-env.sh中的’HBASE_OFFHEAPSIZE’的值。这是我们如何为RegionServer java进程指定最大可能的堆外存储器分配。这应该比BC的堆外尺寸大。请记住，默认情况下没有默认设置，hbase.bucketcache.ioengine默认关闭BC。

接下来要调整的是RPC服务器端的ByteBuffer（字节缓冲区）池。该池中的缓冲区将用于累积单元字节，并创建一个结果单元块以发送回客户端。hbase.ipc.server.reservoir.enabled可以用来打开或关闭此池。默认情况下，此池处于可用状态。HBase将创建堆外ByteBuffers并将它们合并。如果您想在读取路径中进行端到端的堆积，请确保不要将其关闭。如果关闭该池，服务器将在堆上创建临时缓冲区以累积单元格字节并生成结果单元格块。这可能会影响高度读取的加载服务器上的GC。用户可以根据池中有多少缓冲区以及每个ByteBuffer的大小来调整该池。使用配置hbase.ipc.server.reservoir.initial.buffer.size来调整每个缓冲区大小。默认值是64 KB。

当读取模式是一个随机行读取负载，并且每个行的大小与64 KB相比较小时，尝试减少此数量。当结果大小大于一个ByteBuffer大小时，服务器将尝试抓取多个缓冲区，并将结果单元格块取出。当池用完缓冲区时，服务器将最终创建临时堆缓冲区。

可以使用配置’hbase.ipc.server.reservoir.initial.max’来调整池中的最大ByteBuffers数量。它的值默认为配置了64 *个区域服务器处理程序。数学是这样的，默认情况下我们考虑2MB作为每个读取结果的单元块大小，每个处理程序将处理读取。对于2 MB大小，我们需要32个缓冲区，每个大小为64 KB。所以每个处理程序有32个ByteBuffers（BB）。我们将这个大小分配为最大BB计数的两倍，以便一个处理程序可以创建响应并将其交给RPC响应程序线程，然后处理新的请求，创建新的响应单元块（使用池缓冲区）。即使响应者不能立即发回第一个TCP响应，我们的计数应该允许我们在池中仍然有足够的缓冲区，而不必在堆上做临时缓冲区。再次对于较小尺寸的随机行读数，调整此最大数量。有懒惰地创建的缓冲区，计数是要汇集的最大数量。

如果在完成端到端读取路径堆外后仍然看到GC出现问题，请在适当的缓冲池中查找问题。使用INFO级别检查下面的RegionServer日志：

```java
Pool already reached its max capacity : XXX and no free buffers now. Consider increasing the value for 'hbase.ipc.server.reservoir.initial.max' ?
```

hbase-env.sh中HBASE_OFFHEAPSIZE的设置在RPC端也应考虑此关闭堆缓冲池。我们需要将RegionServer的这个最大堆外大小配置为比这个最大池大小和堆外缓存大小之和高一点。TCP层还需要为TCP通信创建直接的字节缓冲区。此外，DFS客户端将需要一些堆外工作来完成其工作，特别是如果配置了短路读取。为最大直接内存大小分配额外的1 – 2 GB已在测试中工作。

如果您正在使用协处理器并在读取结果中引用单元格，请不要将对这些单元格的引用存储在CP挂接方法的范围之外。某些时候，CP需要关于单元的存储信息（像它的行键），以考虑下一个CP挂接调用等。
