# 09、Spark深入解析、SparkCore之RDD的转换-双Value类型
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/9.html
- 分类：大数据框架
- 分组：教程目录
## union(otherDataset) 案例

作用：对源RDD和参数RDD求并集后返回一个新的RDD

需求：创建两个RDD，求并集

```java
（1）创建第一个RDD
scala> val rdd1 = sc.parallelize(1 to 5)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[23] at parallelize at <console>:24
（2）创建第二个RDD
scala> val rdd2 = sc.parallelize(5 to 10)
rdd2: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[24] at parallelize at <console>:24
（3）计算两个RDD的并集
scala> val rdd3 = rdd1.union(rdd2)
rdd3: org.apache.spark.rdd.RDD[Int] = UnionRDD[25] at union at <console>:28
（4）打印并集结果
scala> rdd3.collect()
res18: Array[Int] = Array(1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10)
```

## subtract (otherDataset) 案例

作用：计算差的一种函数，去除两个RDD中相同的元素，不同的RDD将保留下来

需求：创建两个RDD，求第一个RDD与第二个RDD的差集

```java
（1）创建第一个RDD
scala> val rdd = sc.parallelize(3 to 8)
rdd: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[70] at parallelize at <console>:24
（2）创建第二个RDD
scala> val rdd1 = sc.parallelize(1 to 5)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[71] at parallelize at <console>:24
（3）计算第一个RDD与第二个RDD的差集并打印
scala> rdd.subtract(rdd1).collect()
res27: Array[Int] = Array(8, 6, 7)
```

## intersection(otherDataset) 案例

作用：对源RDD和参数RDD求交集后返回一个新的RDD

需求：创建两个RDD，求两个RDD的交集

```java
（1）创建第一个RDD
scala> val rdd1 = sc.parallelize(1 to 7)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[26] at parallelize at <console>:24
（2）创建第二个RDD
scala> val rdd2 = sc.parallelize(5 to 10)
rdd2: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[27] at parallelize at <console>:24
（3）计算两个RDD的交集
scala> val rdd3 = rdd1.intersection(rdd2)
rdd3: org.apache.spark.rdd.RDD[Int] = MapPartitionsRDD[33] at intersection at <console>:28
（4）打印计算结果
scala> rdd3.collect()
res19: Array[Int] = Array(5, 6, 7)
```

## cartesian(otherDataset) 案例

作用：笛卡尔积（**尽量避免使用**）

需求：创建两个RDD，计算两个RDD的笛卡尔积

```java
（1）创建第一个RDD
scala> val rdd1 = sc.parallelize(1 to 3)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[47] at parallelize at <console>:24
（2）创建第二个RDD
scala> val rdd2 = sc.parallelize(2 to 5)
rdd2: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[48] at parallelize at <console>:24
（3）计算两个RDD的笛卡尔积并打印
scala> rdd1.cartesian(rdd2).collect()
res17: Array[(Int, Int)] = Array((1,2), (1,3), (1,4), (1,5), (2,2), (2,3), (2,4), (2,5), (3,2), (3,3), (3,4), (3,5))
```

## zip(otherDataset)案例

作用：将两个RDD组合成Key/Value形式的RDD,这里默认两个RDD的partition数量以及元素数量都相同，否则会抛出异常。

需求：创建两个RDD，并将两个RDD组合到一起形成一个(k,v)RDD

```java
（1）创建第一个RDD
scala> val rdd1 = sc.parallelize(Array(1,2,3),3)
rdd1: org.apache.spark.rdd.RDD[Int] = ParallelCollectionRDD[1] at parallelize at <console>:24
（2）创建第二个RDD（与1分区数相同）
scala> val rdd2 = sc.parallelize(Array("a","b","c"),3)
rdd2: org.apache.spark.rdd.RDD[String] = ParallelCollectionRDD[2] at parallelize at <console>:24
（3）第一个RDD组合第二个RDD并打印
scala> rdd1.zip(rdd2).collect
res1: Array[(Int, String)] = Array((1,a), (2,b), (3,c))
（4）第二个RDD组合第一个RDD并打印
scala> rdd2.zip(rdd1).collect
res2: Array[(String, Int)] = Array((a,1), (b,2), (c,3))
（5）创建第三个RDD（与1,2分区数不同）
scala> val rdd3 = sc.parallelize(Array("a","b","c"),2)
rdd3: org.apache.spark.rdd.RDD[String] = ParallelCollectionRDD[5] at parallelize at <console>:24
（6）第一个RDD组合第三个RDD并打印
scala> rdd1.zip(rdd3).collect
java.lang.IllegalArgumentException: Can't zip RDDs with unequal numbers of partitions: List(3, 2)
//此处因为第三个RDD和第一个RDD的分区数不同，所以会报错
  at org.apache.spark.rdd.ZippedPartitionsBaseRDD.getPartitions(ZippedPartitionsRDD.scala:57)
  at org.apache.spark.rdd.RDD$$anonfun$partitions$2.apply(RDD.scala:252)
  at org.apache.spark.rdd.RDD$$anonfun$partitions$2.apply(RDD.scala:250)
  at scala.Option.getOrElse(Option.scala:121)
  at org.apache.spark.rdd.RDD.partitions(RDD.scala:250)
  at org.apache.spark.SparkContext.runJob(SparkContext.scala:1965)
  at org.apache.spark.rdd.RDD$$anonfun$collect$1.apply(RDD.scala:936)
  at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:151)
  at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:112)
  at org.apache.spark.rdd.RDD.withScope(RDD.scala:362)
  at org.apache.spark.rdd.RDD.collect(RDD.scala:935)
  ... 48 elided
```
