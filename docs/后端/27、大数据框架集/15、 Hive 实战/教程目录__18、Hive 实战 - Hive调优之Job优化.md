# 18、Hive 实战 - Hive调优之Job优化
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/18.html
- 分类：大数据框架
- 分组：教程目录
## 1. Hive Map优化

### 1.1. 复杂文件增加Map数

当input的文件都很大，任务逻辑复杂，map执行非常慢的时候，可以考虑增加Map数，来使得每个map处理的数据量减少，从而提高任务的执行效率。

增加map的方法为：根据computeSliteSize(Math.max(minSize,Math.min(maxSize,blocksize)))=blocksize=128M公式，调整maxSize最大值。让maxSize最大值低于blocksize就可以增加map的个数。

1）执行查询

```java
hive (default)> select count(*) from emp;
Hadoop job information for Stage-1: number of mappers: 1; number of reducers: 1
```

2）设置最大切片值为100个字节

```java
hive (default)> set mapreduce.input.fileinputformat.split.maxsize=100;
hive (default)> select count(*) from emp;
Hadoop job information for Stage-1: number of mappers: 6; number of reducers: 1
```

### 1.2. 小文件进行合并

1）在map执行前合并小文件，减少map数：CombineHiveInputFormat具有对小文件进行合并的功能（系统默认的格式）。HiveInputFormat没有对小文件合并功能。

```java
set hive.input.format= org.apache.hadoop.hive.ql.io.CombineHiveInputFormat;
```

2）在Map-Reduce的任务结束时合并小文件的设置：

```java
-- 在map-only任务结束时合并小文件，默认true
set hive.merge.mapfiles = true;
-- 在map-reduce任务结束时合并小文件，默认false
set hive.merge.mapredfiles = true;
-- 合并文件的大小，默认256M
set hive.merge.size.per.task = 268435456;
-- 当输出文件的平均大小小于该值时，启动一个独立的map-reduce任务进行文件merge
set hive.merge.smallfiles.avgsize = 16777216;
```

### 1.3. Map端聚合

```java
set hive.map.aggr=true;相当于map端执行combiner
```

### 1.4. 推测执行

```java
set mapred.map.tasks.speculative.execution = true默认是true
```

## 2. Hive Reduce优化

### 2.1. 合理设置Reduce数

1）调整reduce个数方法一：

> 每个Reduce处理的数据量默认是256MB

```java
set hive.exec.reducers.bytes.per.reducer = 256000000
```

> 每个任务最大的reduce数，默认为1009

```java
set hive.exec.reducers.max = 1009
```

> 计算reducer数的公式

```java
N=min(参数2，总输入数据量/参数1)(参数2 指的是上面的1009，参数1值得是256M)
```

2）调整reduce个数方法二：

> 在hadoop的mapred-default.xml文件中修改，设置每个job的Reduce个数

```java
set mapreduce.job.reduces = 15;
```

3）reduce个数并不是越多越好

> 过多的启动和初始化reduce也会消耗时间和资源；
> 另外，有多少个reduce，就会有多少个输出文件，如果生成了很多个小文件，那么如果这些小文件作为下一个任务的输入，则也会出现小文件过多的问题；
>
> 在设置reduce个数的时候也需要考虑这两个原则：处理大数据量利用合适的reduce数；使单个reduce任务处理数据量大小要合适；

### 2.2. 推测执行

```java
mapred.reduce.tasks.speculative.execution （hadoop里面的）
hive.mapred.reduce.tasks.speculative.execution（hive里面相同的参数，效果和hadoop里面的一样两个随便哪个都行）
```

## 3. Hive任务整体优化

### 3.1. Fetch抓取

Fetch抓取是指，Hive中对某些情况的查询可以不必使用MapReduce计算。例如：SELECT * FROM emp;在这种情况下，Hive可以简单地读取emp对应的存储目录下的文件，然后输出查询结果到控制台。

在hive-default.xml.template文件中hive.fetch.task.conversion默认是more，老版本hive默认是minimal，该属性修改为more以后，在全局查找、字段查找、limit查找等都不走mapreduce。

```java
<property>
    <name>hive.fetch.task.conversion</name>
    <value>more</value>
    <description>
      Expects one of [none, minimal, more].
      Some select queries can be converted to single FETCH task minimizing latency.
      Currently the query should be single sourced not having any subquery and should not have any aggregations or distincts (which incurs RS), lateral views and joins.
      0. none : disable hive.fetch.task.conversion
      1. minimal : SELECT STAR, FILTER on partition columns, LIMIT only
      2. more  : SELECT, FILTER, LIMIT only (support TABLESAMPLE and virtual columns)
    </description>
</property>
```

