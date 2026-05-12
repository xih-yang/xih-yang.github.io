# 12、Spark深入解析、SparkCore之RDD中的函数传递
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/12.html
- 分类：大数据框架
- 分组：教程目录
在实际开发中我们往往需要自己定义一些对于RDD的操作，那么此时需要主要的是，初始化工作是在Driver端进行的，而实际运行程序是在Executor端进行的，这就涉及到了跨进程通信，是需要序列化的。

## 传递一个方法

**1．创建一个类**

```java
class Search(s:String){
//过滤出包含字符串的数据
  def isMatch(s: String): Boolean = {
    s.contains(query)
  }
//过滤出包含字符串的RDD
  def getMatch1 (rdd: RDD[String]): RDD[String] = {
    rdd.filter(isMatch)
  }
  //过滤出包含字符串的RDD
  def getMatche2(rdd: RDD[String]): RDD[String] = {
    rdd.filter(x => x.contains(query))
  }
}
```

**2．创建Spark主程序**

```java
object SeriTest {
  def main(args: Array[String]): Unit = {
    //1.初始化配置信息及SparkContext
    val sparkConf: SparkConf = new SparkConf().setAppName("WordCount").setMaster("local[*]")
    val sc = new SparkContext(sparkConf)
//2.创建一个RDD
    val rdd: RDD[String] = sc.parallelize(Array("hadoop", "spark", "hive", "atguigu"))
//3.创建一个Search对象
    val search = new Search()
//4.运用第一个过滤函数并打印结果
    val match1: RDD[String] = search.getMatche1(rdd)
    match1.collect().foreach(println)
    }
}
```

**3．运行程序**

```java
Exception in thread "main" org.apache.spark.SparkException: Task not serializable
    at org.apache.spark.util.ClosureCleaner$.ensureSerializable(ClosureCleaner.scala:298)
    at org.apache.spark.util.ClosureCleaner$.org$apache$spark$util$ClosureCleaner$$clean(ClosureCleaner.scala:288)
    at org.apache.spark.util.ClosureCleaner$.clean(ClosureCleaner.scala:108)
    at org.apache.spark.SparkContext.clean(SparkContext.scala:2101)
    at org.apache.spark.rdd.RDD$$anonfun$filter$1.apply(RDD.scala:387)
    at org.apache.spark.rdd.RDD$$anonfun$filter$1.apply(RDD.scala:386)
    at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:151)
    at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:112)
    at org.apache.spark.rdd.RDD.withScope(RDD.scala:362)
    at org.apache.spark.rdd.RDD.filter(RDD.scala:386)
    at com.atguigu.Search.getMatche1(SeriTest.scala:39)
    at com.atguigu.SeriTest$.main(SeriTest.scala:18)
    at com.atguigu.SeriTest.main(SeriTest.scala)
Caused by: java.io.NotSerializableException: com.atguigu.Search
```

**4．问题说明**

```java
//过滤出包含字符串的RDD
  def getMatch1 (rdd: RDD[String]): RDD[String] = {
    rdd.filter(isMatch)
  }
```

在这个方法中所调用的方法isMatch()是定义在Search这个类中的，实际上调用的是this. isMatch()，this表示Search这个类的对象，程序在运行过程中需要将Search对象序列化以后传递到Executor端。

**5．解决方案**

```java
使类继承scala.Serializable即可。
class Search() extends Serializable{
     ...}
```

## 传递一个属性

**1．创建Spark主程序**

```java
object TransmitTest {
  def main(args: Array[String]): Unit = {
    //1.初始化配置信息及SparkContext
    val sparkConf: SparkConf = new SparkConf().setAppName("WordCount").setMaster("local[*]")
    val sc = new SparkContext(sparkConf)
//2.创建一个RDD
    val rdd: RDD[String] = sc.parallelize(Array("hadoop", "spark", "hive", "atguigu"))
//3.创建一个Search对象
    val search = new Search()
//4.运用第一个过滤函数并打印结果
    val match1: RDD[String] = search.getMatche2(rdd)
    match1.collect().foreach(println)
    }
}
```

**2．运行程序**

```java
Exception in thread "main" org.apache.spark.SparkException: Task not serializable
    at org.apache.spark.util.ClosureCleaner$.ensureSerializable(ClosureCleaner.scala:298)
    at org.apache.spark.util.ClosureCleaner$.org$apache$spark$util$ClosureCleaner$$clean(ClosureCleaner.scala:288)
    at org.apache.spark.util.ClosureCleaner$.clean(ClosureCleaner.scala:108)
    at org.apache.spark.SparkContext.clean(SparkContext.scala:2101)
    at org.apache.spark.rdd.RDD$$anonfun$filter$1.apply(RDD.scala:387)
    at org.apache.spark.rdd.RDD$$anonfun$filter$1.apply(RDD.scala:386)
    at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:151)
    at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:112)
    at org.apache.spark.rdd.RDD.withScope(RDD.scala:362)
    at org.apache.spark.rdd.RDD.filter(RDD.scala:386)
    at com.atguigu.Search.getMatche1(SeriTest.scala:39)
    at com.atguigu.SeriTest$.main(SeriTest.scala:18)
    at com.atguigu.SeriTest.main(SeriTest.scala)
Caused by: java.io.NotSerializableException: com.atguigu.Search
```

**3．问题说明**

```java
 //过滤出包含字符串的RDD
  def getMatche2(rdd: RDD[String]): RDD[String] = {
    rdd.filter(x => x.contains(query))
  }
```

在这个方法中所调用的方法query是定义在Search这个类中的字段，实际上调用的是this. query，this表示Search这个类的对象，程序在运行过程中需要将Search对象序列化以后传递到Executor端。

**4．解决方案**

1）使类继承scala.Serializable即可。

```java
class Search() extends Serializable{
     ...}
```

2）将类变量query赋值给局部变量

```java
修改getMatche2为
  //过滤出包含字符串的RDD
  def getMatche2(rdd: RDD[String]): RDD[String] = {
    val query_ : String = this.query//将类变量赋值给局部变量
    rdd.filter(x => x.contains(query_))
  }
```
