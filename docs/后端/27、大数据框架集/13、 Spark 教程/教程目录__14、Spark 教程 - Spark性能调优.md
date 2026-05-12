# 14、Spark 教程 - Spark性能调优
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/14.html
- 分类：大数据框架
- 分组：教程目录
#### 一、概述

在大数据领域，肯定有很多小伙伴跟笔者一样为了让生产中数据执行速度更快、性能更高而去使用Spark，当我们用Spark程序实现功能开发并使程序正常稳定运行起来的时候，一定是非常有成就感的；但是随着数据量的增加以及需求的完善，我们就开始关注我们这个程序能否做到在运行起来的时候让数据查询更快、让页面响应更快、尽可能的节省空间占用率；而前面提到这些"美好的设想"其实是由很多方面决定的，由很多部分组成，并不是仅仅通过调节几个参数就可以大幅度提升作业性能的。我们需要结合实际应用场景对Spark作业进行综合分析并进行调整，才能获得更好的性能。而这些就需要我们这些大数据开发者重构代码或者调整各种配置参数或者从数据倾斜方面进行优化，之前的文章中有提到过数据倾斜方面的优化，本文就不对数据倾斜一一赘述了，下面将由我从参数调优和代码重构两个方面为各位小伙伴进行相关Spark作业优化的讲解。

#### 二、资源参数调优

在我们进行代码重构之前，我们首先考虑到的应该是可以通过调节哪些参数，从而达到通过优化资源使用率提升Spark作业执行性能的目的，当我们把各个参数调到相对最优，这时候再进行代码重构，等于将Spark程序执行效率实现从老牛拉破车→绿皮火车→子弹头高铁的速度跨越。在实际生产中，我们使用Spark时候有三种方式来设置资源参数，按照优先级排序依是：

- （1）代码中显示调用 set()方法设置；
- （2）通过 Spark-submit 传递参数；
- （3）配置文件。

当以上三种方法均没有设置参数值时，Spark将使用系统默认值，下面我将对主要参数的配置为各位进行简单阐述：

### 参数调优

- ① num-executors
- 该参数用于设计Spark作业总的Executor进程的个数。YARN集群管理器会尽可能根据num-executor设置在工作节点上启动 Executor。Spark默认只会启动很少的进程，如果我们不及时对此参数进行调整，这时并行度不够，任务执行速度十分缓慢。一般为每个Spark作业设置 50~100个Executor，设置 Executor太多大部分队列无法给予充分的资源；设置 Executor太少无法充分利用集群性能。
- ② executor-memory
- 该参数用于设置每个Executor 进程的内存，Executor内存的大小，很多程度上直接决定了 Spark 作业的性能，而且跟很常见的 Java中的虚拟机内存溢出异常(oom)也有关系。所以建议每个Executor进程的内存设置4G～8G较为合适，但是这也只是一个参考值，具体设置还需要根据队列中任务的多少以及最大内存资源来设置，根据经验，内存最好不要超过资源队列的最大内存的1/3～1/2
- ③ executor-core
- 该参数用于设置每个Executor进程的 CPU core 数量。因为每个CPU core同一时间只能执行一个 task 线程，所以executor-core 的个数决定了 Executor 进程的并发线程能力。该参数设置为 2-4 比较合适。
- 下面以我们生产中为例：为各位小伙伴具体讲解关于① num-executors、② executor-memory、③ executor-core的调优：

```java
配置：
3台 48核 64GB
具体调参如下：
考虑Linux运行及程序、Hadoop、Yarn等守护进程等，约占5%-10%，每台预留3核心以及4G内存。
为每个执行器分配3个核心
--executor-cores = 3
 
每个节点除去预留核心，剩下： 48-3 = 45
群集中核心的可用总数： 45 x 3 = 135
 
–-num-executors = 群集中核心的可用总数/每个executors分配3核心数
                = 135/3 
                = 45
每个节点的executors数目： 45/3 = 15
群集中每个节点的可使用的总内存数： 64GB - 4GB = 60GB
 
--executor-memory = 每个executor的内存= 60GB / 15 
                  = 4GB
 
预留的 off heap overhead = 4GB * Max(384MB, 7% of 4GB)
--executor-memory = 4 - 384M 
                  ≈ 4GB
PS:经参数调优以及测试之后，此为最佳num-executors、executor-memory、executor-core数目设置
```

