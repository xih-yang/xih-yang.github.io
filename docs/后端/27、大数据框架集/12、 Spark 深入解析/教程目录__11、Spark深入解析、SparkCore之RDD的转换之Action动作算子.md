# 11、Spark深入解析、SparkCore之RDD的转换之Action动作算子
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/11.html
- 分类：大数据框架
- 分组：教程目录
## reduce(func)案例

作用：通过func函数聚集RDD中的所有元素，先聚合分区内数据，再聚合分区间数据。

需求：创建一个RDD，将所有元素聚合得到结果。

```java
（1）创建一个RDD[Int]
scala> val rdd1 = sc.makeRDD(1 to 10,2)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[85] at makeRDD at <console>:24
（2）聚合RDD[Int]所有元素
scala> rdd1.reduce(_+_)
res50: Int = 55
（3）创建一个RDD[String]
scala> val rdd2 = sc.makeRDD(Array(("a",1),("a",3),("c",3),("d",5)))
rdd2: org.apache.spark.rdd.RDD[(String, Int)] = ParallelCollectionRDD[86] at makeRDD at <console>:24
（4）聚合RDD[String]所有数据
scala> rdd2.reduce((x,y)=>(x._1 + y._1,x._2 + y._2))
res51: (String, Int) = (adca,12)
```

## collect()案例

作用：在驱动程序中，以数组的形式返回数据集的所有元素。

需求：创建一个RDD，并将RDD内容收集到Driver端打印

```java
（1）创建一个RDD
scala> val rdd = sc.parallelize(1 to 10)
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[0] at parallelize at <console>:24
（2）将结果收集到Driver端
scala> rdd.collect
res0: Array[Int] = Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
```

## count()案例

作用：返回RDD中元素的个数

需求：创建一个RDD，统计该RDD的条数

```java
（1）创建一个RDD
scala> val rdd = sc.parallelize(1 to 10)
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[0] at parallelize at <console>:24
（2）统计该RDD的条数
scala> rdd.count
res1: Long = 10
```

## first()案例

作用：返回RDD中的第一个元素

需求：创建一个RDD，返回该RDD中的第一个元素

```java
（1）创建一个RDD
scala> val rdd = sc.parallelize(1 to 10)
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[0] at parallelize at <console>:24
（2）统计该RDD的条数
scala> rdd.first
res2: Int = 1
```

## take(n)案例

作用：返回一个由RDD的前n个元素组成的数组

需求：创建一个RDD，统计该RDD的条数

```java
（1）创建一个RDD
scala> val rdd = sc.parallelize(Array(2,5,4,6,8,3))
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[2] at parallelize at <console>:24
（2）统计该RDD的条数
scala> rdd.take(3)
res10: Array[Int] = Array(2, 5, 4)
```

## takeOrdered(n)案例

作用：返回该RDD排序后的前n个元素组成的数组

需求：创建一个RDD，统计该RDD的条数

```java
（1）创建一个RDD
scala> val rdd = sc.parallelize(Array(2,5,4,6,8,3))
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[2] at parallelize at <console>:24
（2）统计该RDD的条数
scala> rdd.takeOrdered(3)
res18: Array[Int] = Array(2, 3, 4)
```

## aggregate案例

`参数`：(zeroValue: U)(seqOp: (U, T) ⇒ U, combOp: (U, U) ⇒ U)

作用：aggregate函数将每个分区里面的元素通过seqOp和初始值进行聚合，然后用combine函数将每个分区的结果和初始值(zeroValue)进行combine操作。这个函数最终返回的类型不需要和RDD中元素类型一致。

需求：创建一个RDD，将所有元素相加得到结果

```java
（1）创建一个RDD
scala> var rdd1 = sc.makeRDD(1 to 10,2)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[88] at makeRDD at <console>:24
（2）将该RDD所有元素相加得到结果
scala> rdd.aggregate(0)(_+_,_+_)
res22: Int = 55
```

## fold(num)(func)案例

作用：折叠操作，aggregate的简化操作，seqop和combop一样。

需求：创建一个RDD，将所有元素相加得到结果

```java
（1）创建一个RDD
scala> var rdd1 = sc.makeRDD(1 to 10,2)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[88] at makeRDD at <console>:24
（2）将该RDD所有元素相加得到结果
scala> rdd.fold(0)(_+_)
res24: Int = 55
```

## saveAsTextFile(path)

作用：将数据集的元素以textfile的形式保存到HDFS文件系统或者其他支持的文件系统，对于每个元素，Spark将会调用toString方法，将它装换为文件中的文本

## saveAsSequenceFile(path)

作用：将数据集中的元素以Hadoop sequencefile的格式保存到指定的目录下，可以使HDFS或者其他Hadoop支持的文件系统。

## saveAsObjectFile(path)

作用：用于将RDD中的元素序列化成对象，存储到文件中。

## countByKey()案例

作用：针对(K,V)类型的RDD，返回一个(K,Int)的map，表示每一个key对应的元素个数。

需求：创建一个PairRDD，统计每种key的个数

```java
（1）创建一个PairRDD
scala> val rdd = sc.parallelize(List((1,3),(1,2),(1,4),(2,3),(3,6),(3,8)),3)
rdd: org.apache.spark.rdd.RDD[(Int, Int)] = ParallelCollectionRDD[95] at parallelize at <console>:24
（2）统计每种key的个数
scala> rdd.countByKey
res63: scala.collection.Map[Int,Long] = Map(3 -> 2, 1 -> 3, 2 -> 1)
```

## foreach(func)案例

作用：在数据集的每一个元素上，运行函数func进行更新。

需求：创建一个RDD，对每个元素进行打印

```java
（1）创建一个RDD
scala> var rdd = sc.makeRDD(1 to 5,2)
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[107] at makeRDD at <console>:24
（2）对该RDD每个元素进行打印
scala> rdd.foreach(println(_))
3
4
5
1
2
```
