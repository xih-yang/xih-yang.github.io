# 25、Spark 教程 - Spark读写Iceberg在腾讯的实践和优化
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/25.html
- 分类：大数据框架
- 分组：教程目录
### Apache Iceberg介绍

首先介绍一下Iceberg。

#### 1. Apache Iceberg-表格式

Iceberg是一种开放的表格式，任何语言都可以遵循Iceberg社区定义的规范实现Iceberg。Apache Iceberg采用Java实现。正如它logo展示的一样， Iceberg可以管理海量的数据，但是向用户暴露的只是很小的一部分。

**Iceberg有一些很好的特性：**

- **支持事务**：可以原子性的进行更新和删除数据
- **可扩展性强**：meta data可以存在对象存储里，不像传统的Hive是存在数据库里
- **支持schema evolution和partition evolution**
- **对存储层做了抽象**：数据可以存在HDFS或者对象存储中，数据格式支持Parquet，ORC和Avro，支持混存，可以改变表的存储位置

#### 2. Iceberg表的组成

Iceberg表由三部分组成，**上层是catalog层，中间是metadata层，下层是数据层。**

Catalog层主要作为指针，指向表的存储位置。实现catalog需要提供原子性更新的操作，像Iceberg内置的HiveCatalog，HadoopCatalog，JDBCCatalog等都可以实现原子性的更新。

- HiveCatalog是通过HMS的lock提供原子性的保证
- HadoopCatalog是由HDFS rename提供原子性的保证
- JDBCCatalog是通过数据库的lock来提供原子性的保证

Metadata层中最上层是JSON格式的metadata file，这个文件存有当前表的schema、partition等表的基础信息，以及很重要的ManifestList位置信息。ManifestList是Avro格式的文件，它由表在当前snapshot下所有的ManifestFile根据partition聚合而成，ManifestFile又是DataFile的聚合。

数据层中的DataFile记录有实际存储数据的文件（如Parquet文件）的地址以及其min-max和partition等文件元信息，用于文件过滤。

#### 3. Iceberg表的ACID特性

Iceberg表的ACID特性是由Catalog来保证的，即更新操作在commit阶段需要持有Catalog锁，而在读写的过程中是不需要持有的。

以这张图为例，使用Spark做了某些原子性更新操作并commit，将表的版本由snapshot n-1转换到了snapshot n，后续由Flink做了一些其他操作，将snapshot n转换为snapshot n+1。这里的更新操作除了对表的增删改之外还包括了表格式的变更，比如改变了表的schema或者增加了table property。

Iceberg支持时间旅行，可以对历史的snapshot进行读取。因此Iceberg的数据读和数据写是可以并行的。

#### 4. Iceberg Evolution

Iceberg对模式演变的支持很好。

**①Schema Evolution**

可以并行地修改表的schema，如增加/删除/修改列。

**②Partition Evolution**

与传统的Spark读Hive或者Parquet不同，Iceberg的partition是隐藏式的。比如创建一个表，这个表的partition是根据created_time这一列做transform得到的，用户读写表的时候不需要加上这个partition列。Partition列也可以被更新，比如原本根据月份做的partition，发现粒度不够细，可以再增加新的partition field以天作为更细粒度的partition，这些用户都是无感知的，并不需要改变写入和查询数据的sql语句。

### Spark读写Iceberg

#### 1. Spark写Iceberg表

Spark读写Iceberg是基于Apache Spark’s DataSourceV2 API实现的。数据读入会根据task plan生成多个WriteTask，每个WriteTask会写成一到多个DataFile。可以设置每个DataFile的target-file-size，比如设置成128M或者512M。每个DataFile记录的是实际存储的文件（如Parquet文件）的meta data信息，比如具体路径，min-max信息，partition信息。这些partition信息会聚合到drive端，生成一个由DataFile组成的列表。DataFile聚合成ManifestFile时partition信息会做聚合，如根据每个DataFile的partition value计算出ManifestFile的partition value的min-max信息，此外，ManifestFile还会记录增加/删除了多少数据。单个ManifestFile的大小默认设置为8M，这些ManifestFile会写成ManifestListFile，作为一个snapshot对应的文件。

