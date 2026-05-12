# 12、Hadoop 入门：hdfs的读写流程
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/12.html
- 分类：大数据框架
- 分组：教程目录
## hdfs的写入流程

文件具体上传流程如下：

- 创建文件：

**1、** HDFSclient向HDFS写数据先调用DistributedFileSystem.create()；

**2、** RPC调用namenode的create()方法，会在HDFS目录树中指定路径，添加新文件；并将操作记录在edits.log中namenode的create()方法执行完后，返回一个FSDataOutPutStream，他是DFSOutPutStream的包装类；

- 建立数据流管道pipeline

**1、** client调用DFSOutPutStream.write()写数据（先写文件的第一个块，暂时称为blk1）；

**2、** DFSOutputStream通过RPC调用namenode的addBlock，向namenode申请一个空的数据块block；

**3、** addBlock返回一个LocatedBlock对象，此对象包含当前blk要存储哪三个datanode信息，比如dn1，dn2，dn3；

**4、** 客户端根据位置信息建立数据流管道；

- 向数据流管道写入当前块的数据

**1、** 写数据时，先将数据写入一个检验块chunk中，写满512字节后，对此chunk计算校验和chunksum值（4字节）；

**2、** 然后将chunk和对应的校验写入packet中，一个packet是64kb；

**3、** 随着源源不断的带校验chunk写入packet，当packet写满之后将其写入dataqueue队列中；

**4、** packet从队列中取出，沿着pipeline发送到dn1，再从dn1发送到dn2，dn2发送到dn3；

**5、** 同时，这个packet也会保存一份到一个确认队列ackqueue中；

**6、** packet到达最后一个datanode即nd3之后会做检验，然后将检验沿结果逆着pipeline方向传回客户端，具体检验结果从dn3传到dn2，dn2做检验，dn2传到dn1，dn1做检验，结果再传回客户端；

**7、** 客户端根据校验结果，如果“成功”，则将保存在ackqueue中的packet删除，如果失败则将packet取出重新放回到dataqueue末尾，等待沿pipeline再次传输；

**8、** 如此将block中一个数据的一个个packet发送出去当block发送完毕，即dn1，dn2，dn3都接收了blk1的副本，那么三个datanode分别RPC调用namenode的blockReceivedAndDeleted()，namenode会更新内存中block与datanode的对应关系（比如dn1上多了个blk1）；

- 关闭三个datanode构建的pipeline，且文件还有下一个块的时候，再从4开始直到全部文件写完

**1、** 最终，调用DFSOutputStream的close()；

**2、** 客户端调用namenode的complete()，告知namenode文件传输完成；

## HDFS写数据-容错

**Q：** 如果在传输过程中dn2挂了，则当前piprline中断，hdfs会怎么样？

**A：** 客户端RPC会调用namenode的updateBlockPipeline()为当前block（假设为blk1）生成新的版本比如ts1（本质上是时间戳），故障dn2会从pipeline中删除。

DFSOutputStream再RPC调用namenode的getAdditionalDatanode()让namenode重新分配datanode假设为dn4。让dn1、dn3、dn4组成新的管道，他们上边的blk1版本设置为新版本ts1.

由于dn4上没有blk1的数据，客户端告诉dn1、dn3将其上的blk1数据拷贝给dn4.

新的管道建立好之后，DFSOutputStream调用updatePipeline()更新namenode元数据。到此，pipeline恢复，客户端继续上传文件。

故障的datanode重启后，namenode发现其上面的blk1的时间戳是老的，会让datanode将blk1删除掉。

## hdfs的读取流程

文件的具体读取流程如下：

**1、** Client端读取hdfs文件，client调用文件系统对象DistributedFileSystem的open方法；

**2、** 返回FSDataInputStream对象（对DFSInputStream的包装）；

**3、** 构造DFSInputStream对象时，调用namenode的getBlockLocation方法，获得file开始的若干个block的存储datanode列表；针对每个block的dn列表，会根据网络拓扑排序，离client近的排在前面；

**4、** 调用DFSInputStream的read方法读取blk1的数据，与client最近的datanode建立连接，读取数据；

**5、** 读取完后，关闭与dn建立的流；

**6、** 重复4、5、6步骤，紧接着读取下一个块的数据，直到这一批块的数据读完；

**7、** 读取下一批块，重复3、4、5、6、7；

**8、** 调用FSDataInputStream的close方法；

## HDFS读数据-容错

**Q：** 读取block数据时，client与datanode连接中断会怎么办？

**A：** client与第二个存储此block的datanode建立连接，存储数据。记录出问题的datanode，不会再从其上读取数据。

**Q：** client读取数据时，发现block块的数据有问题怎么办？

**A：** client读取数据时，同时会读取到block的校验和，若client针对读取的block计算校验和发现与其读取的校验和不一致，说明block损坏。client会从其它存放此block的datanode读取数据，同样会计算校验和，同时告诉namenode此情况。
