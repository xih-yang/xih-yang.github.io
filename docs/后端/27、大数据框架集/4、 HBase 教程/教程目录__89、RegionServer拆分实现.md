# 89、RegionServer拆分实现
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/89.html
- 分类：大数据框架
- 分组：教程目录
## RegionServer拆分实现

由于写入请求由区域服务器处理，它们累积在一个名为memstore的内存存储系统中。一旦memstore填充，它的内容就会作为附加的存储文件写入磁盘。这个事件被称为memstore刷新。当存储文件堆积时，RegionServer会将它们压缩成更少、更大的文件。每次刷新或压缩完成后，该区域中存储的数据量将发生变化。RegionServer会咨询区域拆分策略，以确定该地区是否因为其他策略特定的原因而变得太大或应该拆分。如果策略建议，则区域拆分请求排队。

从逻辑上讲，分割区域的过程很简单。我们在该区域的密钥空间找到一个合适的点，我们应该将该区域分成两半，然后在该点将区域的数据分成两个新的区域。然而，这个过程的细节并不简单。当发生拆分时，新创建的子区域不会立即将所有数据重新写入新文件。相反，他们创建类似于符号链接文件的小文件，称为引用文件，根据拆分点指向父存储文件的顶部或底部。引用文件与常规数据文件一样使用，但只考虑一半的记录。如果不再有对父区域的不可变数据文件的引用，则只能分割该区域。这些引用文件通过压缩逐渐清理，以便该地区将停止引用其父文件，并且可以进一步拆分。

尽管拆分区域是由RegionServer做出的本地决定，但拆分过程本身必须与许多参与者协调。RegionServer在拆分之前和之后通知Master，更新.META.表以便客户端可以发现新的子区域，并重新排列HDFS中的目录结构和数据文件。拆分是一个多任务过程。为了在发生错误时启用回滚，RegionServer会保留关于执行状态的内存日志。RegionServer拆分过程说明了RegionServer执行拆分所采取的步骤。每个步骤都标有其步骤编号。来自RegionServers或Master的操作显示为红色，而来自客户端的操作显示为绿色。

下图为RegionServer拆分过程：

**1、** RegionServer决定在本地拆分区域，并准备拆分拆分已开始作为第一步，RegionServer获取表上的共享读锁定，以防止在拆分过程中修改架构然后它在zookeeper下的/hbase/region-in-transition/region-name创建一个znode，并将znode的状态设置为SPLITTING；

**2、** Master开始了解znode，因为它有一个父region-in-transitionznode的观察器；

**3、** RegionServer在HDFS中的父级region目录下创建一个子目录.splits；

**4、** RegionServer关闭父区域并在其本地数据结构中将区域标记为离线拆分区域现在处于离线状态在这一点上，来到父区域的客户端请求将抛出NotServingRegionException客户端将重试一些备份关闭区域被刷新；

**5、** RegionServer在.splits目录下为子区域A和B创建地区目录，并创建必要的数据结构然后，它会拆分存储文件，因为它会在父区域中为每个存储文件创建两个引用文件这些引用文件将指向父区域的文件；

**6、** RegionServer在HDFS中创建实际的区域目录，并为每个子区域移动引用文件；

**7、** RegionServer向.META.表发送一个Put请求，并将.META.表中的父级设置为离线，添加有关子区域的信息在这一点上，.META.中的子区域将不会有单独的条目客户端将看到父区域在扫描.META.时被拆分但直到他们出现在.META.其中才会知道这些子区域此外，如果Put到.META.成功后，父区域将会有效地拆分如果RegionServer在此RPC成功之前失败，则Master和下一个RegionServer打开该区域将清除有关区域拆分的不干净状态更新.META.之后，区域分割将由Master进行前滚；

**8、** RegionServer并行打开子区域A和B.；

**9、** RegionServer将子区域A和B添加到.META.，连同它承载区域的信息拆分区域现在处于在线状态在此之后，客户端可以发现新的区域并向他们发出请求客户端在本地缓存.META.条目，但是当他们向RegionServer或者.META.发出请求时，他们的缓存将失效，他们将从.META.中了解新的区域；

**10、** RegionServer更新ZooKeeper中的znode/hbase/region-in-transition/region-name以表示状态SPLIT，以便主服务器可以了解它必要时，平衡器可以自由地将子区域重新分配给其他区域服务器拆分事务现在已完成；

**11、** 拆分之后，.META.和HDFS仍将包含对父区域的引用在子区域中进行压缩重写数据文件时，这些引用将被删除主服务器中的垃圾收集任务会定期检查子区域是否仍然引用父区域的文件否则，父区域将被删除；
