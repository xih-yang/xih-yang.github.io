# 09、Hive 实战 - Hive查询之排序
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/9.html
- 分类：大数据框架
- 分组：教程目录
## 1. 全局排序（Order By）

Order By：全局排序，只有一个Reducer

**1）使用 ORDER BY 子句排序**

- ASC（ascend）: 升序（默认）
- DESC（descend）: 降序

**2）ORDER BY 子句在SELECT语句的结尾**

**3）案例实操**

> 查询员工信息按工资升序排列

```java
hive (default)> select * from emp order by sal;
```

> 查询员工信息按工资降序排列

```java
hive (default)> select * from emp order by sal desc;
```

## 2. 按照别名排序

例：按照员工薪水的2倍排序

```java
hive (default)> select ename, sal*2 twosal from emp order by twosal;
```

## 3. 多个列排序

例：按照部门和工资升序排序

```java
hive (default)> select ename, deptno, sal from emp order by deptno, sal;
```

## 4. 每个Reduce内部排序（Sort By）

- Sort By：对于大规模的数据集order by的效率非常低。在很多情况下，并不需要全局排序，此时可以使用sort by。
- Sort by为每个reducer产生一个排序文件。每个Reducer内部进行排序，对全局结果集来说不是排序。

> 1）设置reduce个数

```java
hive (default)> set mapreduce.job.reduces=3;
```

> 2）查看设置reduce个数

```java
hive (default)> set mapreduce.job.reduces;
```

> 3）根据部门编号降序查看员工信息

```java
hive (default)> select * from emp sort by deptno desc;
```

> 4）将查询结果导入到文件中（按照部门编号降序排序）

```java
insert overwrite local directory '/opt/module/data/sortby-result'
select 
    * 
from emp 
sort by deptno desc
```

## 5. 分区（Distribute By）

- Distribute By： 在有些情况下，我们需要控制某个特定行应该到哪个reducer，通常是为了进行后续的聚集操作。distribute by 子句可以做这件事。distribute by类似MR中partition（自定义分区），进行分区，结合sort by使用。
- 对于distribute by进行测试，一定要分配多reduce进行处理，否则无法看到distribute by的效果。

例：先按照部门编号分区，再按照员工编号降序排序。

```java
hive (default)> set mapreduce.job.reduces=3;
hive (default)> insert overwrite local directory '/opt/module/data/distribute-result' select * from emp distribute by deptno sort by empno desc;
```

> 注意：
>
> distribute by的分区规则是根据分区字段的hash码与reduce的个数进行模除后，余数相同的分到一个区。
> Hive要求DISTRIBUTE BY语句要写在SORT BY语句之前。

## 6. Cluster By

- 当distribute by和sorts by字段相同时，可以使用cluster by方式。
- cluster by除了具有distribute by的功能外还兼具sort by的功能。但是排序只能是升序排序，不能指定排序规则为ASC或者DESC。

例：以下两种写法等价

```java
hive (default)> select * from emp cluster by deptno;
hive (default)> select * from emp distribute by deptno sort by deptno;
```

> 注意：

> 按照部门编号分区，不一定就是固定死的数值，可以是20号和30号部门分到一个分区里面去。
