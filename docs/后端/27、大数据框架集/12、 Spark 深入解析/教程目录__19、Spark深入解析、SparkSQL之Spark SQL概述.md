# 19、Spark深入解析、SparkSQL之Spark SQL概述
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/19.html
- 分类：大数据框架
- 分组：教程目录
## Spark SQL官方介绍

**官网**

[http://spark.apache.org/sql/](http://spark.apache.org/sql/)

### 什么是Spark SQL

Spark SQL是Spark用来处理结构化数据的一个模块，它提供了2个编程抽象：**DataFrame和DataSet**，并且作为`分布式SQL查询引擎`的作用。

我们已经学习了Hive，它是 **将Hive SQL转换成MapReduce然后提交到集群上执行，大大简化了编写MapReduc的程序的复杂性** ，由于MapReduce这种计算模型执行效率比较慢。所有Spark SQL的应运而生，它是将Spark SQL转换成RDD，然后提交到集群执行，执行效率非常快！

### Spark SQL的特点

**1、易整合**

- 可以使用java、scala、python、R等语言的API操作。

**2、统一的数据访问方式**

- 连接到任何数据源的方式相同。

**3、兼容Hive**

- 支持hiveHQL的语法。
- 兼容hive(元数据库、SQL语法、UDF、序列化、反序列化机制)

**4、标准的数据连接**

- 可以使用行业标准的JDBC或ODBC连接。

### Spark SQL的优缺点

**优点**

- 表达非常清晰, 比如说这段 SQL 明显就是为了查询三个字段，条件是查询年龄大于 10 岁的
- 难度低、易学习。

**缺点**

- 复杂分析,SQL嵌套较多：试想一下3层嵌套的 SQL维护起来应该挺力不从心的吧
- 机器学习较难：试想一下如果使用SQL来实现机器学习算法也挺为难的吧

### Hive和Spark SQL

**Hive是将SQL转为MapReduce**

SparkSQL可以理解成是将SQL解析成’RDD’ + 优化再执行

## Spark SQL数据抽象

**两种数据抽象**

- DataFrame
- DataSet

### 什么是 DataFrame

**DataFrame是一种以RDD为基础的带有Schema元信息的分布式数据集**，类似于传统数据库的二维表格。

除了数据以外，还记录数据的结构信息，即schema。同时，与Hive类似，DataFrame也支持嵌套数据类型（struct、array和map）。从API易用性的角度上看，DataFrame API提供的是一套高层的关系操作，比函数式的RDD API要更加友好，门槛更低。

上图直观地体现了DataFrame和RDD的区别。左侧的RDD[Person]虽然以Person为类型参数，但Spark框架本身不了解Person类的内部结构。而右侧的DataFrame却提供了详细的结构信息，使得Spark SQL可以清楚地知道该数据集中包含哪些列，每列的名称和类型各是什么。DataFrame是为数据提供了Schema的视图。可以把它当做数据库中的一张表来对待，DataFrame也是懒执行的。性能上比RDD要高，主要原因：

**优化的执行计划：查询计划通过Spark catalyst optimiser进行优化。**

**如下示例：**

为了说明**查询优化**，图中构造了`两个`DataFrame，将它们`join`之后又做了一次`filter`操作。如果原封不动地执行这个执行计划，最终的执行效率是不高的。因为join是一个代价较大的操作，也可能会产生一个较大的数据集。如果我们能将filter`下推`到 join下方，`先对DataFrame进行过滤，再join过滤后的较小的结果集，便可以有效缩短执行时间`。而Spark SQL的查询优化器正是这样做的。简而言之，逻辑查询计划优化就是一个利用基于关系代数的等价变换，将高成本的操作替换为低成本操作的过程。

### 什么是 DataSet

1）** DataSet是保存了更多的描述信息，类型信息的分布式数据集。**

2）与RDD相比，保存了更多的描述信息，概念上等同于关系型数据库中的二维表。

3）与DataFrame相比，保存了类型信息，是强类型的，提供了编译时类型检查。

4）调用Dataset的方法先会生成逻辑计划，然后被spark的优化器进行优化，最终生成物理计划，然后提交到集群中运行！

**DataSet包含了DataFrame的功能，**

Spark2.0中两者统一，DataFrame表示为DataSet[Row]，即DataSet的子集。

DataFrame其实就是Dateset[Row]。

### RDD、DataFrame、DataSet的区别

**结构图解**

RDD[Person]

- 以Person为类型参数，但不了解 其内部结构。

DataFrame

- 提供了详细的结构信息schema列的名称和类型。这样看起来就像一张表了

DataSet[Person]

- 不光有schema信息，还有类型信息