#### 2. Spark读Iceberg表

正如前面所介绍的，Iceberg存在很多Metadata文件，Spark在读Iceberg表时通过读这些Metadata文件可以实现高效的文件过滤。

首先根据partition summary进行文件过滤。如图，读取snapshot对应的ManifestFileList可以读到三个ManifestFile，然后根据where条件加上partition summary的min-max信息就可以过滤掉两个ManifestFile。这里的ManifestFile是Avro的文件，其中每条记录就是一个DataFile。根据每个DataFile的partition value和metrics信息还可以做进一步的过滤，最后只有三个文件需要进行真正的读取。

执行时Spark会将大的文件拆分成多个task，小的文件合并成一个task，每个task对应一到多个DataFile。因为Iceberg支持schema evolution，要读取的DataFile的schema和当前表的schema可能不匹配，因此需要做一个projection来保证返回的数据的schema和当前表的schema是相匹配的。

#### 3. Iceberg文件过滤

前面提到，Iceberg是隐藏的分区，查询时不需要添加关于partition的筛选条件，那么它是怎么通过partition做到文件过滤的？

首先创建表，此时表的partition spec ID为0，接着写入数据，DataFile会记录写入数据的partition spec，此时是0。接着这里对表增加了基于天的partition field，此时表的partition spec ID变为1，然后再写入数据，这些数据的patition spec就是1。

在查询的时候，如图下方第一行是用户写的查询语句，但是Iceberg在真正的task plan时会额外加上partition filter，比如这里会对created_time做一个projection：对于spec为0的数据，使用month作为过滤条件；对于spec为1的数据，除了month的过滤条件还会加上day的过滤条件。

这些操作对用户都是透明的，即用户不需要关注具体的partition filed或者partition value来更改查询语句。

#### 4. MOR-Position/Equality Delete

下面介绍一下Iceberg的upsert。Upsert有两种实现方式：copy on write和merge on read。

- copy on write：实现方式类似Spark的overwrite
- merge on read：Iceberg对merge on read的实现是写时生成DeleteFile，在读的时候将DeleteFile应用到DataFile上

DeleteFile有两种方式：Position Delete和Equality Delete。

**（1）Position Delete**

- 文件里记录的是哪个文件（file_path）的第几条记录（pos）需要被删除。
- 写Position Delete需要先读取DataFile，然后根据过滤条件判断哪些记录需要被删除，再写成Position DeleteFile。写入较慢，因为需要先进行task scan找到对应的文件，然后再写数据。
- Spark的MOR目前只支持Position Delete。

**（2）Equality Delete**

- 文件里记录的是过滤条件，写入的速度快，读的速度慢，因为并不能准确的定位到文件，可能读了很多的DataFile，但是并不一定被删除，即apply的过程较慢。
- Flink的CDC场景记录的就是这种方式。

#### 5. Upsert-COW

这张图展示了在Iceberg中通过COW实现upsert的方式。

Upsert分为两部分：

- 找到需要更新的数据，将这些数据删掉
- 写入新数据

COW是很直观的过程，首先table scan会根据筛选条件找出所有需要更新的DataFile，接着在write的阶段会生成新的DataFile替换掉原来的DataFile，旧的DataFile被标记为删除。

#### 6. Upsert-MOR

MOR第一阶段和COW类似，会根据筛选条件找到待更新的DataFile。

写入数据时不会删除这些旧的DataFile，只会生成新的DataFile，这种操作出现在update和upsert场景中。删除标记是通过DeleteFile来记录的，图中写出了两个Position DeleteFile记录DataFile中需要被删除的记录。

在读的时候会读Position DeleteFile应用到旧DataFile后的数据，加上新生成的DataFile，最后得到更新之后的结果。