- ④ driver-memory
- 该参数用于设置Driver进程的内存。这个参数通常不设置，driver运行内存默认值512MB，一般设置1G~4G；但是要注意的一点是，使用collect算子时，一定要保证 Driver 内存足够大，否则会出现内存溢出的错误。
- ⑤ Spark.default.parallelism
- 该参数用于设置每个Stage默认的task数量。该参数使用默认值时，Spark会根据底层HDFS的block数量设置task数量，通常一个block对应一个task，这样task的数量通常是偏少的。由于task是真正执行Spark作业的线程，如果task数量太少，那么Executor中将面临有足够资源却没有task执行的窘境，针对Executor所做的优化也将前功尽弃。所以设置原则为num-executors&executor-cors的2-3倍较为合适。如果executor的总cpu core数量为144个，那么设置500个task是可以的，此时可以充分的利用Spark集群的资源。
- ⑥ Spark.storage.memoryFraction
- 该参数针对Spark1.6之前，用于设置RDD持久化数据在Executor内存中能占的比例，默认是0.6。也就是说，默认Executor 60%的内存，可以用来保存持久化的 RDD 数据。当Spark作业中有较多RDD需要进行持久化操作时，可以将该参数值调高；当Spark作业中有较少RDD需要进行持久化操作时，可以将该参数值调低。
- ⑦ Spark.Shuffle.memoryFraction
- 该参数用于设置Shuffle过程中一个task拉取到上个Stage的task的输出后，进行聚合操作时能够使用的Executor内存的比例，默认是0.2。也就是说，Executor默认只有20%的内存用来进行该操作。shuffle操作在进行聚合时，如果发现使用的内存超出了这个20%的限制，那么多余的数据就会溢写到磁盘文件中去，此时就会极大地降低性能。建议：如果Spark作业中的RDD持久化操作较少，shuffle操作较多时，建议降低持久化操作的内存占比，提高shuffle操作的内存占比比例，避免shuffle过程中数据过多时内存不够用，必须溢写到磁盘上，降低了性能。此外，如果发现作业由于频繁的gc导致运行缓慢，意味着task执行用户代码的内存不够用，那么同样建议调低这个参数的值。

#### 三、代码重构调优

### 1 优化RDD

(1)创建新 RDD 的开销；

(2)从外部系统中加载数据到RDD中的开销；

(3)重复计算的开销。

①避免创建重复的RDD

通常来说，一个Spark作业就是对某个数据源创建RDD，然后对这个RDD进行转化和行为操作。通过转化操作，得到下一个RDD；通过行为操作，得到处理结果。在开发过程中需要注意，对于同一份数据，只应该创建一个 RDD，不能创建多个RDD代表同一份数据。使用多个RDD代表同一份数据源时常常会增加作业的性能开销，这些开销包括：

②尽可能复用一个RDD

在对不同的数据执行算子操作时应该尽量复用一个 RDD。例如，当 RDD A的数据格式是key-value类型的，RDD B的数据格式是value类型的，但是这两个RDD的value数据完全相同；那么，RDD A包含了RDD B中的所有信息，理论上来说RDD B可以被替代，而实际开发中也应该尽量减少多个RDD数据有重复或者包含的情况，这样可以尽可能减少RDD的数量从而减少算子执行的次数。

③对多次使用的RDD进行持久化

- (1)MEMORY_ONLY性能最高，直接将RDD存储在内存中，省去了序列化及反序列化、从磁盘读取的时间，但是对于内存的容量有较高的要求；
- (2)MEMORY_ONLY_SER会将数据序列化后保存在内存中，通过序列化压缩了RDD的大小，但是相较于MEMORY_ONLY多出了序列化及反序列化的时间；
- (3)MEMORY_AND_DISK_SER优先将RDD缓存在内存中，内存缓存不下时才会存在磁盘中;
- (4)DISK_ONLY和后缀为_2的级别通常不建议使用，完全基于磁盘文件的读写会导致性能的极具降低；后缀为2的级别会将所有数据都复制一份副本到其他节点上，数据复制及网络传输会导致较大的性能开销。
- RDD的持有化有几种不同的级别，分别是：MEMORY_ONLY、MEMORY_AND_DISK、MEMORY_ONLY_SER、MEMORY_AND_DISK_SER、DISK_ONLY、MEMORY_ONLY_2 等，这几种持久化级别使用的优先级排序如下：

