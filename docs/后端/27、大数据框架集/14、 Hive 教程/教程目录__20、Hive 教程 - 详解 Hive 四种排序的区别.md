# 20、Hive 教程 - 详解 Hive 四种排序的区别
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/20.html
- 分类：大数据框架
- 分组：教程目录
## 排序

### 6.5.1 全局排序（Order By）

Order By：全局排序，只有一个Reducer

1．使用 ORDER BY 子句排序

ASC（ascend）: 升序（默认）

DESC（descend）: 降序

2．ORDER BY 子句在SELECT语句的结尾

3．案例实操

（1）查询员工信息按工资升序排列

hive (default)> select * from emp order by sal;

（2）查询员工信息按工资降序排列

hive (default)> select * from emp order by sal desc;

### 6.5.2 按照别名排序

按照员工薪水的2倍排序

hive (default)> select ename, sal*2 twosal from emp order by twosal;

### 6.5.3 多个列排序

按照部门和工资升序排序

hive (default)> select ename, deptno, sal from emp order by deptno, sal ;

### 6.5.4 每个MapReduce内部排序（Sort By）

Sort By：对于大规模的数据集order by的效率非常低。在很多情况下，并不需要全局排序，此时可以使用**sort by**。

Sort by为每个reducer产生一个排序文件。每个Reducer内部进行排序，对全局结果集来说不是排序。

1．设置reduce个数

hive (default)> set mapreduce.job.reduces=3;

2．查看设置reduce个数

hive (default)> set mapreduce.job.reduces;

3．根据部门编号降序查看员工信息

hive (default)> select * from emp sort by deptno desc;

4．将查询结果导入到文件中（按照部门编号降序排序）

hive (default)> insert overwrite local directory '/opt/module/datas/sortby-result'

select * from emp sort by deptno desc;

### 6.5.5 分区排序（Distribute By）

Distribute By： 在有些情况下，我们需要控制某个特定行应该到哪个reducer，通常是为了进行后续的聚集操作。**distribute by** 子句可以做这件事。**distribute by**类似MR中partition（自定义分区），进行分区，结合sort by使用。

对于distribute by进行测试，一定要分配多reduce进行处理，否则无法看到distribute by的效果。

案例实操：

（1）先按照部门编号分区，再按照员工编号降序排序。

hive (default)> set mapreduce.job.reduces=3;

hive (default)> insert overwrite local directory '/opt/module/datas/distribute-result' select * from emp distribute by deptno sort by empno desc;

注意：

**1、** distributeby的分区规则是根据分区字段的hash码与reduce的个数进行模除后，余数相同的分到一个区；

**2、** Hive要求DISTRIBUTEBY语句要写在SORTBY语句之前；

### 6.5.6 Cluster By

当distribute by和sorts by字段相同时，可以使用cluster by方式。

cluster by除了具有distribute by的功能外还兼具sort by的功能。但是排序只能是升序排序，不能指定排序规则为ASC或者DESC。

1）以下两种写法等价

hive (default)> select * from emp cluster by deptno;

hive (default)> select * from emp distribute by deptno sort by deptno;

注意：按照部门编号分区，不一定就是固定死的数值，可以是20号和30号部门分到一个分区里面去。

**总结：**

**1、** orderby//可以指定desc降序asc升序；

**order by会对输入做全局排序，因此只有一个Reducer(多个Reducer无法保证全局有序)，然而只有一个Reducer，会导致当输入规模较大时，消耗较长的计算时间**。

**2、** sortby；

**sort by不是全局排序，其在数据进入reducer完成排序，因此，如果用sort by进行排序，并且设置mapred.reduce.tasks>1，则sort by只会保证每个reducer的输出有序，并不保证全局有序**。sort by不同于order by，它不受Hive.mapred.mode属性的影响，sort by的数据只能保证在同一个reduce中的数据可以按指定字段排序。使用sort by你可以指定执行的reduce个数(通过set mapred.reduce.tasks=n来指定)，对输出的数据再执行归并排序，即可得到全部结果。

**3、** distributeby(重要)；

**distribute by是控制在map端如何拆分数据给reduce端的**。hive会根据distribute by后面列，对应reduce的个数进行分发，默认是采用**hash**算法。sort by为每个reduce产生一个排序文件。在有些情况下，你需要控制某个特定行应该到哪个reducer，这通常是为了进行后续的聚集操作。distribute by刚好可以做这件事。因此，distribute by经常和sort by配合使用。

**注：Distribute by和sort by的使用场景**

**1、** Map输出的文件大小不均；

**2、** Reduce输出文件大小不均；

**3、** 小文件过多；

**4、** 文件超大；

**4、** clusterby；

cluster by除了具有distribute by的功能外还兼具sort by的功能。但是排序只能是升序排序，不能指定排序规则为ASC或者DESC。
