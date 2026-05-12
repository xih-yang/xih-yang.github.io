# 07、RocketMQ 源码解析 - 存储设计
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/7.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、** RocketMQ存储文件主要包括：**CommitLog文件**、**ConsumerQueue文件**、**Index**文件；

- **CommitLog文件：所有Topic的消息按照抵达顺序依次追加到CommitLog**中，一旦写入不支持修改
- **ConsumeQueue文件：消息消费队列，用于消费者消费，即消费者通过此文件来从CommitLog**中获取消息。消息达到**CommitLog**后，将异步转发到**ConsumeQueue文件**
- Index文件：消息索引，主要存储消息key与offset的对应关系

**2、** RocketMQ将所有Topic的消息都存储在同一个**CommitLog文件**中，一般按照Topic来检索消息，所以为了提高消息消费的效率，RocketMQ引入了**ConsumeQueue文件（消费队列）** ，每一个Topic包含多个消息消费队列，每一个消费队列都有一个文件；

**3、** 为了根据消息的属性从CommitLog文件中快速检索消息，RocketMQ引入了**Index索引文件**；

**4、** 存储目录；

## 基本原理

**1、**`PageCache`:`PageCache`是文件系统层的Cache，主要用来减少对磁盘的I/O操作，通过对磁盘的访问变为物理内存的访问，缓存的是内存页面，操作时按照页为基本单位在Linux系统中写入数据的时候并不会直接写到硬盘上，而是会先写到PageCache中，并打上dirty标识，由内核线程flusher定期将被打上dirty的页发送给IO调度层，最后由IO调度决定何时落地到磁盘中，而Linux一般会把还没有使用的内存全拿来给PageCache使用而读的过程也是类似，会先到PageCache中寻找是否有数据，有的话直接返回，如果没有才会到磁盘中去读取并写入PageCache，然后再次读取PageCache并返回而且读的这个过程中操作系统也会有一个预读的操作，你的每一次读取操作系统都会帮你预读出后面一部分数据当你一直在使用预读数据的时候，系统会帮你预读出更多的数据(最大到128K)；

**2、**`BufferCache`:`BufferCache`是针对设备的，实际操作按块为基本单位，对于裸盘的读写会占用`BufferCache`，当读写完成之后，会归还给操作系统；

- 在linux2.4内核中`Buffer Cache`和`Page Cache`是共存的，因为文件的读写最终会转化为块设备的读写，即同一份文件的数据，可能既在`Buffer Cache`中也在`Page Cache`中，这样就造成了物理内存的浪费。
- linux2.6内核对`Buffer Cache`和`Page Cache`进行了合并，统一为`Page Cache`。当进行文件读写时，如果文件在磁盘上的存储块是连续的，那么文件在`Page Cache`中对应的页是普通的page，如果文件在磁盘上的数据块是不连续的，或者是设备文件，那么文件在`Page Cache`中对应的页就是`Buffer Cache`

**3、** 查看内存情况；

```java
$ cat /proc/meminfo                     
MemTotal:        3876772 kB
MemFree:          126704 kB
MemAvailable:     137132 kB
Buffers:              48 kB
Cached:           258648 kB
SwapCached:        12344 kB
...省略...
Buffers: 表示Buffer Cache的容量
Cached: 表示位于物理内存中的页缓存Page Cache
SwapCached:表示位于磁盘交换区的页缓存Page Cache
实际的Page Cache容量=Cached+SwapCached
```

**4、** linux底层提供mmap将文件映射进虚拟内存，对文件的读写变成对内存的读写，能充分利用`PageCache`,但是如果对文件进行随机读写，会使虚拟内存产生很多`缺页(PageFault)中断`，此时操作系统需要将磁盘文件的数据再次加载到`PageCache`，这个过程比较慢如果对文件进行顺序读写，读和写的区域都是被操作系统缓存过的热点区域，不会产生大量的缺页中断，文件的读写操作相当于直接内存的操作，性能会提升很多如果内存不够充足，内核把内存分配给`PageCache`后，空闲内存会变少，如果程序有新的内存分配或者缺页中断，但是空闲内存不够，内核需要花费时间将热度低的`PageCache`内存回收掉，此时性能会下降当遇到操作系统进行脏页回写，内存回收，内存换入换出等情形时，会产生较大的读写延迟，造成存储引擎偶发的高延迟，针对这种现象，RocketMQ采用了多种优化技术，比如内存预分配，文件预热，mlock系统调用，读写分离等，来保证利用PageCache优点的同时，消除其带来的延迟；