**如何选择一种最合适的持久化策略?**

如果纯内存的级别都无法使用，那么建议使用**MEMORY_AND_DISK_SER**策略，而不是MEMORY_AND_DISK策略。因为既然到了这一步，就说明RDD的数据量很大，内存无法完全放下。序列化后的数据比较少，可以节省内存和磁盘的空间开销。同时该策略会优先尽量尝试将数据缓存在内存中，内存缓存不下才会写入磁盘。通常不建议使用DISK_ONLY和后缀为2的级别：因为完全基于磁盘文件进行数据的读写 ，会导致性能急剧降低，有时还不如重新计算一次所有RDD。后缀为2的级别，必须将所有数据都复制一份副本，并发送到其他节点上，数据复制以及网络传输会导致较大的性能开销，除非是要求作业的高可用性，否则不建议使用。

```java
object Demo1Cache {
  def main(args: Array[String]): Unit = {
    val spark: SparkSession = SparkSession
      .builder()
      .master("local")
      .appName("cache")
      .config("spark.sql.shuffle.partitions", 1)
      .getOrCreate()
    val sc: SparkContext = spark.sparkContext
    val studentsRDD: RDD[String] = sc.textFile("data/students.txt")
    /**
     * 当对同一个rdd进行多次使用的时候可以将rdd缓存起来
     *
     */
    //缓存级别是MEMORY_ONLY
    //studentsRDD.cache()
    //内存放不下放磁盘，同时会对数据做序列化，将一个分区的数据序列化从一个字节数组
    studentsRDD.persist(StorageLevel.MEMORY_AND_DISK_SER)
    /**
     * rdd: rdd.cache
     * df : df.cache
     * sql: cache table student,  uncache table studnet
     */
    /**
     * 统计班级的的人数
     *
     */
    studentsRDD
      .map(stu => (stu.split(",")(3), 1))
      .reduceByKey(_ + _)
      .map {
        case (clazz: String, num: Int) =>
          s"$clazz\t$num"
      }
      .saveAsTextFile("data/cache/clazz_num")
    /**
     * 统计性别的人数
     *
     */
    studentsRDD
      .map(stu => (stu.split(",")(3), 1))
      .reduceByKey(_ + _)
      .map {
        case (gender: String, num: Int) =>
          s"$gender\t$num"
      }
      .saveAsTextFile("data/cache/gender_num")
    /**
     * 清空缓存
     */
    studentsRDD.unpersist()
    while (true) {
    }
  }
}
```

### 2 优化算子

①尽量避免使用Shuffle算子 Spark作业最消耗性能的部分就是Shuffle过程，应尽量避免使用Shuffle算子。Shuffle过程就是将分布在集群中多个节点上的同一个 key，拉取到同一个节点上，进行聚合或者join操作，在操作过程中可能会因为一个节点上处理的key过多导致数据溢出到磁盘。由此可见，Shuffle过程可能会发生大量的磁盘文件读写的 IO 操作，以及数据的网络传输操作，Shuffle过程如下图 所示。

Shuffle类算子有：**distinct**、**groupByKey**、**reduceByKey**、**aggregateByKey**、**join**、**cogroup**、**repartition**等，编写Spark作业程序时，应该尽量使用map类算子替代Shuffle 算子。

②使用高性能算子

**1、** 使用reduceByKey/aggregateByKey替代groupByKey；

**2、** 使用mapPartitions替代普通mapTransformation算子；

**3、** 使用foreachPartitions替代foreachAction算子；

**4、** 使用filter之后进行coalesce操作；

**5、** repartition:coalesce(numPartitions，true)增多分区使用这个；

**6、** coalesce(numPartitions，false)减少分区，没有shuffle只是合并partition；

