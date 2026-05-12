# 14、Hive 实战 - Hive调优之Explain查看执行计划
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/14.html
- 分类：大数据框架
- 分组：教程目录
## 1. 基本语法

```java
EXPLAIN [EXTENDED | DEPENDENCY | AUTHORIZATION] query-sql
```

## 2. 案例实操

### 2.1. 查看执行计划

1）没有生成MR任务的

> hive (default)> explain select * from emp;
>
> Explain
>
> STAGE DEPENDENCIES:
>
> Stage-0 is a root stage
>
> STAGE PLANS:
>
> Stage: Stage-0
>
> Fetch Operator
>
> limit: -1
>
> Processor Tree:
>
> TableScan
>
> alias: emp
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> Select Operator
>
> expressions: empno (type: int), ename (type: string), job (type: string), mgr (type: int), hiredate (type: string), sal (type: double), comm (type: double), deptno (type: int)
>
> outputColumnNames: _col0, _col1, _col2, _col3, _col4, _col5, _col6, _col7
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> ListSink

2）有生成MR任务的

> hive (default)> explain select deptno, avg(sal) avg_sal from emp group by deptno;
>
> Explain
>
> STAGE DEPENDENCIES:
>
> Stage-1 is a root stage
>
> Stage-0 depends on stages: Stage-1
>
> STAGE PLANS:
>
> Stage: Stage-1
>
> Map Reduce
>
> Map Operator Tree:
>
> TableScan
>
> alias: emp
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> Select Operator
>
> expressions: sal (type: double), deptno (type: int)
>
> outputColumnNames: sal, deptno
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> Group By Operator
>
> aggregations: sum(sal), count(sal)
>
> keys: deptno (type: int)
>
> mode: hash
>
> outputColumnNames: _col0, _col1, _col2
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> Reduce Output Operator
>
> key expressions: _col0 (type: int)
>
> sort order: +
>
> Map-reduce partition columns: _col0 (type: int)
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> value expressions: _col1 (type: double), _col2 (type: bigint)
>
> Execution mode: vectorized
>
> Reduce Operator Tree:
>
> Group By Operator
>
> aggregations: sum(VALUE._col0), count(VALUE._col1)
>
> keys: KEY._col0 (type: int)
>
> mode: mergepartial
>
> outputColumnNames: _col0, _col1, _col2
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> Select Operator
>
> expressions: _col0 (type: int), (_col1 / _col2) (type: double)
>
> outputColumnNames: _col0, _col1
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> File Output Operator
>
> compressed: false
>
> Statistics: Num rows: 1 Data size: 7020 Basic stats: COMPLETE Column stats: NONE
>
> table:
>
> input format: org.apache.hadoop.mapred.SequenceFileInputFormat
>
> output format: org.apache.hadoop.hive.ql.io.HiveSequenceFileOutputFormat
>
> serde: org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe
>
> Stage: Stage-0
>
> Fetch Operator
>
> limit: -1
>
> Processor Tree:
>
> ListSink

### 2.2. 查看详细执行计划

添加关键词 extended

```java
hive (default)> explain extended select * from emp;
hive (default)> explain extended select deptno, avg(sal) avg_sal from emp group by deptno;
```
