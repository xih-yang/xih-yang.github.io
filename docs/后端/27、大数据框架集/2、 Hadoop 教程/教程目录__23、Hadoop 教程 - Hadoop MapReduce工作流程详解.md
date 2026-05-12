# 23、Hadoop 教程 - Hadoop MapReduce工作流程详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/23.html
- 分类：大数据框架
- 分组：教程目录
## 1. MapReduce工作流程详解

### 1.1 MapTask工作机制详解

#### 1.1.1 流程图

#### 1.1.2 执行步骤

整个 Map 阶段流程大体如上图所示。

简单概述：input File 通过 split 被逻辑切分为多个 split 文件，通过 Record 按行读取内容给 map（用户自己实现的）进行处理，数据被 map 处理结束之后交给 OutputCollector 收集器，对其结果 key 进行分区（默认使用 hash 分区），然后写入 buffer，每个 map task 都有一个内存缓冲区，存储着 map 的输出结果，当缓冲区快满的时候需要将缓冲区的数据以一个临时文件的方式存放到磁盘，当整个 map task 结束后再对磁盘中这个 map task 产生的所有临时文件做合并，生成最终的正式输出文件，然后等待 reduce task 来拉数据。

**详细步骤：**

**1、** 首先，读取数据组件InputFormat（默认TextInputFormat）会通过getSplits方法对输入目录中文件进行`逻辑切片规划`得到splits，有多少个split就对应启动多少个MapTasksplit与block的对应关系默认是一对一；

**2、** 将输入文件切分为splits之后，由`RecordReader`对象（默认LineRecordReader）进行读取，以`\n`作为分隔符，`读取一行数据，返回`Key表示每行首字符偏移值，value表示这一行文本内容；

**3、** 读取split返回，进入用户自己继承的Mapper类中，执行`用户重写的map函数`RecordReader读取一行这里调用一次；

**4、** map逻辑完之后，将map的每条结果通过`context.write`进行`collect`数据收集在collect中，会先对其进行`分区`处理，`默认使用HashPartitioner`；

*MapReduce 提供 Partitioner 接口，它的作用就是根据 key 或 value 及 reduce 的数量来决定当前的这对输出数据最终应该交由哪个 reduce task 处理。默认对key hash后再以reduce task数量取模。默认的取模方式只是为了平均 reduce 的处理能力，如果用户自己对 Partitioner 有需求，可以订制并设置到 job 上。*
**5、** 接下来，会将数据写入内存，内存中这片区域叫做`环形缓冲区`，缓冲区的作用是批量收集map结果，减少磁盘IO的影响我们的key/value对以及Partition的结果都会被写入缓冲区当然写入之前，key与value值都会被序列化成字节数组；

*环形缓冲区其实是一个数组，数组中存放着 key、value 的序列化数据和 key、value 的元数据信息，包括 partition、key 的起始位置、value 的起始位置以及 value 的长度。环形结构是一个抽象概念。*

*缓冲区是有大小限制，默认是100MB。当 map task 的输出结果很多时，就可能会撑爆内存，所以需要在一定条件下将缓冲区中的数据临时写入磁盘，然后重新利用这块缓冲区。这个从内存往磁盘写数据的过程被称为Spill，中文可译为溢写。这个溢写是由单独线程来完成，不影响往缓冲区写 map 结果的线程。溢写线程启动时不应该阻止 map 的结果输出，所以整个缓冲区有个溢写的比例spill.percent。这个比例默认是0.8，也就是当缓冲区的数据已经达到阈值（buffer size * spill percent = 100MB * 0.8 = 80MB），溢写线程启动，锁定这 80MB 的内存，执行溢写过程。Map task 的输出结果还可以往剩下的 20MB 内存中写，互不影响。*
**6、** 当溢写线程启动后，需要对这80MB空间内的key做`排序(Sort)`排序是MapReduce模型默认的行为，这里的排序也是对序列化的字节做的排序；

*如果 job 设置过Combiner，那么现在就是使用 Combiner 的时候了。将有相同 key 的 key/value 对的 value 加起来，减少溢写到磁盘的数据量。Combiner 会优化 MapReduce 的中间结果，所以它在整个模型中会多次使用。*

*那哪些场景才能使用 Combiner 呢？从这里分析，Combiner 的输出是 Reducer 的输入，Combiner 绝不能改变最终的计算结果。Combiner 只应该用于那种 Reduce 的输入 key/value 与输出 key/value 类型完全一致，且不影响最终结果的场景。比如累加，最大值等。Combiner 的使用一定得慎重，如果用好，它对 job 执行效率有帮助，反之会影响 reduce 的最终结果。*
**7、** 每次溢写会在磁盘上生成一个`临时文件`（写之前判断是否有combiner），如果map的输出结果真的很大，有多次这样的溢写发生，磁盘上相应的就会有多个临时文件存在当整个数据处理结束之后开始对磁盘中的临时文件进行`merge合并`，因为最终的文件只有一个，写入磁盘，并且为这个文件提供了一个`索引文件`，以记录每个reduce对应数据的偏移量；