案例实操如下：

> 把hive.fetch.task.conversion设置成none，然后执行查询语句，都会执行mapreduce程序。

```java
hive (default)> set hive.fetch.task.conversion=none;
hive (default)> select * from emp;
hive (default)> select ename from emp;
hive (default)> select ename from emp limit 3;
```

> 把hive.fetch.task.conversion设置成more，然后执行查询语句，如下查询方式都不会执行mapreduce程序。

```java
hive (default)> set hive.fetch.task.conversion=more;
hive (default)> select * from emp;
hive (default)> select ename from emp;
hive (default)> select ename from emp limit 3;
```

### 3.2. 本地模式

大多数的Hadoop Job是需要Hadoop提供的完整的可扩展性来处理大数据集的。不过，有时Hive的输入数据量是非常小的。在这种情况下，为查询触发执行任务消耗的时间可能会比实际job的执行时间要多的多。对于大多数这种情况，Hive可以通过本地模式在单台机器上处理所有的任务。对于小数据集，执行时间可以明显被缩短。

用户可以通过设置hive.exec.mode.local.auto的值为true，来让Hive在适当的时候自动启动这个优化。

```java
set hive.exec.mode.local.auto=true;  //开启本地mr
-- 设置local mr的最大输入数据量，当输入数据量小于这个值时采用local  mr的方式，默认为134217728，即128M
set hive.exec.mode.local.auto.inputbytes.max=50000000;
-- 设置local mr的最大输入文件个数，当输入文件个数小于这个值时采用local mr的方式，默认为4
set hive.exec.mode.local.auto.input.files.max=10;
```

案例实操如下：

> 开启本地模式，并执行查询语句

```java
hive (default)> set hive.exec.mode.local.auto=true;
hive (default)> select * from emp cluster by deptno;
Time taken: 1.328 seconds, Fetched: 14 row(s)
```

> 关闭本地模式，并执行查询语句

```java
hive (default)> set hive.exec.mode.local.auto=false;
hive (default)> select * from emp cluster by deptno;
Time taken: 20.09 seconds, Fetched: 14 row(s)
```

### 3.3. 并行执行

Hive会将一个查询转化成一个或者多个阶段。这样的阶段可以是MapReduce阶段、抽样阶段、合并阶段、limit阶段。或者Hive执行过程中可能需要的其他阶段。默认情况下，Hive一次只会执行一个阶段。不过，某个特定的job可能包含众多的阶段，而这些阶段可能并非完全互相依赖的，也就是说有些阶段是可以并行执行的，这样可能使得整个job的执行时间缩短。不过，如果有更多的阶段可以并行执行，那么job可能就越快完成。

通过设置参数hive.exec.parallel值为true，就可以开启并发执行。不过，在共享集群中，需要注意下，如果job中并行阶段增多，那么集群利用率就会增加。

```java
set hive.exec.parallel=true;               //打开任务并行执行，默认为false
set hive.exec.parallel.thread.number=16; //同一个sql允许最大并行度，默认为8
```

当然，得是在系统资源比较空闲的时候才有优势，否则，没资源，并行也起不来(建议在数据量大,sql很长的时候使用,数据量小,sql比较的小开启有可能还不如之前快)。

### 3.4. 严格模式

Hive可以通过设置防止一些危险操作：

**1）分区表不使用分区过滤：**

将hive.strict.checks.no.partition.filter设置为true时，对于分区表，除非where语句中含有分区字段过滤条件来限制范围，否则不允许执行。换句话说，就是用户不允许扫描所有分区。进行这个限制的原因是，通常分区表都拥有非常大的数据集，而且数据增加迅速。没有进行分区限制的查询可能会消耗令人不可接受的巨大资源来处理这个表。

**2）使用order by没有limit过滤：**

将hive.strict.checks.orderby.no.limit设置为true时，对于使用了order by语句的查询，要求必须使用limit语句。因为order by为了执行排序过程会将所有的结果数据分发到同一个Reducer中进行处理，强制要求用户增加这个LIMIT语句可以防止Reducer额外执行很长一段时间(开启了limit可以在数据进入到reduce之前就减少一部分数据)。

**3）笛卡尔积：**

将hive.strict.checks.cartesian.product设置为true时，会限制笛卡尔积的查询。对关系型数据库非常了解的用户可能期望在 执行JOIN查询的时候不使用ON语句而是使用where语句，这样关系数据库的执行优化器就可以高效地将WHERE语句转化成那个ON语句。不幸的是，Hive并不会执行这种优化，因此，如果表足够大，那么这个查询就会出现不可控的情况。