```java
1 使用reduceByKey/aggregateByKey替代groupByKey
实例如下：
object Demo2AggregateByKey{
  def main(args: Array[String]): Unit = {
    val spark: SparkSession = SparkSession
      .builder()
      .master("local")
      .appName("Demo2AggregateByKey")
      .config("spark.sql.shuffle.partitions", 1)
      .getOrCreate()
    val sc: SparkContext = spark.sparkContext
    val studentsRDD: RDD[String] = sc.textFile("data/students.txt")
    val clazzKvDS: RDD[(String, Int)] = studentsRDD.map(stu => (stu.split(",")(4), 1))
    /**
     * aggregateByKey: 需要两个函数，一个是map端预聚合的函数，一个reduce端汇总的函数
     * reduceByKey map端和reduce端聚合函数是一样，
     * 如果map端和reduce端要写不一样的聚合函数可以使用aggregateByKey
     */
    val countRDD: RDD[(String, Int)] = clazzKvDS.aggregateByKey(0)(
      (u: Int, i: Int) => u + i,//在map端做聚合函数
      (u1: Int, u2: Int) => u1 + u2//在reduce端做聚合的函数
    )
    countRDD.foreach(println)
  }
}
2 使用mapPartitions替代普通map Transformation算子
实例如下：
object Demo3MapPartition {
  def main(args: Array[String]): Unit = {
    val spark: SparkSession = SparkSession
      .builder()
      .master("local")
      .appName("cache")
      .config("spark.sql.shuffle.partitions", 1)
      .getOrCreate()
    val sc: SparkContext = spark.sparkContext
    val dataRDD: RDD[String] = sc.textFile("data/students.txt")
    val kvRDD: RDD[(String, String, String)] = dataRDD.mapPartitions(iter => {
      iter.map(line => {
        //如果只是简单的拆分数据，使用map和mappartition没有区别
        val split: Array[String] = line.split("\t")
        (split(0), split(1), split(2))
      })
    })
    val resultRDD: RDD[(String, Long, String)] = kvRDD.mapPartitions(iter => {
      /**
       *
       * 可以将一些初始化的代码放在mapPartitions中，减少占用的内存空间
       */
      //将时间字段转换成时间戳
      //在这里创建的对象，是一个分区创建一个
      val format = new SimpleDateFormat("yyyy/MM/dd")
      iter.map {
        case (id: String, sdate: String, p: String) =>
          val dateObj: Date = format.parse(sdate)
          val ts: Long = dateObj.getTime
          (id, ts, p)
      }
    })
    resultRDD.foreach(println)
  }
}
3 使用foreachPartitions替代foreach Action算子
实例如下：
object Demo4ForeachPartition {
    def main(args: Array[String]): Unit = {
      val spark: SparkSession = SparkSession.builder()
        .master("local")
        .appName("foreach")
        .getOrCreate()
      val rdd1: RDD[String] = spark
        .sparkContext
        .textFile("data/student.txt", 4)
      println(rdd1.getNumPartitions)
      /*
        * foreachPartition: 遍历一个分区的数据
        * 如果需要将数据保存到外部数据库，使用foreachPartition代替foreach
        * foreachPartition 每一个分区只会创建一个连接
        */
      rdd1.foreachPartition(iter => {
        //这里的代码每一个分区只会执行一次
        //每一个分区只会建立一个连接
        Class.forName("com.mysql.jdbc.Driver")
        val con: Connection = DriverManager.getConnection("jdbc:mysql://localhost:3306/student?useUnicode=true&characterEncoding=utf-8", "root", "123456")
        println("连接建立成功")
        //遍历一个分区的数据
        iter.foreach(line => {
          val stat: PreparedStatement = con.prepareStatement("insert into student(id,name,age,gender,clazz) values(?,?,?,?,?)")
          val split: Array[String] = line.split(",")
          stat.setString(1, split(0))
          stat.setString(2, split(1))
          stat.setInt(3, split(2).toInt)
          stat.setString(4, split(3))
          stat.setString(5, split(4))
          //插入数据
          stat.executeUpdate()
        })
        //关闭连接
        con.close()
      })
    }
}
4 使用filter之后进行coalesce操作
5 repartition:coalesce(numPartitions，true)增多分区使用这个
6 coalesce(numPartitions，false)减少分区，没有shuffle只是合并partition
4 5 6实例如下：
object Demo5FilterCoalesceRepartition {
  def main(args: Array[String]): Unit = {
    val sparkConf = new SparkConf().setMaster("local[*]").setAppName("Operator")
    val sc = new SparkContext(sparkConf)
    val rdd = sc.makeRDD(List(1, 2, 3, 4, 5, 6,7,8,9,10,11,12),3)
    val result = rdd.filter(
      item => item % 2 == 0
    )
    result.collect().foreach(println)
    print("-------------------以上为filter结果，以下为先filter后coalesce结果----------------------------------")
    // 缩减分区：coalesce，如果想要数据均衡，可以采用shuffle
    val coalesce_result = result.coalesce(2,true)
    coalesce_result.collect().foreach(println)
    print("--------------------以上为先filter后coalesce结果，以下为先filter后repartition结果-------------------")
    // 扩大分区：repartition, 底层代码调用的就是coalesce，而且肯定采用shuffle
    val repartition_result = result.repartition(6)
    repartition_result.collect().foreach(println)
    print("--------------------以上为先filter后repartition结果，以下为coalesce(numPartitions，false)减少分区结果")
    // coalesce(numPartitions，false) 减少分区，没有shuffle只是合并partition
    val coalesce_falseresult = result.coalesce(2,false)
    coalesce_falseresult.collect().foreach(println)
    sc.stop()
  }
}
7 使用repartitionAndSortWithinPartitions替代repartition与sort类操作代码
实例如下：
//创建key类，key组合键为grade，score
case class StudentKey(grade:String,score:Int)
object StudentKey {
  implicit def orderingByGradeStudentScore[A <: StudentKey] : Ordering[A] = {
    Ordering.by(fk => (fk.grade, fk.score * -1))
  }
}
object Demo6Student{
  def main(args: Array[String]) {
    //定义hdfs文件索引值
    val grade_idx:Int=0
    val student_idx:Int=1
    val course_idx:Int=2
    val score_idx:Int=3
    //定义转化函数，不能转化为Int类型的，给默认值0
    def safeInt(s: String): Int = try { s.toInt } catch { case _: Throwable  => 0 }
    //定义提取key的函数
    def createKey(data: Array[String]):StudentKey={
      StudentKey(data(grade_idx),safeInt(data(score_idx)))
    }
    //定义提取value的函数
    def listData(data: Array[String]):List[String]={
      List(data(grade_idx),data(student_idx),data(course_idx),data(score_idx))
    }
    def createKeyValueTuple(data: Array[String]) :(StudentKey,List[String]) = {
      (createKey(data),listData(data))
    }
    //创建分区类
    import org.apache.spark.Partitioner
    class StudentPartitioner(partitions: Int) extends Partitioner {
      require(partitions >= 0, s"Number of partitions ($partitions) cannot be negative.")
      override def numPartitions: Int = partitions
      override def getPartition(key: Any): Int = {
        val k = key.asInstanceOf[StudentKey]
        k.grade.hashCode() % numPartitions
      }
    }
    //设置master为local，用来进行本地调试
    val conf = new SparkConf().setAppName("Student_partition_sort").setMaster("local")
    val sc = new SparkContext(conf)
    //随机数据
    val student_array =Array(
      "c001,n003,chinese,49",
      "c002,n004,english,79",
      "c002,n004,chinese,13",
      "c001,n001,english,88",
      "c001,n002,chinese,10",
      "c002,n006,chinese,29",
      "c001,n001,chinese,54",
      "c001,n002,english,32",
      "c001,n003,english,43",
      "c002,n005,english,80",
      "c002,n005,chinese,48",
      "c002,n006,english,69"
    )
    //将学生信息并行化为rdd
    val student_rdd = sc.parallelize(student_array)
    //生成key-value格式的rdd
    val student_rdd2 = student_rdd.map(line => line.split(",")).map(createKeyValueTuple)
    //根据StudentKey中的grade进行分区，并根据score降序排列
    val student_rdd3 = student_rdd2.repartitionAndSortWithinPartitions(new StudentPartitioner(10))
    //打印数据
    student_rdd3.collect.foreach(println)
  }
}
```