**至此map整个阶段结束。**

### 1.2 ReduceTask工作机制详解

#### 1.2.1 流程图

#### 1.2.2 执行步骤

Reduce 大致分为`copy`、`sort`、`reduce`三个阶段，重点在前两个阶段。copy 阶段包含一个 eventFetcher 来获取已完成的 map 列表，由 Fetcher 线程去 copy 数据，在此过程中会启动两个 merge 线程，分别为 inMemoryMerger 和 onDiskMerger，分别将内存中的数据 merge 到磁盘和将磁盘中的数据进行 merge。待数据 copy 完成之后，copy 阶段就完成了，开始进行 sort 阶段，sort 阶段主要是执行 finalMerge 操作，纯粹的 sort 阶段，完成之后就是 reduce 阶段，调用用户定义的 reduce 函数进行处理。

**详细步骤：**

**1、**`Copy阶段`，简单地拉取数据Reduce进程启动一些数据copy线程(`Fetcher`)，通过HTTP方式请求maptask获取属于自己的文件；

**2、**`Merge阶段`这里的merge如map端的merge动作，只是数组中存放的是不同map端copy来的数值Copy过来的数据会先放入内存缓冲区中，这里的缓冲区大小要比map端的更为灵活merge有三种形式：内存到内存；内存到磁盘；磁盘到磁盘默认情况下第一种形式不启用当内存中的数据量到达一定阈值，就启动内存到磁盘的merge与map端类似，这也是溢写的过程，这个过程中如果你设置有Combiner，也是会启用的，然后在磁盘中生成了众多的溢写文件第二种merge方式一直在运行，直到没有map端的数据时才结束，然后启动第三种磁盘到磁盘的merge方式生成最终的文件；

**3、** 把分散的数据合并成一个大的数据后，还会再对合并后的`数据排序`；

**4、** 对排序后的键值对`调用reduce方法`，键相等的键值对调用一次reduce方法，每次调用会产生零个或者多个键值对，最后把这些输出的键值对写入到HDFS文件中；

### 1.3 MapReduce Shuffle机制

Shuffle 的本意是洗牌、混洗的意思，把一组有规则的数据尽量打乱成无规则的数据。

而在 MapReduce 中，Shuffle 更像是`洗牌的逆过程`，指的是`将map端的无规则输出按指定的规则“打乱”成具有一定规则的数据，以便reduce端接收处理`。

shuffle 是 Mapreduce的核心，它分布在 Mapreduce 的 map 阶段和 reduce 阶段。一般`把从Map产生输出开始到Reduce取得数据作为输入之前的过程称作shuffle`。

**1、**`Partition阶段`：将MapTask的结果输出到默认大小为100M的环形缓冲区，保存之前会对key进行分区的计算，默认Hash分区等；

**2、**`Spill阶段`：当内存中的数据量达到一定的阀值的时候，就会将数据写入本地磁盘，在将数据写入磁盘之前需要对数据进行一次排序的操作，如果配置了combiner，还会将有相同分区号和key的数据进行排序；

**3、**`Merge阶段`：把所有溢出的临时文件进行一次合并操作，以确保一个MapTask最终只产生一个中间数据文件；

**4、**`Copy阶段`：ReduceTask启动Fetcher线程到已经完成MapTask的节点上复制一份属于自己的数据，这些数据默认会保存在内存的缓冲区中，当内存的缓冲区达到一定的阀值的时候，就会将数据写到磁盘之上；

**5、**`Merge阶段`：在ReduceTask远程复制数据的同时，会在后台开启两个线程对内存到本地的数据文件进行合并操作；

**6、**`Sort阶段`：在对数据进行合并的同时，会进行排序操作，由于MapTask阶段已经对数据进行了局部的排序，ReduceTask只需保证Copy的数据的最终整体有效性即可；

**注意：**

- Shuffle 中的缓冲区大小会影响到 MapReduce 程序的执行效率，原则上说，缓冲区越大，磁盘 IO 的次数越少，执行速度就越快。
- 缓冲区的大小可以通过参数调整，参数：mapreduce.task.io.sort.mb，默认100M。

#### 1.3.1 Shuffle的弊端

shuffle 阶段过程繁琐、琐碎，涉及了多个阶段的任务交接。

shuffle 中频繁进行数据内存到磁盘、磁盘到内存、内存再到磁盘的过程，效率极低。

shuffle 阶段，大量的数据从 map 阶段输出，发送到 reduce 阶段，这一过程中，可能会涉及到大量的网络 IO。