### Iceberg生产实践

#### 1. 挑战1-宽表

这里选取了一个案例，就是腾讯的一个日志平台，希望用Iceberg对他们所有的日志文件做统一的管理，下面介绍在改造的过程中我们遇到的一些问题以及相应的解决方案。

前面已经介绍了Spark在write的时候会将所有的DataFile给collect到driver端，再进行commit操作。每个DataFile都需要记录很多列的metrics信息，如column_sizes、value_counts、min-max信息等，这些字段其实是map类型，所以理论上列的数量越多DataFile的体积就会越大。

我们遇到的情况就是日志平台的表会特别宽，有几千到几万个列，批量往Iceberg写数据时driver端直接就OOM了。

**于是我们就做了一个优化，不是等所有的DataFile都collect到driver端才进行commit操作**。因为task有执行的先后，数据也不是同时到达，所以我们在driver端收集到一定数量的DataFile时就将它们写成一个ManifestFile，任务结束后driver端只会有一些ManifestFile，此时再把这些ManifestFile commit到Iceberg里面。

Iceberg也有两个table property用于设置是否记录列的metrics信息。

因为有些列不会作为用户读取数据时的筛选条件，不需要统计它们的metrics信息。对于这些不必要的列可以根据情况将这两个table property设置为none。

- “write.metadata.metrics.column.col1”对col1列进行设置。
- “write.metadata.metrics.default”对所有的列进行设置。

#### 2. 挑战2-schema变动频繁

第二个挑战就是作为许多业务的下游，日志平台的数据来源的schema会经常变动，所以在写入Iceberg时会涉及到schema不匹配的情况。

Iceberg是支持schema evolution的，比较容易解决这种情况，但是对用户不太友好。从HDFS中读出来了一个DataFrame，需要先判断这个DataFrame的schema和Iceberg当前表的schema是否匹配，如果不匹配的话需要先update这个schema再进行写操作，这个过程就需要用户对Iceberg和Spark比较了解，而且这中间改还可能出现一些问题。

**所以我们就做了“auto-merge-schema”这个feature：从Iceberg读数据到再写之前会自动判断DataFrame的schema和Iceberg的schema是否匹配，如果不匹配会先做merge，再写入数据。**这样用户就不需要关心写入数据的schema和表的schema是否匹配的问题，只需要把数据通过Spark的DataFrameWriter写进去就可以了。

**目前Iceberg社区也已经支持写入时自动匹配schema，可以通过两种方式实现：**

- 设置TableProperties:”write.spark.accept-any-schema”为true。如果对DataSourceV2 API比较熟悉的话就会知道， Spark默认在plan的时候会检查写入的DataFrame和表的schema是否匹配，不匹配就抛出异常。所以需要增加一个TableCapability（TableCapability.ACCEPT_ANY_SCHEMA），这样Spark就不会做这个检查，交由具体的DataSource来检查。
- df.writeTo(tableName).option(“merge-schema”, “true”).XX。

#### 3. 挑战3-Schema变动影响文件过滤

第三个就是schema evolution会影响文件过滤。支持schema evolution之后用户对schema变动比较多，可应用的场景也比较多。

比如像深度学习的场景，用户读取数据时往往并不需要读全部的列，有时会新增一些列，有时会删除一些列。我们在帮用户排查时发现了下面的问题：

如上图所示，首先蓝色的这三个DataFile是由schema0写入的，这个schema有两个列，分别是id和name。

**这时候做了一个schema evolution，新增了一个列address，此时再写入了两个DataFile，然后做了一个filter查询，这个查询条件是id > 10并且address是start_with ‘some value’，之后进行table plan的时候会比较慢，因为读到了很多不相关的DataFile。**

之所以会读到这些DataFile，前面介绍了Iceberg在做table plan的时候其实主要是根据min-max和partition value信息做文件过滤，但蓝色的三个DataFile中根本没有address信息，可以理解为都是none的，更没有min-max信息，所以Iceberg没法做判断，这些数据都会被读出来。