### 3 广播大变量

**PS:一般大于1G的不能被广播**

在开发过程中，会遇到需要在算子函数中使用外部变量的场景(尤其是大变量，比如100M以上的大集合)，那么此时就应该使用Spark的广播(Broadcast)功能来提升性能；函数中使用到外部变量时，默认情况下，Spark会将该变量复制多个副本，通过网络传输到task中，此时每个task都有一个变量副本。如果变量本身比较大的话(比如100M，甚至1G)，那么大量的变量副本在网络中传输的性能开销，以及在各个节点的Executor中占用过多内存导致的频繁GC(垃圾回收)，都会极大地影响性能；如果使用的外部变量比较大，建议使用Spark的广播功能，对该变量进行广播。广播后的变量，会保证每个Executor的内存中，只驻留一份变量副本，而Executor中的 task执行时共享该Executor中的那份变量副本。这样的话，可以大大减少变量副本的数量，从而减少网络传输的性能开销，并减少对Executor内存的占用开销，降低 GC的频率；广播大变量发送方式:Executor一开始并没有广播变量，而是task运行需要用到广播变量，会找executor的blockManager要，bloackManager需要找Driver里面的 blockManagerMaster要。PS:一般大于1G的不能被广播

```java
object Demo7Mapjoin {
  /**
    * map join将小表广播，大表使用map算子
    * 1、小表不能太大,不能超过2G
    * 2、如果driver内存不足，需要手动设置;如果广播变量大小超过了driver内存大小，会出现oom
    */
  def main(args: Array[String]): Unit = {
    val conf: SparkConf = new SparkConf().setMaster("local").setAppName("app")
    val sc: SparkContext = new SparkContext(conf)
    //RDD 不能广播
    val studentRDD: RDD[String] = sc.textFile("data/students.txt")
    //将数据拉去到driver端，变成一个map集合
    val stuMap: Map[String, String] = studentRDD
      .collect() //将rdd的数据拉取Driver端变成一个数组
      .map(s => (s.split(",")(0), s))
      .toMap
    //广播map集合
    val broStu: Broadcast[Map[String, String]] = sc.broadcast(stuMap)
    val scoreRDD: RDD[String] = sc.textFile("data/students.txt")
    //循环大表，通过key获取小表信息
    scoreRDD.map(s => {
      val sId: String = s.split(",")(0)
      //重广播变量里面获取数据
      val stuInfo: String = broStu.value.getOrElse(sId, "")
      stuInfo + "," + s
    }).foreach(println)
    while (true) {
    }
  }
}
```

