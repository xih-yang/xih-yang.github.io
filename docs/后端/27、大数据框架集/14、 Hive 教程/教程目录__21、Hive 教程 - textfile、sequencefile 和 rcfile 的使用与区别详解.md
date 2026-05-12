# 21、Hive 教程 - textfile、sequencefile 和 rcfile 的使用与区别详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/21.html
- 分类：大数据框架
- 分组：教程目录
## 一、引言

hive在创建表时默认存储格式是textfile，或者显示自定义的stored as textfile。很多人知道hive常用的存储格式有三种，textfile,sequencefile,rcfile.但是却说不清楚这三种格式的干什么用的，本质有有什么区别？适合什么时候用？

## 二、思考

**为什么hive会有多种存储格式**？因为hive是文本批处理系统，所以就存在一个往hive中导入数据的问题，首先数据的存储格式有多种，比如数据源是二进制格式， 普通文本格式等等，而hive强大之处不要求数据转换成特定的格式，而是利用hadoop本身InputFormat API来从不同的数据源读取数据，同样地使用OutputFormat API将数据写成不同的格式。所以对于不同的数据源，或者写出不同的格式就需要不同的对应的InputFormat和Outputformat类的实现。

以stored as textfile（其实这就是下面 **stored as inputformat -outputformat** 的缩减写法）为例，其在底层 java API中表现是输入InputFormat格式：TextInputFormat以及输出OutputFormat格式：HiveIgnoreKeyTextOutputFormat。这里InputFormat中定义了如何对数据源文本进行读取划分，以及如何将切片分割成记录存入表中。而Outputformat定义了如何将这些切片写回到文件里或者直接在控制台输出。

```java
  STORED AS INPUTFORMAT 
           'org.apache.hadoop.mapred.TextInputFormat' 
  OUTPUTFORMAT 
          'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
```

实际上hive使用一个TextInputFormat对象将输入流分割成记录，然后使用一个HiveIgnoreKeyTextOutputFormat对象来将记录格式化为输出流（比如查询的结果），再使用Serde在读数据时将记录解析成列。在写数据时将列编码成记录。所以stored as ''只是决定了行级别（记录级别 ）的存储格式，而实际将记录解析成列依靠的则是Serde对象，比如hive默认的ROW FORMAT SERDE ‘org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe’ 。或者用户自定义的Serde格式。

## 三、textfile、sequencefile 和 rcfile 的三种存储格式的本质和区别

文件存储编码格式
建表时如何指定
优点弊端

textfile

文件存储就是正常的文本格式，将表中的数据在hdfs上 以文本的格式存储

，下载后可以直接查看，也可以使用cat命令查看

**1、** 无需指定，默认就是；

**2、** 显示指定storedastextfile；

**3、** 显示指定 ；

STORED AS INPUTFORMAT

   'org.apache.hadoop.mapred.TextInputFormat'

  OUTPUTFORMAT           'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'

**1、** 行存储使用textfile存储文件默认每一行就是一条记录，；

**2、** 可以使用任意的分隔符进行分割；

**3、** 但无压缩，所以造成存储空间大可结合Gzip、Bzip2、Snappy等使用（系统自动检查，执行查询时自动解压），但使用这种方式，hive不会对数据进行切分，从而无法对数据进行并行操作；

sequencefile

在hdfs上将表中的数据以二进制格式编码，并且将数据压缩了，下载数据

以后是二进制格式，不可以直接查看，无法可视化。

**1、** storedassequecefile；

**2、** 或者显示指定：；

STORED AS INPUTFORMAT

  'org.apache.hadoop.mapred.SequenceFileInputFormat'

OUTPUTFORMAT

 'org.apache.hadoop.hive.ql.io.HiveSequenceFileOutputFormat'

**1、** sequencefile存储格有压缩，存储空间小，有利于优化磁盘和I/O性能；

**2、** 同时支持文件切割分片，提供了三种压缩方式：none,record,block（块级别压缩效率跟高）.默认是record(记录)；

**3、** 基于行存储；

rcfile
在hdfs上将表中的数据以二进制格式编码，并且支持压缩。下载后的数据不可以直接可视化。

**1、** storedasrcfile ；

**2、** 或者显示指定：；

STORED AS INPUTFORMAT

  'org.apache.hadoop.hive.ql.io.RCFileInputFormat'

OUTPUTFORMAT

  'org.apache.hadoop.hive.ql.io.RCFileOutputFormat'

**1、** 行列混合的存储格式，基于列存储；

**2、** 因为基于列存储，列值重复多，所以压缩效率高；

**3、** 磁盘存储空间小，io小；