#### 4. 基于Schema过滤文件

**针对上述问题，我们基于schema做了一个文件过滤。**当写入ManifestFile和DataFile时新添加了SchemaID字段表示写入当前表时的schema，Iceberg table metadata中通过map结构存有SchemaID和schema的映射关系，比如图中SchemaID为0时表的schema是由id和name两个字段组成，SchemaID为1时新增了address字段，此外，还会存在当前表默认的SchemaID。将SchemaID信息加到ManifestFile和DataFile里有助于我们后续进行文件过滤。

**举个例子，**这里有四个ManifestFile，前两个的Schema ID都是0，第三个是1，第四个是-1，-1表示文件的schema未知，即组成此ManifestFile的DataFile部分Schema ID为0，部分为1。在进行filter条件过滤时，筛选条件中包含了address字段，而Schema ID为0时不存在address字段，所以会过滤掉黄色的两个ManifestFile，还剩两个ManifestFile。第三个ManifestFile已经能保证其所有的DataFile的Schema ID都是1，因此就不需要做进一步的过滤了。对于Schema ID为 -1 的ManifestFile还需要做进一步的DataFile级别的过滤，这里就是把Schema ID为0的DataFile过滤掉，所以最终只需要读五个DataFile就可以了。

#### 5. 其余优化项

刚才讲了一些具体的案例，现在介绍下我们围绕Spark读写Iceberg还做的一些别的优化。

**①ZOrder优化文件布局**

这个其实是比较常见的，大家比较熟悉的像是Iceberg，Hudi和Delta Lake都已经支持了，我们也用了一年多了，效果还不错。文件过滤很多都是基于min-max信息来做的，如果文件与文件之间尽可能不耦合的话就可以过滤掉更多的DataFile，减少需要读取的文件。ZOrder可以认为是sort的变种，在Spark中，单列的sort对文件的过滤是比较友好的，但如果sort by多列的话，会首先对column0做sort，然后column0相同的时候再做column1的sort，所以如果过滤的where条件是column1或者column2的时候文件过滤效果就不是很好。ZOrder过滤通过bit位的交互将多个column的sort by映射到一维空间，可以认为它们是线形的，这样一来filter条件中是filter column1还是column2或是column的任意组合，都在一个维度中，因此尽可能减少了不同DataFile之间min-max信息的重叠，可以过滤掉很多不需要读的文件，效果比较好。

**②Parquet BloomFilter**

Iceberg 目前还没有支持 Parquet 的 BloomFilter索引，我们内部已经实现了。通过table property来控制对哪些列开启Parquet BloomFilter索引，主要是对点查的加速。目前社区也已经有实现Patch了。

**③Iceberg 索引**

与Parquet BloomFilter不同，这里的Iceberg索引是独立于文件格式的索引，可以实现更多的索引加速。目前内部接近上线了。

**④优化Parquet Vectorized Read Decimal**

Iceberg的向量化读不是采用Spark读Parquet/ORC的那一套，而是基于Apache Arrow实现的。我们在跑TPCDS的时候发现Iceberg Parquet的向量化读的性能和Spark是有差距的，主要原因是在读取Decimal时差距比较大。这里我们对Decimal的向量化读做了优化，在1TB TPCDS数据集上，对store_sales表full table scan有近两倍的性能提升。

**⑤多线程Plan Task，并发或者分布式的删除文件**

早期版本的Iceberg plan task都是单线程的，当表的规模特别大，文件数量特别多的时候，性能就会急剧下降，还有像删除文件时也是，我们将它们都改成了并发或者分布式的实现。

**⑥View的支持**

这个是出于业务方的需要，因为Spark采用的是DataSourceV2 API，对view的支持不是很友好，从Spark3.3开始可能才只是有部分的API支持，实际目前还没有，我们内部已经自己实现了view的支持。

### 数据治理服务