### 4 优化数据

①使用 Kryo 优化序列化性能

Spark支持使用Kryo序列化机制。这种序列化机制，比默认的Java序列化机制速度要快，序列化后的数据更小，大概是Java序列化机制的1/10。所以Kryo序列化优化以后，可以让网络传输的数据变少，在集群中耗费的内存资源大大减少。而Spark之所以默认没有使用 Kryo 作为序列化类库，是因为Kryo要求最好要注册所有需要进行序列化的自定义类型，因此对于开发者来说，这种方式比较麻烦。以下是使用 Kryo 的代码示例，我们只要设置序列化类，再注册要序列化的自定义类型即可（比如算子函数中使用到的外部变量类型、作为 RDD 泛型类型的自定义类型等）：

```java
第一步，创建SparkConf对象。
val conf = new SparkConf().setMaster(...).setAppName(...)
第二步，在SparkConf中设置序列化器为KryoSerializer。
conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer") 
第三步，注册你使用的需要通过Kryo序列化的一些自定义类，SparkConf.registerKryoClasses()。 
项目中的使用： 
conf.registerKryoClasses(new Class[]{CategorySortKey.class})
```

②优化数据结构

- 在Java中有三种类型比较耗费内存：
- （1）对象；每个Java对象都有对象头、引用等额外的信息，因此比较占用内存空间。
- （2）字符串；每个字符串内部都有一个字符数组以及长度等额外信息。
- （3）集合类型；比如HashMap、LinkedList等，因为集合类型内部通常会使用一些内部类来封装集合元素，比如Map.Entry

因此Spark编码时应尽量不要使用以上三种数据结构，**尽量使用字符串代替对象，使用原始类型（比如 Int、Long）替代字符串，使用数组替代集合类型**，这样尽可能地减少内存占用，降低垃圾回收的频率提高性能。

**结尾：**

说一千道一万，在实际生产的复杂需求中，需要进行优化的时候，绝对不是以上的任何一种方案就可以了。你需要根据你的需求场景来决定，有可能是一种最合适的方案，也有可能是多种以上方案的整合体。将其运用于实战当中，招术融会贯通用起来。
