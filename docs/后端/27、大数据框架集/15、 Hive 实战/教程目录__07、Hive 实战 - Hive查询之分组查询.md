# 07、Hive 实战 - Hive查询之分组查询
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/7.html
- 分类：大数据框架
- 分组：教程目录
## 1. Group By语句

GROUP BY语句通常会和聚合函数一起使用，按照一个或者多个列队结果进行分组，然后对每个组执行聚合操作。

1）计算emp表每个部门的平均工资

```java
hive (default)> select t.deptno, avg(t.sal) avg_sal from emp t group by t.deptno;
```

2）计算emp每个部门中每个岗位的最高薪水

```java
hive (default)> select t.deptno, t.job, max(t.sal) max_sal from emp t group by t.deptno, t.job;
```

## 2. Having语句

### 2.1. having与where不同点

1）where后面不能写分组函数，而having后面可以使用分组函数。

2）having只用于group by分组统计语句。

### 2.2. 案例实操

1）求每个部门的平均工资

```java
hive (default)> select deptno, avg(sal) from emp group by deptno;
```

2）求每个部门的平均薪水大于2000的部门

```java
hive (default)> select deptno, avg(sal) avg_sal from emp group by deptno having avg_sal > 2000;
```