**5、** 工具查看：[hcache](https://github.com/silenceshell/hcache)是基于[pcstat](https://github.com/tobert/pcstat)，`pcstat`可以查看文件是否被缓存和根据pid来查看缓存了哪些文件，`hcache`是`pcstat`的增强版本，增加了查看整个系统Cache和根据Cache大小排序的功；

```java
查看使用Cache最多的3个进程
$ hcache --top 3  
+----------------------------------+--------------+-------+--------+---------+
| Name                             | Size (bytes) | Pages | Cached | Percent |
|----------------------------------+--------------+-------+--------+---------|
| /usr/share/atom/atom             | 81137776     | 19810 | 19785  | 099.874 |
| /usr/bin/dockerd                 | 68608880     | 16751 | 14321  | 085.493 |
| /usr/share/atom/snapshot_blob.bin| 54619240     | 13335 | 13335  | 100.000 |
+----------------------------------+--------------+-------+--------+---------+
```

## CommitLog

**1、**`RocketMQBroker`单个实例下所有的Topic都使用同一个日志数据文件(`CommitLog`)来存储(即单个实例消息整体有序)，这点与kafka不同(kafka采用每个分区一个日志文件存储)；

**2、****CommitLog**单个文件大小默认1G，文件文件名是起始偏移量，总共20位，左边补零，起始偏移量是0假设文件按照默认大小1G来算；

- 第一个文件的文件名为**00000000000000000000** ，当第一个文件被写满之后，开始写入第二个文件
- 第二个文件的文件名为**00000000001073741824** ，`1G=1073741824=1024*1024*1024`
- 第三个文件的文件名是**00000000002147483648**，(文件名相差`1G=1073741824=1024*1024*1024`)

**3、****CommitLog**按照上述命名的好处是给出任意一个消息的物理偏移量，可以通过二分法进行查找，快速定位这个文件的位置，然后用消息物理偏移量减去所在文件的名称，得到的差值就是在该文件中的绝对地址；

## ConsumeQueue

**1、****ConsumeQueue**是消息消费队列，它是一个逻辑队列，相当于**CommitLog**的索引文件因为RocketMQ的队列不存储任何实际数据，它只存储**CommitLog**中的`【起始物理位置偏移量，消息的内容大小，消息Tag的哈希值】`，每一个ConsumeQueue存储的格式如下，总共20B存tag是为了在消费者取到消息offset后先根据tag做一次过滤，剩下的才需要到**CommitLog**中取消息详情；

**2、** 每个**ConsumeQueue**都有一个queueId，queueId的值为0到TopicConfig配置的队列数量比如某个Topic的消费队列数量为4，那么四个**ConsumeQueue**的queueId就分别为0、1、2、3；

**3、** 消费者消费时会先从**ConsumeQueue**中查找消息在**CommitLog**中的offset，再去CommitLog中找原始消息数据如果某个消息只在**CommitLog**中有数据，没在**ConsumeQueue**中，则消费者无法消费；

**4、****ConsumeQueue**类对应的是每个topic和queuId下面的所有文件默认存储路径是**$HOME/store/consumequeue/{topic}/{queueId}/{fileName}**，每个文件由30w条数据组成，单个文件的大小是**30wx20Byte**，即每个文件为600w字节，单个消费队列的文件大小约为**5.722M=(600w/(1024*1024))**；

## Index文件

**1、****IndexFile**:索引文件，物理存储上，文件名为创建时间的时间戳命名，固定的单个**IndexFile**文件大小约为400M，一个**IndexFile**可以保存2000W个索引；

**2、** IndexFile（索引文件）由`IndexHeader`(索引文件头),`Slot`(槽位)和`Index`(消息的索引内容)三部分构成对于每个`IndexFile`来说`IndexHeader`是固定大小的，Slot是索引的目录，用于定位Index在IndexFile中存储的物理位置；

**3、** 存储图；

## checkpoint文件

**1、** checkpoint检查点文件的作用是记录**CommitLog**、**ConsumeQueue**、**Index**文件的刷盘时间点，文件固定长度为4kb，只用该文件的前24个字节；

- physicMsgTimestamp：CommitLog文件刷盘时间点
- logicsMsgTimestamp：ConsumeQueue文件刷盘时间点
- indexMsgTimestamp：Index文件刷盘时间点

## TransientStorePool机制

**1、** RocketMQ为了降低PageCache的使用压力，引入了transientStorePoolEnable机制，即内存级别的读写分离机制；

**2、** 默认情况，RocketMQ将消息写入PageCache，消费时从PageCache中读取消息但是这样在高并发下PageCache压力会比较大，容易出现瞬时**brokerbusy异常**RocketMQ通过开启`transientStorePoolEnable=true`，将消息写入堆外内存并立即返回，然后异步将堆外内存中的数据批量提交到PageCache，再异步刷盘到磁盘中这样的好处就是形成内存级别的读写分离，发送写入消息是向堆外内存，消费读取消息是从PageCache；

**3、** 该机制的缺点就是如果意外导致broker进程异常退出，已经放入到PageCache中的数据不会丢失，而存储在堆外内存的数据会丢失；