后面介绍一下我们围绕Iceberg所做的数据治理服务。

#### 1. 数据治理服务总览

这是一个数据治理服务的总览。数据通过MQ或者CDC之类的方式流入Iceberg表，中间这些都是当前基于Spark实现的异步的服务。Compaction Service是指自动合并小文件：主要监控表文件的数量，做一个异步的compaction。然后clean up metadata files，这个就是后面会介绍到的expire snapshot。Clustering Service主要指ZOrder这种，通过优化文件布局，可以更高效的进行文件过滤。此外，还有一些clean service。右边这里画的就是通过像BI之类的方式，向用户展示出表的一些情况。

#### 2. Expire Snapshots

为什么要做expire snapshot，如果对Iceberg比较了解的话可能对此比较熟悉，那就是因为Iceberg会保留很多的snapshots，以上图为例。当前我们在snapshot n，此时查看HDFS文件大小是100GB，然后用户做了一个delete的操作将一个DataFile标记为删除了，snapshot变为n+1，但是用户这时候查HDFS会抱怨执行了删除操作后HDFS文件并没有减小，还是100G，所以就会产生一些误解。这里之所以DataFile被标记为delete但是没有被直接删除是因为在snapshot n的时候它还reference了DataFile。

接着他再做了一个更新操作后这个表变为120G，如果没有expire snapshot的话这个表真实存在于HDFS上的体积是线形增长的，会一直增加不会减少。Expire snapshot是Iceberg提供的表的管理工具，可以通过Spark SQL或者Spark具体的action来执行。比如这里expire掉历史的snapshot，只保留snapshot n+2，前面的snapshot都不要了，这时候没有snapshot reference被标记为删除的DataFile了，才将它真正的删除，这时候表的大小就变为80G了。

由于用户可能不太了解Iceberg的一些概念，不清楚该如何执行这一块，因此我们做了统一的数据治理服务，用户只需要把这个选项勾上就会自动的执行。

#### 3. 合并小文件

合并小文件的原因是DataFile大小有可能不均匀。因为Iceberg是支持多种引擎写入的，比如Spark Batch，Spark Streaming或者Flink的方式，不同引擎写入的情况或者速度都不一样，所以DataFile本身有大小的区别，还有就是像CDC之类的场景会有一些DeleteFile，这些都会影响读的效率。

图中为合并小文件和clustering服务。首先就是BinPack，把大文件拆分成小文件，小文件合并成大文件，同时再apply上DeleteFile，是一个将原始DataFile通过combine写成差不多大小的DataFile，同时加一个merge on read的过程。

Sort对于列比较少、尤其是单列的情况，做文件过滤的效果比较好。还有前面介绍的ZOrder，通过clustering技术来做合并小文件同时优化文件布局。

#### 4. 列生命周期管理

最后介绍一下列的生命周期管理。

Iceberg表有很多列，但是并非所有的列都有价值。比如上图中这个表有四个列，times是指被查询的次数，可以看到前三列被使用的频率很高，比如在深度学习或者机器学习的场景中，需要对模型进行训练，查询之后发现加了这个dog_color的值对训练模型的收敛等并不会有很大帮助，所以后来就不再查这一列了，也就是对业务真正有价值的只是前面的三列。而数据还是在源源不断地写入，第四列一直占用存储空间。于是我们就做了一个列的生命周期管理，就是在query的时候会把查询了哪些列报告给数据治理服务，数据治理服务会做一个统计，用户可以设置对应的列被查询多少次才认为它是有价值的。

比如用户设置的10次，而这个dog_color在一定的时间内被查询的次数不满足这个条件，就会触发一个Spark job，Spark job就会把这个column给删除，并把数据清理掉。目前我们主要采用的通过rewrite，把这些数据从物理上给删除。当然我们现在也在考虑通过像HBase这种column family来实现，就可以更高效的删除，但是这样就改了Parquet这种实现，可能会对不同引擎的兼容性有问题。
